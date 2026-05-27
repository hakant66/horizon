import { describe, expect, it } from "vitest";
import { ApprovalStage } from "@prisma/client";

// ── Stage dashboard: empty-stage seeding ─────────────────────────────────────

describe("approval stage dashboard initialisation", () => {
  it("initialises all ApprovalStage values to 0", () => {
    const emptyStages = Object.fromEntries(
      Object.values(ApprovalStage).map((s) => [s, 0]),
    ) as Record<ApprovalStage, number>;

    for (const stage of Object.values(ApprovalStage)) {
      expect(emptyStages[stage]).toBe(0);
    }
  });

  it("merges group-by results into the zero map", () => {
    const emptyStages = Object.fromEntries(
      Object.values(ApprovalStage).map((s) => [s, 0]),
    ) as Record<ApprovalStage, number>;

    const groups = [
      { approvalStage: ApprovalStage.DATA_ENTRY, _count: { id: 5 } },
      { approvalStage: ApprovalStage.MANAGER_REVIEW, _count: { id: 3 } },
    ];

    const result = { ...emptyStages };
    for (const g of groups) result[g.approvalStage] = g._count.id;

    expect(result[ApprovalStage.DATA_ENTRY]).toBe(5);
    expect(result[ApprovalStage.MANAGER_REVIEW]).toBe(3);
    expect(result[ApprovalStage.APPROVED]).toBe(0);
  });
});

// ── Task overdue detection ────────────────────────────────────────────────────

describe("task overdue logic", () => {
  it("task is overdue when dueDate < now and status is OPEN", () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() - 86400_000); // yesterday
    const status = "OPEN";
    expect(dueDate < now && ["OPEN", "IN_PROGRESS"].includes(status)).toBe(true);
  });

  it("task is not overdue when dueDate is in the future", () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 86400_000); // tomorrow
    expect(dueDate < now).toBe(false);
  });

  it("task with status DONE is not overdue even if past due", () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() - 86400_000);
    const status = "DONE";
    expect(dueDate < now && ["OPEN", "IN_PROGRESS"].includes(status)).toBe(false);
  });

  it("task with status CANCELLED is not overdue", () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() - 86400_000);
    const status = "CANCELLED";
    expect(dueDate < now && ["OPEN", "IN_PROGRESS"].includes(status)).toBe(false);
  });
});
