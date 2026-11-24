// The Discovery: a hydrothermal vent field, as sonar returns.
// The first CHIMNEY_POINTS instances are static points on five tapering chimneys. The rest are a
// stateless plume: each particle's position is a pure function of its seed and time, rising,
// spreading and cooling from warm amber to the ocean's grey-cyan, then respawning at the vent.

const CHIMNEY_POINTS: u32 = 9000u;

struct PlumeUniforms {
  view: mat4x4f,
  projection: mat4x4f,
  viewport: vec4f, // width, height, point scale, _
  vent: vec4f,     // vent base position, amount (0..1)
  params: vec4f,   // time, plume height, spread, _
  warm: vec4f,
  cool: vec4f,
  rock: vec4f,
};

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) corner: vec2f,
  @location(1) color: vec3f,
  @location(2) alpha: f32,
};

@group(0) @binding(0) var<uniform> u: PlumeUniforms;

fn hash3u(n: u32) -> vec3f {
  var x = n * 747796405u + 2891336453u;
  x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u;
  let a = (x >> 22u) ^ x;
  let b = a * 1664525u + 1013904223u;
  let c = b * 1664525u + 1013904223u;
  return vec3f(f32(a & 0xffffu), f32(b & 0xffffu), f32(c & 0xffffu)) / 65535.0;
}

fn quadCorner(vertexIndex: u32) -> vec2f {
  let cornerIndex = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u)[vertexIndex % 6u];
  switch (cornerIndex) {
    case 0u: { return vec2f(-1.0, -1.0); }
    case 1u: { return vec2f( 1.0, -1.0); }
    case 2u: { return vec2f(-1.0,  1.0); }
    default: { return vec2f( 1.0,  1.0); }
  }
}

@vertex fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOut {
  let h = hash3u(instanceIndex);
  let h2 = hash3u(instanceIndex + 104729u);
  let time = u.params.x;
  let amount = u.vent.w;
  var world: vec3f;
  var color: vec3f;
  var alpha: f32;

  if (instanceIndex < CHIMNEY_POINTS) {
    // Five chimneys of different heights around the vent, tapering upward, rough-edged.
    let k = instanceIndex % 5u;
    let fk = f32(k);
    let offset = vec3f(cos(fk * 2.4) * (2.0 + fk * 1.3), 0.0, sin(fk * 2.4) * (2.0 + fk * 1.1));
    let height = 3.5 + fract(fk * 0.618) * 6.0 + select(0.0, 4.0, k == 0u);
    let y = pow(h.x, 0.8) * height;
    let taper = mix(1.5, 0.35, y / height) * (0.8 + 0.4 * h2.x);
    let ang = h.y * 6.2832;
    let rough = 1.0 + 0.25 * sin(y * 3.1 + ang * 5.0);
    world = u.vent.xyz + offset + vec3f(cos(ang) * taper * rough, y, sin(ang) * taper * rough);
    // Mouths glow faintly with heat; flanks are dim rock.
    let mouth = smoothstep(0.82, 1.0, y / height);
    color = mix(u.rock.rgb, u.warm.rgb, mouth * 0.7);
    alpha = (0.06 + 0.08 * h.z) * amount;
  } else {
    let period = 7.0 + h.z * 5.0;
    let age = fract(time / period + h.x);
    let height = u.params.y;
    let y = age * height;
    let spread = mix(0.35, u.params.z, pow(age, 0.7)) * (0.25 + 0.75 * h2.y);
    let ang = h.y * 6.2832 + age * 3.5 + time * 0.15;
    // A slow lateral current bends the plume as it rises.
    let current = vec3f(sin(time * 0.07) * 1.5 + 2.5, 0.0, cos(time * 0.05) * 0.8) * age * age;
    world = u.vent.xyz + vec3f(cos(ang) * spread, y, sin(ang) * spread) + current;
    color = mix(u.warm.rgb, u.cool.rgb, smoothstep(0.0, 0.5, age));
    alpha = amount * pow(1.0 - age, 1.5) * smoothstep(0.0, 0.04, age) * (0.08 + 0.12 * h2.z);
  }

  let mv = u.view * vec4f(world, 1.0);
  let projected = u.projection * mv;
  let dist = max(-mv.z, 0.1);
  let nearBoost = clamp(40.0 / dist, 1.0, 1.4);
  let sizePx = 1.6 * u.viewport.z * nearBoost;
  let corner = quadCorner(vertexIndex);
  let offset2 = corner * (sizePx / u.viewport.xy) * 2.0 * projected.w;
  let fade = 1.0 - smoothstep(120.0, 220.0, dist);

  var out: VertexOut;
  out.position = vec4f(projected.xy + offset2, projected.z, projected.w);
  out.corner = corner;
  out.color = color;
  out.alpha = alpha * fade;
  return out;
}

@fragment fn fs_main(in: VertexOut) -> @location(0) vec4f {
  let r2 = dot(in.corner, in.corner);
  if (r2 > 1.0) {
    discard;
  }
  let core = exp(-r2 * 4.0);
  return vec4f(in.color, in.alpha * core);
}
