import { describe, expect, it } from "vitest";
import { PER_CHAR, typedCount, visibleLines } from "./console";

describe("visibleLines", () => {
  const ats = [1.57, 2.69, 3.02, 4.35, 5.74];
  it("shows nothing before the first line is reached", () => {
    expect(visibleLines(ats, 1.2)).toEqual([]);
  });
  it("keeps every reached line, newest last, up to three", () => {
    expect(visibleLines(ats, 3.1)).toEqual([0, 1, 2]);
    expect(visibleLines(ats, 6)).toEqual([2, 3, 4]);
  });
  it("drops lines not yet reached when scrolling back", () => {
    expect(visibleLines(ats, 2.7)).toEqual([0, 1]);
  });
});

describe("typedCount", () => {
  it("types at a steady pace and stops at the end of the line", () => {
    expect(typedCount(0, 10)).toBe(0);
    expect(typedCount(PER_CHAR * 3.5, 10)).toBe(3);
    expect(typedCount(99, 10)).toBe(10);
  });
});
