import { describe, it, expect, vi, beforeEach } from "vitest";
import { deriveTargetStatus, createTarget, updateTarget, deleteTarget, listTargets } from "@/services/target.service";
import type { AuthUser } from "@/services/types";

// ── mock prisma ────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    target: {
      findMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({ createAuditLog: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const user: AuthUser = { id: "u1", organizationId: "org1", role: "SUSTAINABILITY_MANAGER" };

const baseTarget = {
  id: "t1",
  organizationId: "org1",
  reportingPeriodId: "rp1",
  name: "Net Zero 2030",
  metricDefinitionId: "md1",
  baselineYear: 2020,
  baselineValue: "1000",
  targetYear: 2030,
  targetValue: "0",
  currentValue: "600",
  status: "AT_RISK",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

// ─── deriveTargetStatus ────────────────────────────────────────────────────────
describe("deriveTargetStatus", () => {
  it("returns ON_TRACK at or above 66%", () => {
    expect(deriveTargetStatus(66)).toBe("ON_TRACK");
    expect(deriveTargetStatus(100)).toBe("ON_TRACK");
  });

  it("returns AT_RISK between 33 and 65", () => {
    expect(deriveTargetStatus(33)).toBe("AT_RISK");
    expect(deriveTargetStatus(65)).toBe("AT_RISK");
  });

  it("returns OFF_TRACK below 33%", () => {
    expect(deriveTargetStatus(0)).toBe("OFF_TRACK");
    expect(deriveTargetStatus(32)).toBe("OFF_TRACK");
  });
});

// ─── createTarget ─────────────────────────────────────────────────────────────
describe("createTarget", () => {
  it("creates a target and calls audit log", async () => {
    vi.mocked(prisma.target.create).mockResolvedValue(baseTarget as never);

    const payload = {
      reportingPeriodId: "rp1",
      name: "Net Zero 2030",
      metricDefinitionId: "md1",
      baselineYear: 2020,
      baselineValue: 1000,
      targetYear: 2030,
      targetValue: 0,
      currentValue: 600,
    };

    const result = await createTarget(user, payload as never);

    expect(prisma.target.create).toHaveBeenCalledOnce();
    const createCall = vi.mocked(prisma.target.create).mock.calls[0][0];
    expect(createCall.data.organizationId).toBe("org1");
    expect(createCall.data.name).toBe("Net Zero 2030");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TARGET_CREATED", entityType: "Target" }),
    );

    expect(result).toBe(baseTarget);
  });

  it("derives status from progress when payload.status is absent", async () => {
    vi.mocked(prisma.target.create).mockResolvedValue({ ...baseTarget, status: "AT_RISK" } as never);

    await createTarget(user, {
      reportingPeriodId: "rp1",
      name: "T",
      metricDefinitionId: "md1",
      baselineYear: 2020,
      baselineValue: 1000,
      targetYear: 2030,
      targetValue: 0,
      currentValue: 600, // 40% progress → AT_RISK
    } as never);

    const data = vi.mocked(prisma.target.create).mock.calls[0][0].data;
    expect(data.status).toBe("AT_RISK");
  });
});

// ─── updateTarget ─────────────────────────────────────────────────────────────
describe("updateTarget", () => {
  it("throws if id is missing", async () => {
    await expect(updateTarget(user, { name: "X" } as never)).rejects.toThrow("id required");
  });

  it("scopes findFirstOrThrow to organizationId", async () => {
    vi.mocked(prisma.target.findFirstOrThrow).mockResolvedValue(baseTarget as never);
    vi.mocked(prisma.target.update).mockResolvedValue(baseTarget as never);

    await updateTarget(user, { id: "t1", reportingPeriodId: "rp1", name: "T", metricDefinitionId: "md1", baselineYear: 2020, baselineValue: 1000, targetYear: 2030, targetValue: 0, currentValue: 600 } as never);

    const where = vi.mocked(prisma.target.findFirstOrThrow).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ id: "t1", organizationId: "org1" });
  });
});

// ─── deleteTarget ─────────────────────────────────────────────────────────────
describe("deleteTarget", () => {
  it("deletes and logs the audit trail", async () => {
    vi.mocked(prisma.target.findFirstOrThrow).mockResolvedValue(baseTarget as never);
    vi.mocked(prisma.target.delete).mockResolvedValue(baseTarget as never);

    await deleteTarget(user, "t1");

    expect(prisma.target.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TARGET_DELETED", entityId: "t1" }),
    );
  });

  it("scopes findFirstOrThrow to organizationId (tenant isolation)", async () => {
    vi.mocked(prisma.target.findFirstOrThrow).mockResolvedValue(baseTarget as never);
    vi.mocked(prisma.target.delete).mockResolvedValue(baseTarget as never);

    await deleteTarget(user, "t1");

    const where = vi.mocked(prisma.target.findFirstOrThrow).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ id: "t1", organizationId: "org1" });
  });
});

// ─── listTargets ──────────────────────────────────────────────────────────────
describe("listTargets", () => {
  it("passes organizationId to where clause", async () => {
    vi.mocked(prisma.target.findMany).mockResolvedValue([]);

    await listTargets(user);

    const where = vi.mocked(prisma.target.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ organizationId: "org1" });
  });

  it("filters by reportingPeriodId when provided", async () => {
    vi.mocked(prisma.target.findMany).mockResolvedValue([]);

    await listTargets(user, "rp42");

    const where = vi.mocked(prisma.target.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ organizationId: "org1", reportingPeriodId: "rp42" });
  });

  it("attaches a calculated progress field to each target", async () => {
    vi.mocked(prisma.target.findMany).mockResolvedValue([
      { ...baseTarget, baselineValue: "1000", currentValue: "500", targetValue: "0" } as never,
    ]);

    const results = await listTargets(user);

    expect(results[0]).toHaveProperty("progress");
    // baseline=1000, current=500, target=0  →  (1000-500)/(1000-0)*100 = 50
    expect(results[0].progress).toBe(50);
  });
});
