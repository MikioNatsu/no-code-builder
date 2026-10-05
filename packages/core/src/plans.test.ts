import { describe, expect, it } from "vitest";
import { canAcceptNewEndUser, canCreateBot } from "./plans.js";

describe("free plan limits", () => {
  it("allows one bot", () => {
    expect(canCreateBot("free", 0)).toBe(true);
    expect(canCreateBot("free", 1)).toBe(false);
  });

  it("allows 500 end users per bot", () => {
    expect(canAcceptNewEndUser("free", 499)).toBe(true);
    expect(canAcceptNewEndUser("free", 500)).toBe(false);
  });
});
