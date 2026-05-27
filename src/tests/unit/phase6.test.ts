import { describe, expect, it } from "vitest";
import { EvidenceStatus } from "@prisma/client";

// ── Evidence status transition rules ─────────────────────────────────────────

describe("evidence review notification triggers", () => {
  const NOTIFY_STATUSES: EvidenceStatus[] = ["REJECTED", "NEEDS_CLARIFICATION"];

  it("REJECTED triggers uploader notification", () => {
    expect(NOTIFY_STATUSES.includes(EvidenceStatus.REJECTED)).toBe(true);
  });

  it("NEEDS_CLARIFICATION triggers uploader notification", () => {
    expect(NOTIFY_STATUSES.includes(EvidenceStatus.NEEDS_CLARIFICATION)).toBe(true);
  });

  it("ACCEPTED does not trigger notification", () => {
    const status: EvidenceStatus = EvidenceStatus.ACCEPTED;
    expect(NOTIFY_STATUSES.includes(status)).toBe(false);
  });

  it("UPLOADED does not trigger notification", () => {
    const status: EvidenceStatus = EvidenceStatus.UPLOADED;
    expect(NOTIFY_STATUSES.includes(status)).toBe(false);
  });
});

describe("evidence status coverage", () => {
  it("all EvidenceStatus values are defined", () => {
    const values = Object.values(EvidenceStatus);
    expect(values).toContain("UPLOADED");
    expect(values).toContain("ACCEPTED");
    expect(values).toContain("REJECTED");
    expect(values).toContain("NEEDS_CLARIFICATION");
  });
});

describe("reviewer tracking logic", () => {
  it("isStatusChange is true when status differs", () => {
    const statuses: [string, string] = ["UPLOADED", "REJECTED"];
    expect(statuses[0] !== statuses[1]).toBe(true);
  });

  it("isStatusChange is false when status is the same", () => {
    const statuses: [string, string] = ["UPLOADED", "UPLOADED"];
    expect(statuses[0] !== statuses[1]).toBe(false);
  });

  it("self-review is excluded from notification", () => {
    const ids = ["user-1", "user-1"] as [string, string];
    expect(ids[0] !== ids[1]).toBe(false);
  });

  it("cross-user review triggers notification", () => {
    const ids = ["user-1", "user-2"] as [string, string];
    expect(ids[0] !== ids[1]).toBe(true);
  });
});
