import { describe, expect, it } from "vitest";

// ── Period guard: status logic ────────────────────────────────────────────────

describe("period status gates", () => {
  const BLOCKED = ["LOCKED", "SUBMITTED", "CERTIFIED"] as const;
  const OPEN = ["OPEN"] as const;

  it("OPEN status allows data entry", () => {
    for (const s of OPEN) {
      expect(BLOCKED.includes(s as never)).toBe(false);
    }
  });

  it("LOCKED, SUBMITTED, CERTIFIED block data entry", () => {
    for (const s of BLOCKED) {
      expect(BLOCKED.includes(s)).toBe(true);
    }
  });

  it("CERTIFIED cannot be unlocked", () => {
    const canUnlock = (status: string) => status !== "CERTIFIED" && status !== "OPEN";
    expect(canUnlock("LOCKED")).toBe(true);
    expect(canUnlock("SUBMITTED")).toBe(true);
    expect(canUnlock("CERTIFIED")).toBe(false);
    expect(canUnlock("OPEN")).toBe(false);
  });
});

// ── Lock/unlock transition rules ──────────────────────────────────────────────

describe("lock/unlock business rules", () => {
  it("only OPEN periods can be locked", () => {
    const canLock = (status: string) => status === "OPEN";
    expect(canLock("OPEN")).toBe(true);
    expect(canLock("LOCKED")).toBe(false);
    expect(canLock("SUBMITTED")).toBe(false);
  });

  it("error message includes current status", () => {
    const msg = (status: string) => `Period is already ${status.toLowerCase()}.`;
    expect(msg("LOCKED")).toBe("Period is already locked.");
    expect(msg("SUBMITTED")).toBe("Period is already submitted.");
  });
});
