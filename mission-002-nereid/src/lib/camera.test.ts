import { describe, expect, it } from "vitest";
import { horizonY, posePath, projectToScreen, projectionMatrix, viewMatrix, type Pose } from "./camera";

/** The original vgpu fft-ocean fixed camera, copied verbatim as the reference. */
function originalView(): Float32Array {
  const eye = [0, 30, 90], target = [0, 5, 55], pitchDegrees = -10;
  const angle = Math.atan2(eye[1]! - target[1]!, eye[2]! - target[2]!) - (pitchDegrees * Math.PI) / 180;
  const c = Math.cos(angle), s = Math.sin(angle);
  const view = new Float32Array(16);
  view[0] = view[15] = 1;
  view[5] = view[10] = c;
  view[6] = s;
  view[9] = -s;
  view[13] = -(c * eye[1]! - s * eye[2]!);
  view[14] = -(s * eye[1]! + c * eye[2]!);
  return view;
}

const ORIGINAL_PITCH = -(Math.atan2(25, 35) + (10 * Math.PI) / 180);

describe("camera", () => {
  it("reproduces the original example's view matrix", () => {
    const pose: Pose = { eye: [0, 30, 90], yaw: 0, pitch: ORIGINAL_PITCH, fov: Math.PI / 2 };
    const ours = viewMatrix(pose);
    const theirs = originalView();
    for (let i = 0; i < 16; i++) expect(ours[i]).toBeCloseTo(theirs[i]!, 5);
  });

  it("projects the look-at point to the centre of the screen", () => {
    const pose: Pose = { eye: [3, 10, 40], yaw: 0.2, pitch: -0.3, fov: 1.2 };
    const d = 25;
    const p: [number, number, number] = [
      3 + Math.sin(0.2) * Math.cos(-0.3) * d,
      10 + Math.sin(-0.3) * d,
      40 - Math.cos(0.2) * Math.cos(-0.3) * d,
    ];
    const s = projectToScreen(p, viewMatrix(pose), projectionMatrix(pose.fov, 16 / 9), 1600, 900);
    expect(s.visible).toBe(true);
    expect(s.x).toBeCloseTo(800, 3);
    expect(s.y).toBeCloseTo(450, 3);
  });

  it("marks points behind the camera as not visible", () => {
    const pose: Pose = { eye: [0, 10, 0], yaw: 0, pitch: 0, fov: 1 };
    const s = projectToScreen([0, 10, 20], viewMatrix(pose), projectionMatrix(1, 1), 100, 100);
    expect(s.visible).toBe(false);
  });

  it("places the horizon at the centre for a level camera and higher when looking down", () => {
    expect(horizonY(0, 1)).toBeCloseTo(0.5);
    expect(horizonY(-0.3, 1.2)).toBeLessThan(0.5);
  });

  it("interpolates poses through the control point", () => {
    const a: Pose = { eye: [0, 30, 90], yaw: 0, pitch: -0.8, fov: 1.5 };
    const b: Pose = { eye: [0, 8, 40], yaw: 0.1, pitch: -0.3, fov: 1.2 };
    expect(posePath(a, [0, 12, 70], b, 0)).toEqual(a);
    expect(posePath(a, [0, 12, 70], b, 1).eye).toEqual(b.eye);
    expect(posePath(a, [0, 12, 70], b, 0.5).eye[1]).toBeCloseTo(15.5);
  });
});
