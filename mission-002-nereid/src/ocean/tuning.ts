/**
 * Parameter table. The simulation and bloom values are the vgpu fft-ocean example's canonical
 * settings, unchanged. Particle colours, fade distances and bloom strength are retuned for NEREID.
 */
const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const hexLinear = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)];
};

export const PALETTE = {
  ground: hexLinear("#06111a"),
  haze: hexLinear("#1a5571"),
  silver: hexLinear("#d8e6ee"),
  ice: hexLinear("#8be3f5"),
  thermal: hexLinear("#f1d3a1"),
  rock: hexLinear("#3b4a52"),
  space: hexLinear("#020407"),
};

export const OCEAN_TUNING = {
  simulation: {
    oceanSize: 200,
    worldSize: 400,
    timeScale: 0.6,
    spectrumTimeScale: 0.5,
    windSpeed: 12.9,
    windAngle: 4.83,
    amplitude: 1.3,
    choppiness: 1.51,
    displacementScale: 0.005,
    foamThreshold: 0,
  },
  particles: {
    pointSize: 0.85,
    fadeNear: 50,
    fadeFar: 300,
    fadePower: 1.8,
    contourSpacing: 0.42,
    ringWidth: 4.5,
    anomalyRadius: 16,
  },
  vent: {
    height: 26,
    spread: 6,
  },
  bloom: {
    threshold: 0.28,
    smoothWidth: 0.02,
    strength: 0.16,
    radius: 0.46,
    levels: 5,
    kernelRadii: [6, 10, 14, 18, 22] as const,
  },
  present: {
    grain: 0.028,
    vignette: 0.4,
  },
} as const;

/** Matches the original's `gaussianCoefficients`: sigma=radius/3, no normalization pass. */
export function gaussianCoefficients(kernelRadius: number): readonly number[] {
  return Array.from({ length: 24 }, (_, index) =>
    index < kernelRadius
      ? (0.39894 * Math.exp((-0.5 * index * index) / (kernelRadius / 3) ** 2)) / (kernelRadius / 3)
      : 0,
  );
}
