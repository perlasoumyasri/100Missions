// NEREID world: the two fullscreen environments around the vgpu ocean.
//   Space: stars, Jupiter, Europa with procedural lineae, the dive into one fracture, and the signal home.
//   Shaft: the cryobot's descent through 20 km of ice.
// The director blends them with weights; the ocean particles draw on top in the same HDR target.

import { simplex3d } from "@vgpu/wgsl-std/noise/simplex";
import { hash3 } from "@vgpu/wgsl-std/hash";

struct WorldUniforms {
  eye: vec4f,      // camera position, tan(fov / 2)
  forward: vec4f,  // camera forward, aspect
  right: vec4f,    // camera right, time
  up: vec4f,       // camera up, space weight
  sun: vec4f,      // direction to the sun, star brightness
  crack: vec4f,    // hero fracture plane normal, how far it has opened (0..1)
  signal: vec4f,   // direction to Earth, signal amount (0..1)
  shaft: vec4f,    // shaft weight, depth (0..1), lamp, breakthrough
  extra: vec4f,    // Jupiter brightness, Jupiter detail (1 up close), _, _
};

@group(0) @binding(0) var<uniform> u: WorldUniforms;

const JUPITER_C = vec3f(-46.8, 16.88, 33.54); // keep in sync with director.ts JUPITER
const JUPITER_R = 12.0;

fn sphere(ro: vec3f, rd: vec3f, c: vec3f, r: f32) -> f32 {
  let oc = ro - c;
  let b = dot(oc, rd);
  let h = b * b - (dot(oc, oc) - r * r);
  if (h < 0.0) { return -1.0; }
  let t = -b - sqrt(h);
  return select(-1.0, t, t > 0.0);
}

fn fbm(p: vec3f, octaves: i32) -> f32 {
  var sum = 0.0;
  var amp = 0.5;
  var q = p;
  for (var i = 0; i < octaves; i++) {
    sum += amp * simplex3d(q);
    q = q * 2.03 + vec3f(1.7, 9.2, 3.1);
    amp *= 0.5;
  }
  return sum;
}

// x² without pow(): pow() of a negative base is undefined in WGSL (NaN on D3D and Vulkan).
fn sq(x: f32) -> f32 {
  return x * x;
}

// Thin ridges: 1 on a ridge line, falling off sharply.
fn ridge(p: vec3f, k: f32, sharp: f32) -> f32 {
  return pow(1.0 - abs(simplex3d(p * k)), sharp);
}

// Cheap relief for lighting: the two dominant lineae sets only.
fn bumpLines(p: vec3f) -> f32 {
  let a = vec3f(p.x * 0.35, p.y * 2.6, p.z * 0.35);
  let q = vec3f(p.x * 0.9 + p.z * 0.4, p.y * 0.3, p.z * 0.9 - p.x * 0.4);
  let b = vec3f(q.x * 2.8, q.y, q.z * 0.3);
  return max(pow(1.0 - abs(simplex3d(a * 2.2)), 28.0), pow(1.0 - abs(simplex3d(b * 2.0 + 3.0)), 30.0) * 0.85);
}

// Lineae are long, mostly straight bands. Stretching the noise domain along one axis turns its
// zero-crossings into long arcs; three sets at different orientations cross each other.
fn lineae(p: vec3f, near: f32) -> f32 {
  let a = vec3f(p.x * 0.35, p.y * 2.6, p.z * 0.35);
  let q = vec3f(p.x * 0.9 + p.z * 0.4, p.y * 0.3, p.z * 0.9 - p.x * 0.4);
  let b = vec3f(q.x * 2.8, q.y, q.z * 0.3);
  let c = vec3f(p.z * 3.2 + p.y * 1.1, p.x * 0.3, p.y * 0.4);
  let warp = simplex3d(p * 5.0) * 0.05;
  let l1 = pow(1.0 - abs(simplex3d(a * 2.2 + warp)), 28.0);
  let l2 = pow(1.0 - abs(simplex3d(b * 2.0 + 3.0 + warp)), 30.0) * 0.85;
  let l3 = pow(1.0 - abs(simplex3d(c * 2.4 + 7.0 + warp)), 34.0) * 0.7;
  let fine = pow(1.0 - abs(simplex3d(vec3f(p.x * 14.0, p.y * 4.0, p.z * 14.0) + 11.0)), 40.0) * 0.45 * near;
  return max(max(l1, l2), max(l3, fine));
}

fn stars(rd: vec3f, time: f32) -> vec3f {
  var col = vec3f(0.0);
  for (var layer = 0; layer < 3; layer++) {
    let scale = 90.0 + f32(layer) * 110.0;
    let p = rd * scale;
    let cell = floor(p);
    let h = hash3(cell + f32(layer) * 17.0);
    if (h.x > 0.965) {
      let star = cell + vec3f(0.25) + 0.5 * hash3(cell + 31.0);
      let d = length(p - star);
      let twinkle = 0.75 + 0.25 * sin(time * (0.6 + h.y * 2.2) + h.z * 40.0);
      let b = smoothstep(0.16, 0.0, d) * twinkle * mix(0.25, 1.0, h.y * h.y);
      let tint = mix(vec3f(0.75, 0.85, 1.0), vec3f(1.0, 0.92, 0.82), h.z);
      col += tint * b;
    }
  }
  return col;
}

fn europaAlbedo(p: vec3f, near: f32) -> vec3f {
  let mottle = fbm(p * 3.0, 3);
  var col = vec3f(0.8, 0.82, 0.83) * (0.86 + 0.14 * mottle);
  // Chaos terrain: rust-tan patches.
  let chaos = smoothstep(0.12, 0.5, fbm(p * 1.6 + vec3f(4.0, 1.0, 2.0), 3));
  col = mix(col, vec3f(0.6, 0.47, 0.37) * (0.85 + 0.3 * mottle), chaos * 0.75);
  let lin = lineae(p, near);
  col = mix(col, vec3f(0.46, 0.26, 0.16), lin * 0.8);
  return col;
}

fn heroCrack(p: vec3f) -> f32 {
  // Signed distance (in radians, unit sphere) to the fracture's great circle, with a cracked wobble.
  return dot(p, u.crack.xyz) + simplex3d(p * 24.0) * 0.004 + simplex3d(p * 70.0) * 0.0012;
}

fn space(ro: vec3f, rd: vec3f, time: f32) -> vec3f {
  let L = normalize(u.sun.xyz);
  // Stars only where the moon doesn't cover them.
  let hidden = sphere(ro, rd, vec3f(0.0), 1.0) > 0.0;
  var col = vec3f(0.0012, 0.002, 0.0035);
  if (!hidden) { col += stars(rd, time) * u.sun.w; }

  // Earth: a pale blue point, only during the transmission.
  if (u.signal.w > 0.0) {
    let e = max(dot(rd, normalize(u.signal.xyz)), 0.0);
    col += vec3f(0.45, 0.7, 1.0) * (pow(e, 60000.0) * 3.0 + pow(e, 3000.0) * 0.12) * u.signal.w;

    // The signal: a thin line from Europa towards Earth, with pulses travelling along it.
    let E = normalize(u.signal.xyz);
    let b = dot(rd, E);
    let dd = dot(rd, ro);
    let ee = dot(E, ro);
    let denom = max(1.0 - b * b, 1e-5);
    let tc = (b * ee - dd) / denom;
    let sc = (ee - b * dd) / denom;
    if (tc > 0.0 && sc > 1.02) {
      let gap = length(ro + rd * tc - E * sc);
      let width = 0.0018 * tc;
      let line = exp(-sq(gap / width));
      let head = fract(time * 0.16);
      let pulse = exp(-sq((sc - mix(1.0, 46.0, head)) / 1.4));
      col += vec3f(0.55, 0.82, 1.0) * line * (0.22 + pulse * 2.2) * u.signal.w;
    }
  }

  // Jupiter: the opening subject, then the dim backdrop. Detail rises when the camera is close.
  let tj = sphere(ro, rd, JUPITER_C, JUPITER_R);
  if (tj > 0.0) {
    let n = normalize(ro + rd * tj - JUPITER_C);
    let lat = n.y + 0.08 * n.x;
    let detail = u.extra.y;
    // Bands drift at different speeds by latitude, so the atmosphere shears slowly.
    let shear = sin(lat * 18.0) * time * 0.006;
    let flow = vec3f(n.x * 2.0 + time * 0.004 + shear, lat * 6.0, n.z * 2.0);
    var swirl = fbm(flow, 3);
    if (detail > 0.01) { swirl += fbm(flow * 4.0 + 5.0, 3) * 0.4 * detail; }
    let bands = sin(lat * 26.0 + swirl * 2.6) * 0.5 + 0.5;
    let base = mix(vec3f(0.78, 0.66, 0.52), vec3f(0.93, 0.89, 0.8), bands);
    var belt = mix(base, vec3f(0.55, 0.38, 0.27), smoothstep(0.55, 0.95, sin(lat * 9.0 + swirl) * 0.5 + 0.5) * 0.6);
    // A storm oval in the southern belt, on the side the opening camera sees.
    let spot = length((n - normalize(vec3f(-0.42, -0.3, 0.86))) * vec3f(1.0, 2.4, 1.0));
    belt = mix(belt, vec3f(0.74, 0.44, 0.31), smoothstep(0.17, 0.07, spot + swirl * 0.03) * 0.75);
    let lit = smoothstep(-0.05, 0.5, dot(n, L));
    let facing = max(dot(n, -rd), 0.0);
    col = belt * lit * pow(facing, 0.5) * u.extra.x + vec3f(0.006, 0.005, 0.004) * facing;
    // Thin bright atmosphere along the lit limb.
    col += vec3f(0.6, 0.56, 0.5) * pow(1.0 - facing, 3.0) * lit * 0.1 * u.extra.x;
  }

  // Europa: unit sphere at the origin, with an analytically anti-aliased limb (coverage from the
  // ray's closest approach), so the edge stays smooth when the world target is upscaled.
  let bq = dot(ro, rd);
  let dc = sqrt(max(dot(ro, ro) - bq * bq, 0.0));
  let fw = max(fwidth(dc), 1e-5) * 1.2;
  if (dc < 1.0 + fw && bq < 0.0) {
    let te = -bq - sqrt(max(1.0 - dc * dc, 0.0));
    let p = ro + rd * te;
    var ecol: vec3f;
    var n = normalize(p);
    let dist = length(ro);
    let near = smoothstep(1.6, 1.1, dist);
    var albedo = europaAlbedo(n, near);

    // Bump from the lineae so ridges catch the low sun.
    let e = 0.0025;
    let t1 = normalize(cross(n, vec3f(0.0, 1.0, 0.0)) + vec3f(1e-4));
    let t2 = cross(n, t1);
    let h0 = bumpLines(n);
    let h1 = bumpLines(n + t1 * e);
    let h2 = bumpLines(n + t2 * e);
    n = normalize(n - (t1 * (h1 - h0) + t2 * (h2 - h0)) * 0.6);

    // The hero fracture: a double ridge that opens into blue light during the dive.
    let d = heroCrack(normalize(p));
    let open = u.crack.w;
    let w = 0.0035 * (1.0 + open * 9.0);
    let ridgePair = exp(-sq((abs(d) - w * 1.6) / (w * 0.7)));
    albedo = mix(albedo, vec3f(0.42, 0.24, 0.15), ridgePair * 0.9);

    let ndl = dot(n, L);
    let diffuse = smoothstep(-0.04, 0.9, ndl);
    let jupiterShine = vec3f(0.03, 0.025, 0.02) * max(dot(normalize(p), normalize(JUPITER_C)), 0.0);
    ecol = albedo * diffuse * 0.62 + albedo * jupiterShine;
    // A cold rim where the limb meets space.
    ecol += vec3f(0.25, 0.45, 0.6) * pow(1.0 - max(dot(normalize(p), -rd), 0.0), 4.0) * 0.12 * diffuse;

    // Opening: the chasm is dark blue inside, with ice-light along its lips and a faint glow from depth.
    let inside = smoothstep(w * 1.1, w * 0.6, abs(d)) * open;
    let lips = exp(-sq((abs(d) - w * 1.05) / (w * 0.18))) * open;
    ecol = mix(ecol, vec3f(0.01, 0.05, 0.09) + vec3f(0.05, 0.2, 0.3) * exp(-sq(d / (w * 0.35))), inside);
    ecol += vec3f(0.5, 0.8, 0.88) * lips * 0.55;
    col = mix(col, ecol, smoothstep(1.0 + fw, 1.0 - fw, dc));
  }
  return col;
}

fn shaft(ndc: vec2f, aspect: f32, time: f32) -> vec3f {
  let depth = u.shaft.y;
  let c = vec2f(ndc.x * aspect, ndc.y) - vec2f(0.0, -0.12);
  let r = max(length(c), 0.015);
  let a = atan2(c.y, c.x);
  let zd = 0.32 / r;
  let z = zd + time * 0.35 + depth * 26.0;
  // Scalloped ice: angular detail at several frequencies, strata as rings passing the camera.
  // Depth varies much faster than angle, so the walls read as rings of ice passing, not streaks.
  let wall = fbm(vec3f(cos(a) * 1.6, sin(a) * 1.6, z * 3.2), 3) * 0.5 + 0.5;
  let scallop = 1.0 - abs(simplex3d(vec3f(cos(a) * 3.5, sin(a) * 3.5, z * 6.5)));
  let strata = smoothstep(0.8, 1.0, 0.5 + 0.5 * sin(z * 9.0 + wall * 4.0));
  let near = exp(-zd * 0.55);
  let edge = smoothstep(1.6, 0.5, r);
  let deep = vec3f(0.004, 0.025, 0.055);
  let mid = vec3f(0.03, 0.19, 0.31);
  let ice = vec3f(0.62, 0.86, 0.92);
  var col = deep + mid * wall * near * 1.3;
  col += ice * pow(scallop, 8.0) * near * 0.35;
  col += mid * strata * near * 0.5;
  col *= edge * mix(1.0, 0.7, depth);
  // The cryobot's lamp: a small warm point below, warming the walls just around it.
  let lamp = u.shaft.z;
  col += vec3f(1.0, 0.74, 0.45) * (exp(-r * 55.0) * 1.6 + exp(-r * 12.0) * 0.06) * lamp;
  col += vec3f(0.35, 0.3, 0.25) * exp(-zd * 0.08) * smoothstep(0.5, 0.05, r) * 0.05 * lamp;
  // Breakthrough: the bottom of the shaft opens into cold light.
  col += ice * exp(-r * 4.0) * u.shaft.w * 0.9;
  return col;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let aspect = u.forward.w;
  let time = u.right.w;
  var col = vec3f(0.0);
  if (u.up.w > 0.001) {
    let rd = normalize(u.forward.xyz + (ndc.x * aspect * u.eye.w) * u.right.xyz + (ndc.y * u.eye.w) * u.up.xyz);
    col += space(u.eye.xyz, rd, time) * u.up.w;
  }
  if (u.shaft.x > 0.001) {
    col += shaft(ndc, aspect, time) * u.shaft.x;
  }
  return vec4f(col, 1.0);
}
