export type Vec3 = readonly [number, number, number];

/** A free camera. Yaw 0 looks down −z; negative pitch looks down. Angles in radians, fov is vertical. */
export interface Pose {
  readonly eye: Vec3;
  readonly yaw: number;
  readonly pitch: number;
  readonly fov: number;
}

export const NEAR = 0.1;
export const FAR = 2000;

export function forward(yaw: number, pitch: number): Vec3 {
  const c = Math.cos(pitch);
  return [Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c];
}

/** Column-major view matrix (WGSL mat4x4f layout). */
export function viewMatrix(pose: Pose, out = new Float32Array(16)): Float32Array {
  const [ex, ey, ez] = pose.eye;
  const f = forward(pose.yaw, pose.pitch);
  // z points backwards, x = up × z, y = z × x
  const zx = -f[0], zy = -f[1], zz = -f[2];
  let xx = zz, xy = 0, xz = -zx; // cross([0,1,0], z)
  const xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl; xy /= xl; xz /= xl;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
  return out;
}

/** WebGPU (0..1 depth) perspective, matching the original example's projection. */
export function projectionMatrix(fov: number, aspect: number, out = new Float32Array(16)): Float32Array {
  const f = 1 / Math.tan(fov / 2);
  out.fill(0);
  out[0] = f / Math.max(1e-6, aspect);
  out[5] = f;
  out[10] = FAR / (NEAR - FAR);
  out[11] = -1;
  out[14] = (FAR * NEAR) / (NEAR - FAR);
  return out;
}

function transform(m: Float32Array, x: number, y: number, z: number, w: number): [number, number, number, number] {
  return [
    m[0]! * x + m[4]! * y + m[8]! * z + m[12]! * w,
    m[1]! * x + m[5]! * y + m[9]! * z + m[13]! * w,
    m[2]! * x + m[6]! * y + m[10]! * z + m[14]! * w,
    m[3]! * x + m[7]! * y + m[11]! * z + m[15]! * w,
  ];
}

/** World point → CSS pixel position in a viewport of `width × height`. */
export function projectToScreen(
  point: Vec3,
  view: Float32Array,
  projection: Float32Array,
  width: number,
  height: number,
): { x: number; y: number; visible: boolean } {
  const v = transform(view, point[0], point[1], point[2], 1);
  const c = transform(projection, v[0], v[1], v[2], v[3]);
  if (c[3] <= 1e-6) return { x: 0, y: 0, visible: false };
  const nx = c[0] / c[3];
  const ny = c[1] / c[3];
  return {
    x: (nx * 0.5 + 0.5) * width,
    y: (0.5 - ny * 0.5) * height,
    visible: Math.abs(nx) <= 1 && Math.abs(ny) <= 1,
  };
}

/** Screen-space y (0 top, 1 bottom) of the horizon for a pose: where the view ray is level. */
export function horizonY(pitch: number, fov: number): number {
  const ndc = Math.tan(-pitch) / Math.tan(fov / 2);
  return 0.5 - ndc * 0.5;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Quadratic Bézier between poses: the eye bends through `via`, angles interpolate linearly. */
export function posePath(a: Pose, via: Vec3, b: Pose, t: number): Pose {
  const u = 1 - t;
  const eye: Vec3 = [
    u * u * a.eye[0] + 2 * u * t * via[0] + t * t * b.eye[0],
    u * u * a.eye[1] + 2 * u * t * via[1] + t * t * b.eye[1],
    u * u * a.eye[2] + 2 * u * t * via[2] + t * t * b.eye[2],
  ];
  return {
    eye,
    yaw: lerp(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch, b.pitch, t),
    fov: lerp(a.fov, b.fov, t),
  };
}
