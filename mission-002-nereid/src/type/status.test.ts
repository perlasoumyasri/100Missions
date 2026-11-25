import { describe, expect, it } from "vitest";
import { PER_CHAR, typedCount } from "./status";

describe("typedCount", () => {
  it("types at a steady pace and stops at the end of the line", () => {
    expect(typedCount(0, 10)).toBe(0);
    expect(typedCount(PER_CHAR * 3.5, 10)).toBe(3);
    expect(typedCount(99, 10)).toBe(10);
  });
});
