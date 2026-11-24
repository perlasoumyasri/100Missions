// Based on vgpu's fft-ocean particles.wgsl (MIT). Each instance is one sonar return riding the
// FFT displacement field. Added for NEREID: a free camera, a travelling sonar pulse that lifts and
// lights the particles it passes, depth contours and range rings revealed behind the pulse, a
// thermal upwelling, and a particle stride for adaptive quality.

struct ParticleUniforms {
  view: mat4x4f,
  projection: mat4x4f,
  viewport: vec4f,  // width, height, point scale, columns drawn
  world: vec4f,     // world size, displacement scale, point size, stride
  fade: vec4f,      // near, far, power, time
  oceanColor: vec4f, // rgb, a = world intensity (the director fades the ocean in and out)
  neonColor: vec4f,
  foamColor: vec4f,
  pulse: vec4f,     // origin x, origin z, radius, strength
  scan: vec4f,      // mapped radius, scan amount, ring width, contour spacing
  anomaly: vec4f,   // x, z, radius, reveal
  accent: vec4f,    // instrument cyan (linear rgb), a = ambient brightness
  thermal: vec4f,   // anomaly warm tint (linear rgb)
};

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) pointCoord: vec2f,
  @location(1) foam: f32,
  @location(2) normal: vec3f,
  @location(3) viewDir: vec3f,
  @location(4) height: f32,
  @location(5) fade: f32,
  @location(6) ring: f32,
  @location(7) mapped: vec2f, // fill, contour lines
  @location(8) warm: f32,
};

@group(0) @binding(0) var<uniform> u: ParticleUniforms;
@group(0) @binding(1) var u_displacement: texture_2d<f32>;
@group(0) @binding(2) var u_normalFoam: texture_2d<f32>;

fn quadCorner(vertexIndex: u32) -> vec2f {
  let cornerIndex = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u)[vertexIndex % 6u];
  switch (cornerIndex) {
    case 0u: { return vec2f(-1.0, -1.0); }
    case 1u: { return vec2f( 1.0, -1.0); }
    case 2u: { return vec2f(-1.0,  1.0); }
    default: { return vec2f( 1.0,  1.0); }
  }
}

// 1 on a line, 0 between lines. `x` in line units.
fn isoLine(x: f32, width: f32) -> f32 {
  let c = abs(fract(x + 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, width, c);
}

@vertex fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOut {
  let columns = max(1u, u32(u.viewport.w));
  let stride = max(1u, u32(u.world.w));
  let resolution = columns * stride;
  let i = (instanceIndex % columns) * stride;
  let j = (instanceIndex / columns) * stride;
  let particleRef = vec2f(f32(i), f32(j)) / f32(resolution);
  let texCoord = vec2u(i, j);
  let time = u.fade.w;

  let disp = textureLoad(u_displacement, texCoord, 0).xyz * u.world.y;
  let nf = textureLoad(u_normalFoam, texCoord, 0);

  let halfWorld = u.world.x * 0.5;
  let base = vec3f(
    particleRef.x * u.world.x - halfWorld,
    0.0,
    particleRef.y * u.world.x - halfWorld,
  );
  var pos = base + disp;

  // Thermal upwelling: a slow, breathing mound of warmer water.
  let toAnomaly = pos.xz - u.anomaly.xy;
  let warm = exp(-dot(toAnomaly, toAnomaly) / (u.anomaly.z * u.anomaly.z));
  pos.y += warm * (1.6 + 0.35 * sin(time * 0.9 - length(toAnomaly) * 0.25));

  // Sonar pulse: a pressure front lifts the water, with a shallow trough behind it.
  let fromOrigin = distance(pos.xz, u.pulse.xy);
  let front = (fromOrigin - u.pulse.z) / u.scan.z;
  let ring = exp(-front * front) * u.pulse.w;
  let trough = exp(-(front + 2.2) * (front + 2.2)) * u.pulse.w;
  pos.y += ring * 1.5 - trough * 0.45;

  // Mapped area: everything the pulses have reached this dive.
  let mapped = (1.0 - smoothstep(u.scan.x - 8.0, u.scan.x, fromOrigin)) * u.scan.y;

  let mv = u.view * vec4f(pos, 1.0);
  let viewDir = -mv.xyz;
  let dist = -mv.z;
  let f = 1.0 - smoothstep(u.fade.x, u.fade.y, dist);
  let fade = pow(clamp(f, 0.0, 1.0), u.fade.z);

  let projected = u.projection * mv;
  let ndc = projected.xy / projected.w;

  let corner = quadCorner(vertexIndex);
  // Mild perspective: near returns grow a little so the foreground keeps its texture.
  let nearBoost = clamp(55.0 / max(dist, 1.0), 1.0, 1.5);
  let pointSizePx = 2.0 * u.world.z * u.viewport.z * nearBoost * (1.0 + ring * 0.8);
  let clipOffset = corner * (pointSizePx / u.viewport.xy) * projected.w;
  let clip = vec4f(ndc * projected.w + clipOffset, projected.z, projected.w);

  var out: VertexOut;
  out.position = clip;
  out.pointCoord = corner * 0.5 + vec2f(0.5);
  out.foam = nf.w;
  out.normal = nf.xyz;
  out.viewDir = viewDir;
  out.height = pos.y;
  out.fade = fade;
  out.ring = ring;
  // Depth contours every `spacing` units of height, and faint range rings every 40 units (1 km).
  let contour = isoLine(pos.y / u.scan.w, 0.11);
  let rangeRing = isoLine(fromOrigin / 40.0, 0.018) * 0.45;
  out.mapped = vec2f(mapped, mapped * max(contour, rangeRing));
  out.warm = warm * u.anomaly.w * mapped;
  return out;
}

@fragment fn fs_main(in: VertexOut) -> @location(0) vec4f {
  let cc = in.pointCoord - vec2f(0.5);
  let d2 = dot(cc, cc);
  if (d2 > 0.25) {
    discard;
  }
  // Soft core so points read as light, not as discs.
  let core = 1.0 - smoothstep(0.02, 0.25, d2);

  let n = normalize(in.normal);
  let v = normalize(in.viewDir);
  let fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);

  let foam = clamp(in.foam, 0.0, 1.0);
  let crest = smoothstep(-0.5, 1.5, in.height);

  var color = u.oceanColor.rgb * 0.5;
  color += u.neonColor.rgb * crest * 0.5;
  color += u.neonColor.rgb * fresnel * 0.15;
  color = mix(color, u.foamColor.rgb, foam);
  var alpha = (0.05 + crest * 0.14 + fresnel * 0.08) * u.accent.a;
  alpha = mix(alpha, 1.0, foam * 0.85);

  // Instrument layers. The ring is HDR-bright so it carries the bloom; contours stay below threshold.
  color = mix(color, u.accent.rgb, clamp(in.mapped.x * 0.45 + in.mapped.y * 0.9, 0.0, 1.0));
  alpha += in.mapped.x * 0.025 + in.mapped.y * 0.3;
  color = mix(color, u.accent.rgb * 2.6, clamp(in.ring, 0.0, 1.0));
  alpha += in.ring * 0.9;
  color = mix(color, u.thermal.rgb * (0.7 + crest), clamp(in.warm, 0.0, 1.0));
  alpha += in.warm * 0.1;

  color *= in.fade;
  alpha *= in.fade * mix(0.6, 1.0, core) * u.oceanColor.a;
  return vec4f(color, clamp(alpha, 0.0, 1.0));
}
