import { describe, expect, it } from "vitest";
import { PER_CHAR, currentLine, typedCount } from "./console";

describe("currentLine", () => {
  const ats = [1.57, 2.69, 3.02, 4.36];
  it("is none before the first message, then the newest reached", () => {
    expect(currentLine(ats, 1.2)).toBe(-1);
    expect(currentLine(ats, 2.8)).toBe(1);
    expect(currentLine(ats, 9)).toBe(3);
  });
});

describe("typedCount", () => {
  it("types at a steady pace and stops at the end of the message", () => {
    expect(typedCount(0, 10)).toBe(0);
    expect(typedCount(PER_CHAR * 3.5, 10)).toBe(3);
    expect(typedCount(99, 10)).toBe(10);
  });
});
