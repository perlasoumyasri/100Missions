import { describe, expect, it } from "vitest";
import { shoot } from "./director";

describe("director", () => {
  it("shows one world per chapter, with seams only at the physical events", () => {
    const at = (p: number) => shoot(p, 10).weights;
    expect(at(0.5)).toEqual({ space: 1, shaft: 0, ocean: 0 });
    expect(at(2.2)).toEqual({ space: 1, shaft: 0, ocean: 0 });
    expect(at(2.8)).toEqual({ space: 0, shaft: 1, ocean: 0 });
    expect(at(4.5)).toEqual({ space: 0, shaft: 0, ocean: 1 });
    expect(at(6.8)).toEqual({ space: 1, shaft: 0, ocean: 0 });
  });

  it("flashes at the dive and the breakthrough, and nowhere else", () => {
    expect(shoot(2.38, 0).flash).toBeGreaterThan(0.15);
    expect(shoot(3.02, 0).flash).toBeGreaterThan(0.35);
    for (const p of [0.5, 1.5, 2.1, 2.8, 4, 5, 6.15, 6.6]) expect(shoot(p, 0).flash).toBeLessThan(0.01);
  });

  it("counts depth down through the ice and keeps it consistent", () => {
    expect(shoot(1.5, 0).depthM).toBe(0);
    expect(shoot(2.2, 0).depthM).toBe(0);
    const a = shoot(2.6, 0).depthM;
    const b = shoot(2.8, 0).depthM;
    expect(b).toBeGreaterThan(a);
    expect(shoot(3.0, 0).depthM).toBeCloseTo(19_800, -2);
  });

  it("opens the fracture only during the dive", () => {
    expect(shoot(1.5, 0).crackOpen).toBe(0);
    expect(shoot(2.45, 0).crackOpen).toBeGreaterThan(0.9);
    expect(shoot(6.8, 0).crackOpen).toBe(0);
  });

  it("reaches the user-approved ocean frames: the surface pose in First Contact, the survey pose at the end of The Anomaly", () => {
    const contact = shoot(3.8, 0).ocean.eye;
    expect(contact[0]).toBeCloseTo(0, 3);
    expect(contact[2]).toBeCloseTo(90, 3);
    const survey = shoot(4.9999, 0).ocean.eye;
    expect(survey[2]).toBeCloseTo(48, 1);
  });
});
