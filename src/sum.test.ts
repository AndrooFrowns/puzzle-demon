import sum from "./sum"
import {describe, expect, it} from "vitest"

// example on how to do a unit test

describe("#sum separate file", () => {
  it("returns zero with no numbers", () => {
    expect(sum()).toBe(0);
  });

  it("returns same number with one number", () => {
    expect(sum(0)).toBe(0);
    expect(sum(1)).toBe(1);
    expect(sum(-1)).toBe(-1);
    expect(sum(999)).toBe(999);
  });

  it("returns sum with multiple numbers", () => {
    expect(sum(0, 1)).toBe(1);
    expect(sum(0, 1, 2)).toBe(3);
    expect(sum(-3, 1, 2)).toBe(0);
  });
});
