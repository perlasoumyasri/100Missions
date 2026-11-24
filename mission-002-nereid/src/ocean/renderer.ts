/**
 * NEREID ocean renderer. The pass graph is vgpu's fft-ocean example (MIT): noise → Phillips
 * spectrum → per-frame dispersion → 18 Stockham IFFT passes → normals/foam → instanced particles
 * → five-level bloom → present. Changes from the original:
 *  - the camera, pulse, scan and grade come from a per-frame callback instead of constants;
 *  - scene and bloom targets are sized by an adaptive quality tier, independent of the canvas DPR;
 *  - particles can be drawn at a stride for the lowest tier;
 *  - present adds ground colour, horizon haze, vignette, grain and a visibility fade.
 */
import {
  clock,
  draw,
  effect,
  frameLoop,
  init,
  sampler,
  surface,
  target,
  type Draw,
  type Effect,
  type Frame,
  type FrameLoopHandle,
  type Gpu,
  type ShaderSource,
  type Surface,
  type Target,
} from "vgpu";

import { TIERS, type Tier, type TierSettings } from "../lib/quality";
import bloomBlurWgsl from "./bloom-blur.wgsl";
import blitWgsl from "./blit.wgsl";
import bloomBrightWgsl from "./bloom-bright.wgsl";
import bloomCompositeWgsl from "./bloom-composite.wgsl";
import ifftStageWgsl from "./ifft-stage.wgsl";
import initialSpectrumWgsl from "./initial-spectrum.wgsl";
import noiseWgsl from "./noise.wgsl";
import normalFoamWgsl from "./normal-foam.wgsl";
import { createIfftStageTable, OCEAN_RESOLUTION, type SimulationTargetName } from "./ocean-graph";
import particlesWgsl from "./particles.wgsl";
import plumeWgsl from "./plume.wgsl";
import presentWgsl from "./present.wgsl";
import spectrumWgsl from "./spectrum.wgsl";
import { gaussianCoefficients, OCEAN_TUNING, PALETTE } from "./tuning";
import worldWgsl from "./world.wgsl";

const SIM_FORMAT: GPUTextureFormat = "rgba32float";
const HDR_FORMAT: GPUTextureFormat = "rgba16float";
const TRANSPARENT = [0, 0, 0, 0] as const;

/** Everything that changes per frame, supplied by the experience layer. */
export interface FrameParams {
  readonly oceanTime: number;
  readonly view: Float32Array;
  readonly projection: Float32Array;
  readonly pulse: readonly [number, number, number, number];
  readonly scan: readonly [number, number];
  readonly anomaly: readonly [number, number, number];
  readonly brightness: number;
  readonly visibility: number;
  readonly horizonY: number;
  /** Weight of the ocean world (particles, haze). 0 skips the FFT and the particle draw. */
  readonly ocean: number;
  /** Uniforms for the space and shaft environment (see world.wgsl). */
  readonly world: WorldParams;
  readonly plume: { readonly amount: number; readonly vent: readonly [number, number, number] };
  /** Linear RGB added over everything, premultiplied by its amount. */
  readonly flash: readonly [number, number, number];
  readonly ground: readonly [number, number, number];
  /** Bloom luminance threshold: high in space (rich blacks), lower in the dark ocean. */
  readonly bloomThreshold: number;
}

type Vec4 = readonly [number, number, number, number];
export interface WorldParams {
  readonly eye: Vec4;
  readonly forward: Vec4;
  readonly right: Vec4;
  readonly up: Vec4;
  readonly sun: Vec4;
  readonly crack: Vec4;
  readonly signal: Vec4;
  readonly shaft: Vec4;
  readonly extra: Vec4;
}

export interface FrameInfo {
  readonly dt: number;
  readonly time: number;
  /** Canvas size in physical pixels. */
  readonly width: number;
  readonly height: number;
}

export interface RendererOptions {
  readonly canvas: HTMLCanvasElement;
  readonly tier: Tier;
  readonly onFrame: (info: FrameInfo) => FrameParams;
  readonly onError: (error: unknown) => void;
}

export interface OceanRenderer {
  readonly ready: Promise<void>;
  setTier(tier: Tier): void;
  dispose(): void;
}

export function createRenderer({ canvas, tier: initial, onFrame, onError }: RendererOptions): OceanRenderer {
  let disposed = false;
  let tier = initial;
  let gpu: Gpu | undefined;
  let output: Surface | undefined;
  let graph: OceanGraph | undefined;
  let loop: FrameLoopHandle | undefined;
  let unsubscribeResize: (() => void) | undefined;
  let rebuilding = false;
  let rebuildQueued = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    loop?.stop();
    unsubscribeResize?.();
    gpu?.dispose();
  };

  const fail = (error: unknown) => {
    if (disposed) return;
    try {
      dispose();
    } finally {
      onError(error);
    }
  };

  const sceneSize = (): [number, number] => {
    const settings = TIERS[tier];
    const scale = Math.min(1, settings.maxDpr / Math.max(1, output!.dpr)) * settings.renderScale;
    return [Math.max(1, Math.floor(output!.size[0] * scale)), Math.max(1, Math.floor(output!.size[1] * scale))];
  };

  // Rebuild the size-dependent graph after a resize or tier change. Serialised, newest wins.
  const rebuild = async () => {
    if (rebuilding) {
      rebuildQueued = true;
      return;
    }
    rebuilding = true;
    try {
      do {
        rebuildQueued = false;
        if (disposed || !gpu || !output || !graph) return;
        const size = sceneSize();
        if (sameSize(graph.scene.size, size) && graph.settings === TIERS[tier]) continue;
        const next = await createGraph(gpu, output, size, TIERS[tier]);
        if (disposed) return destroyGraph(next);
        const previous = graph;
        graph = next;
        destroyGraph(previous);
      } while (rebuildQueued);
    } catch (error) {
      fail(error);
    } finally {
      rebuilding = false;
    }
  };

  const ready = (async () => {
    const nextGpu = await init();
    if (disposed) return nextGpu.dispose();
    gpu = nextGpu;
    gpu.onError?.((error: unknown) => fail(error));
    // A lost device (driver reset, GPU switch) would otherwise freeze the last frame: fall back instead.
    void gpu.lost.then((info) => fail(info));
    output = surface(gpu, canvas, { dpr: [1, 2] });
    graph = await createGraph(gpu, output, sceneSize(), TIERS[tier]);
    if (disposed) return;
    // Debounced: a window drag fires many resizes, and each rebuild re-allocates every target.
    let resizeTimer = 0;
    unsubscribeResize = output.onResize(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => void rebuild(), 150);
    });

    const time = clock(gpu);
    loop = frameLoop(gpu, (currentFrame) => {
      if (disposed || !graph || !output) return;
      try {
        const params = onFrame({ dt: time.deltaTime, time: time.time, width: output.size[0], height: output.size[1] });
        applyParams(graph, params, output, time.time);
        renderGraph(currentFrame, graph, output);
      } catch (error) {
        fail(error);
        throw error;
      }
    });
  })().catch((error: unknown) => fail(error));

  return {
    ready,
    setTier(next) {
      if (next === tier) return;
      tier = next;
      void rebuild();
    },
    dispose,
  };
}

async function createGraph(gpu: Gpu, output: Surface, size: [number, number], settings: TierSettings): Promise<OceanGraph> {
  const owned: Target[] = [];
  try {
    const graph = buildGraph(gpu, output, size, settings, (t) => (owned.push(t), t));
    await prewarm(graph, output);
    return graph;
  } catch (error) {
    destroyTargets(owned);
    throw error;
  }
}

function buildGraph(gpu: Gpu, output: Surface, size: [number, number], settings: TierSettings, own: (t: Target) => Target) {
  const resolution = OCEAN_RESOLUTION;
  const { stride } = settings;
  const label = `nereid-${size[0]}x${size[1]}`;
  const createTarget = (name: string, s: readonly [number, number], format: GPUTextureFormat) =>
    own(target(gpu, { size: s, format, label: `${label}-${name}` }));
  const simulationTarget = (name: string) => createTarget(name, [resolution, resolution], SIM_FORMAT);
  const simulation = {
    noise: simulationTarget("noise"),
    h0: simulationTarget("h0"),
    spectrum: simulationTarget("spectrum"),
    ping: simulationTarget("ping"),
    pong: simulationTarget("pong"),
    normalFoam: simulationTarget("normal-foam"),
  };
  const sizes = bloomSizes(size, settings.bloomDivisor);
  const scene = createTarget("scene", size, HDR_FORMAT);
  const bright = createTarget("bright", sizes[0]!, HDR_FORMAT);
  const composite = createTarget("composite", sizes[0]!, HDR_FORMAT);
  const linearSampler = sampler(gpu, { minFilter: "linear", magFilter: "linear" });
  const sim = OCEAN_TUNING.simulation;

  const noise = configuredEffect(gpu, noiseWgsl, `${label}-noise`);
  const initialSpectrum = configuredEffect(gpu, initialSpectrumWgsl, `${label}-initial-spectrum`, {
    u: {
      resolution,
      size: sim.oceanSize,
      windSpeed: sim.windSpeed,
      windAngle: sim.windAngle,
      amplitude: sim.amplitude,
    },
    u_noise: simulation.noise,
  });
  const evolveSpectrum = configuredEffect(gpu, spectrumWgsl, `${label}-spectrum`, {
    u: { resolution, size: sim.oceanSize, time: 0, choppiness: sim.choppiness },
    u_initialSpectrum: simulation.h0,
  });

  const simulationTargets: Record<SimulationTargetName, Target> = {
    spectrum: simulation.spectrum,
    ping: simulation.ping,
    pong: simulation.pong,
  };
  const ifft = createIfftStageTable().map((spec) => ({
    effect: configuredEffect(gpu, ifftStageWgsl, `${label}-ifft-${spec.index}`, {
      u: { resolution, subtransformSize: spec.subtransformSize, horizontal: spec.horizontal ? 1 : 0 },
      u_input: simulationTargets[spec.input],
    }),
    output: simulationTargets[spec.output],
  }));
  const displacement = ifft.at(-1)!.output;
  const normals = configuredEffect(gpu, normalFoamWgsl, `${label}-normal-foam`, {
    u: {
      resolution,
      worldSize: sim.worldSize,
      displacementScale: sim.displacementScale,
      foamThreshold: sim.foamThreshold,
    },
    u_displacement: displacement,
  });

  const columns = Math.floor(resolution / stride);
  const particles = draw(gpu, {
    shader: particlesWgsl,
    vertices: 6,
    instances: columns * columns,
    blend: { color: { src: "src-alpha", dst: "one" }, alpha: { src: "one", dst: "one" } },
    label: `${label}-particles`,
  }).set({ u_displacement: displacement, u_normalFoam: simulation.normalFoam });
  const p = OCEAN_TUNING.particles;
  const pointScale = (size[0] / Math.max(1, output.size[0])) * output.dpr * (stride > 1 ? 1.5 : 1);
  particles.set({
    u: {
      view: new Float32Array(16),
      projection: new Float32Array(16),
      viewport: [size[0], size[1], pointScale, columns],
      world: [sim.worldSize, sim.displacementScale, p.pointSize, stride],
      fade: [p.fadeNear, p.fadeFar, p.fadePower, 0],
      oceanColor: [0.003, 0.004, 0.006, 0],
      neonColor: [...PALETTE.silver, 0],
      foamColor: [...PALETTE.silver, 0],
      pulse: [0, 0, 0, 0],
      scan: [0, 0, p.ringWidth, p.contourSpacing],
      anomaly: [0, 0, p.anomalyRadius, 0],
      accent: [...PALETTE.ice, 1],
      thermal: [...PALETTE.thermal, 0],
    },
  });

  const zero4 = [0, 0, 0, 0];
  const worldSize: [number, number] = [
    Math.max(1, Math.round(size[0] * settings.worldScale)),
    Math.max(1, Math.round(size[1] * settings.worldScale)),
  ];
  const worldTarget = createTarget("world", worldSize, HDR_FORMAT);
  const world = configuredEffect(gpu, worldWgsl, `${label}-world`, {
    u: { eye: zero4, forward: zero4, right: zero4, up: zero4, sun: zero4, crack: zero4, signal: zero4, shaft: zero4, extra: zero4 },
  });
  const blit = configuredEffect(gpu, blitWgsl, `${label}-blit`, { source: worldTarget, linearSampler });

  // Vent field: 9,000 chimney points plus the plume (fewer on the lowest tier).
  const plumeInstances = 9000 + (stride > 1 ? 12000 : 24000);
  const plume = draw(gpu, {
    shader: plumeWgsl,
    vertices: 6,
    instances: plumeInstances,
    blend: { color: { src: "src-alpha", dst: "one" }, alpha: { src: "one", dst: "one" } },
    label: `${label}-plume`,
  }).set({
    u: {
      view: new Float32Array(16),
      projection: new Float32Array(16),
      viewport: [size[0], size[1], pointScale, 0],
      vent: zero4,
      params: [0, OCEAN_TUNING.vent.height, OCEAN_TUNING.vent.spread, 0],
      warm: [...PALETTE.thermal, 0],
      cool: [...PALETTE.silver.map((c) => c * 0.55), 0],
      rock: [...PALETTE.rock, 0],
    },
  });

  const b = OCEAN_TUNING.bloom;
  const brightEffect = configuredEffect(gpu, bloomBrightWgsl, `${label}-bloom-bright`, {
    uniforms: { luminosityThreshold: b.threshold, smoothWidth: b.smoothWidth, _pad0: [0, 0] },
    tDiffuse: scene,
    linearSampler,
  });
  let bloomInput = bright;
  const levels = sizes.map((levelSize, index) => {
    const horizontal = createTarget(`bloom-h${index}`, levelSize, HDR_FORMAT);
    const vertical = createTarget(`bloom-v${index}`, levelSize, HDR_FORMAT);
    const radius = b.kernelRadii[index]!;
    const horizontalEffect = makeBlur(gpu, `${label}-blur-h${index}`, bloomInput, horizontal, linearSampler, [1, 0], radius);
    const verticalEffect = makeBlur(gpu, `${label}-blur-v${index}`, horizontal, vertical, linearSampler, [0, 1], radius);
    bloomInput = vertical;
    return { horizontal, vertical, horizontalEffect, verticalEffect };
  });
  const compositeEffect = configuredEffect(gpu, bloomCompositeWgsl, `${label}-bloom-composite`, {
    uniforms: {
      bloomStrength: b.strength,
      bloomRadius: b.radius,
      _pad0: [0, 0],
      bloomFactors0: [1, 0.8, 0.6, 0.4],
      bloomFactors1: [0.2, 0, 0, 0],
    },
    blurTexture1: levels[0]!.vertical,
    blurTexture2: levels[1]!.vertical,
    blurTexture3: levels[2]!.vertical,
    blurTexture4: levels[3]!.vertical,
    blurTexture5: levels[4]!.vertical,
    linearSampler,
  });
  const present = configuredEffect(gpu, presentWgsl, `${label}-present`, {
    sceneHDR: scene,
    bloomTexture: composite,
    linearSampler,
    p: {
      ground: [...PALETTE.ground, 0],
      haze: [...PALETTE.haze, 0.3],
      params: [0, OCEAN_TUNING.present.grain, OCEAN_TUNING.present.vignette, 1],
      flash: [0, 0, 0, 1],
    },
  });
  return {
    simulation,
    scene,
    settings,
    frame: 0,
    instances: columns * columns,
    bloom: { bright, composite, levels },
    effects: { noise, initialSpectrum, evolveSpectrum, normals, bright: brightEffect, composite: compositeEffect, present },
    ifft,
    particles,
    world,
    worldTarget,
    blit,
    worldActive: true,
    plume,
    plumeInstances,
    oceanActive: true,
    plumeActive: false,
    needsInitialSpectrum: true,
  };
}

type OceanGraph = ReturnType<typeof buildGraph>;

function configuredEffect(gpu: Gpu, shader: ShaderSource, label: string, bindings?: Record<string, unknown>): Effect {
  const configured = effect(gpu, shader, { label });
  return bindings ? configured.set(bindings) : configured;
}

function makeBlur(
  gpu: Gpu,
  label: string,
  source: Target,
  output: Target,
  linearSampler: GPUSampler,
  direction: readonly [number, number],
  kernelRadius: number,
): Effect {
  const c = gaussianCoefficients(kernelRadius);
  return effect(gpu, bloomBlurWgsl, { label }).set({
    uniforms: {
      direction,
      invSize: output.texelSize,
      gaussianCoefficients0: c.slice(0, 4),
      gaussianCoefficients1: c.slice(4, 8),
      gaussianCoefficients2: c.slice(8, 12),
      gaussianCoefficients3: c.slice(12, 16),
      gaussianCoefficients4: c.slice(16, 20),
      gaussianCoefficients5: c.slice(20, 24),
    },
    colorTexture: source,
    linearSampler,
  });
}

async function prewarm(graph: OceanGraph, output: Surface): Promise<void> {
  const results = await Promise.allSettled([
    graph.effects.noise.compile(graph.simulation.noise),
    graph.effects.initialSpectrum.compile(graph.simulation.h0),
    graph.effects.evolveSpectrum.compile(graph.simulation.spectrum),
    ...graph.ifft.map(({ effect: e, output: o }) => e.compile(o)),
    graph.effects.normals.compile(graph.simulation.normalFoam),
    graph.particles.compile(graph.scene),
    graph.world.compile(graph.worldTarget),
    graph.blit.compile(graph.scene),
    graph.plume.compile(graph.scene),
    graph.effects.bright.compile(graph.bloom.bright),
    ...graph.bloom.levels.flatMap((level) => [
      level.horizontalEffect.compile(level.horizontal),
      level.verticalEffect.compile(level.vertical),
    ]),
    graph.effects.composite.compile(graph.bloom.composite),
    graph.effects.present.compile(output),
  ]);
  const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failure) throw failure.reason;
}

function applyParams(graph: OceanGraph, f: FrameParams, output: Surface, time: number): void {
  graph.effects.evolveSpectrum.set({ u: { time: f.oceanTime * OCEAN_TUNING.simulation.spectrumTimeScale } });
  graph.particles.set({
    u: {
      view: f.view,
      projection: f.projection,
      fade: [OCEAN_TUNING.particles.fadeNear, OCEAN_TUNING.particles.fadeFar, OCEAN_TUNING.particles.fadePower, time],
      pulse: f.pulse,
      scan: [f.scan[0], f.scan[1], OCEAN_TUNING.particles.ringWidth, OCEAN_TUNING.particles.contourSpacing],
      anomaly: [f.anomaly[0], f.anomaly[1], OCEAN_TUNING.particles.anomalyRadius, f.anomaly[2]],
      accent: [...PALETTE.ice, f.brightness],
      oceanColor: [0.003, 0.004, 0.006, f.ocean],
    },
  });
  graph.oceanActive = f.ocean > 0.001;
  graph.plumeActive = f.plume.amount > 0.001;
  graph.worldActive = f.world.up[3] > 0.001 || f.world.shaft[0] > 0.001;
  graph.world.set({ u: f.world });
  graph.effects.bright.set({ uniforms: { luminosityThreshold: f.bloomThreshold } });
  if (graph.plumeActive) {
    graph.plume.set({
      u: {
        view: f.view,
        projection: f.projection,
        vent: [...f.plume.vent, f.plume.amount],
        params: [time, OCEAN_TUNING.vent.height, OCEAN_TUNING.vent.spread, 0],
      },
    });
  }
  graph.effects.present.set({
    p: {
      ground: [...f.ground, f.visibility],
      haze: [...PALETTE.haze, f.horizonY],
      params: [time, OCEAN_TUNING.present.grain, OCEAN_TUNING.present.vignette, output.size[0] / Math.max(1, output.size[1])],
      // Haze squared: at the seams it thins faster than the water, so it never fogs the space world.
      flash: [...f.flash, f.ocean * f.ocean],
    },
  });
}

function renderGraph(currentFrame: Frame, graph: OceanGraph, output: Surface): void {
  const pass = (t: Surface | Target, drawable: Draw | Effect) =>
    currentFrame.pass({ target: t, clear: TRANSPARENT }, (encoder) => encoder.draw(drawable));
  const simulate = graph.needsInitialSpectrum || (graph.oceanActive && graph.frame % graph.settings.simEvery === 0);
  graph.frame += 1;
  if (graph.needsInitialSpectrum) {
    pass(graph.simulation.noise, graph.effects.noise);
    pass(graph.simulation.h0, graph.effects.initialSpectrum);
    graph.needsInitialSpectrum = false;
  }
  if (simulate) {
    // Displacement and normals persist in their targets, so skipped frames reuse the last field.
    pass(graph.simulation.spectrum, graph.effects.evolveSpectrum);
    for (const stage of graph.ifft) pass(stage.output, stage.effect);
    pass(graph.simulation.normalFoam, graph.effects.normals);
  }
  if (graph.worldActive) pass(graph.worldTarget, graph.world);
  currentFrame.pass({ target: graph.scene, clear: TRANSPARENT }, (encoder) => {
    if (graph.worldActive) encoder.draw(graph.blit);
    if (graph.oceanActive) encoder.draw(graph.particles, { instances: graph.instances });
    if (graph.plumeActive) encoder.draw(graph.plume, { instances: graph.plumeInstances });
  });
  pass(graph.bloom.bright, graph.effects.bright);
  for (const level of graph.bloom.levels) {
    pass(level.horizontal, level.horizontalEffect);
    pass(level.vertical, level.verticalEffect);
  }
  pass(graph.bloom.composite, graph.effects.composite);
  pass(output, graph.effects.present);
}

function bloomSizes(size: readonly [number, number], divisor: number): [number, number][] {
  let width = Math.max(1, Math.round(size[0] / divisor));
  let height = Math.max(1, Math.round(size[1] / divisor));
  return Array.from({ length: OCEAN_TUNING.bloom.levels }, () => {
    const level: [number, number] = [width, height];
    width = Math.max(1, Math.round(width / 2));
    height = Math.max(1, Math.round(height / 2));
    return level;
  });
}

function destroyGraph(graph: OceanGraph): void {
  destroyTargets([
    ...Object.values(graph.simulation),
    graph.scene,
    graph.worldTarget,
    graph.bloom.bright,
    graph.bloom.composite,
    ...graph.bloom.levels.flatMap((level) => [level.horizontal, level.vertical]),
  ]);
}

function destroyTargets(targets: readonly Target[]): void {
  for (const t of [...targets].reverse()) {
    try {
      t.color.destroy();
    } catch {
      // best-effort cleanup
    }
  }
}

function sameSize(a: readonly number[], b: readonly number[]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
