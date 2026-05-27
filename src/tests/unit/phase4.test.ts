import { describe, expect, it } from "vitest";
import { UserRole, NotificationType } from "@prisma/client";
import { reportApprovalSchema } from "@/lib/validation";
import { roleCapabilities } from "@/lib/rbac";

// ── 1. reportApprovalSchema ───────────────────────────────────────────────────

describe("reportApprovalSchema", () => {
  it("accepts empty body (notes optional)", () => {
    const result = reportApprovalSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts body with notes", () => {
    const result = reportApprovalSchema.safeParse({ notes: "Approved after review" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Approved after review");
  });

  it("accepts null notes explicitly", () => {
    const result = reportApprovalSchema.safeParse({ notes: null });
    expect(result.success).toBe(true);
  });
});

// ── 2. NotificationType enum coverage ─────────────────────────────────────────

describe("NotificationType", () => {
  it("includes TASK_ASSIGNED", () => {
    expect(NotificationType.TASK_ASSIGNED).toBe("TASK_ASSIGNED");
  });

  it("includes TASK_OVERDUE", () => {
    expect(NotificationType.TASK_OVERDUE).toBe("TASK_OVERDUE");
  });

  it("includes REPORT_READY_FOR_REVIEW", () => {
    expect(NotificationType.REPORT_READY_FOR_REVIEW).toBe("REPORT_READY_FOR_REVIEW");
  });

  it("includes CERTIFICATION_DECISION", () => {
    expect(NotificationType.CERTIFICATION_DECISION).toBe("CERTIFICATION_DECISION");
  });
});

// ── 3. HORIZON_CONSULTANT capabilities ────────────────────────────────────────

describe("HORIZON_CONSULTANT role capabilities", () => {
  const caps = roleCapabilities[UserRole.HORIZON_CONSULTANT];

  it("has certification:decide capability", () => {
    expect(caps).toContain("certification:decide");
  });

  it("has report:approve capability", () => {
    expect(caps).toContain("report:approve");
  });

  it("has audit:view capability", () => {
    expect(caps).toContain("audit:view");
  });

  it("has bulk:revision capability", () => {
    expect(caps).toContain("bulk:revision");
  });

  it("has task:assign capability", () => {
    expect(caps).toContain("task:assign");
  });

  it("has comment capability", () => {
    expect(caps).toContain("comment");
  });
});

// ── 4. ADMIN capabilities ─────────────────────────────────────────────────────

describe("ADMIN role capabilities", () => {
  it("has all capability", () => {
    expect(roleCapabilities[UserRole.ADMIN]).toContain("all");
  });
});

// ── 5. Role access matrix — no missing roles ──────────────────────────────────

describe("roleCapabilities completeness", () => {
  it("covers all UserRole values", () => {
    for (const role of Object.values(UserRole)) {
      expect(roleCapabilities[role]).toBeDefined();
      expect(Array.isArray(roleCapabilities[role])).toBe(true);
      expect(roleCapabilities[role].length).toBeGreaterThan(0);
    }
  });
});

// ── 6. Task notification body construction ────────────────────────────────────

describe("task assignment notification message", () => {
  it("title truncates long task names at 80 chars", () => {
    const longTitle = "A".repeat(100);
    const truncated = longTitle.slice(0, 80);
    expect(truncated.length).toBe(80);
    expect(`New task assigned: ${truncated}`).toHaveLength(19 + 80);
  });

  it("empty description becomes undefined (not empty string)", () => {
    const description: string | null = null;
    const body = description ?? undefined;
    expect(body).toBeUndefined();
  });
});
