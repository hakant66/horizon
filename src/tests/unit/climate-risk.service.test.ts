import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  probabilityToScore,
  listRisks,
  createRisk,
  updateRisk,
  deleteRisk,
} from "@/services/climate-risk.service";
import type { AuthUser } from "@/services/types";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    climateRisk: {
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

const baseRisk = {
  id: "r1",
  organizationId: "org1",
  reportingPeriodId: "rp1",
  name: "Flood risk",
  type: "PHYSICAL_ACUTE",
  probability: "High",
  impact: "High",
  probabilityScore: 4,
  impactScore: 4,
  riskScore: 16,
  status: "Open",
  entryType: "RISK",
  facilityId: null,
  ownerUserId: null,
  timeHorizon: null,
  residualRisk: null,
  regulatoryRef: null,
  financialImpactEstimate: null,
  mitigationPlan: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

// ─── probabilityToScore ───────────────────────────────────────────────────────
describe("probabilityToScore", () => {
  it("maps High to 4", () => expect(probabilityToScore("High")).toBe(4));
  it("maps Medium to 2", () => expect(probabilityToScore("Medium")).toBe(2));
  it("maps Low to 1",    () => expect(probabilityToScore("Low")).toBe(1));
  it("defaults unknown to 2", () => expect(probabilityToScore("Unknown")).toBe(2));
});

// ─── listRisks ────────────────────────────────────────────────────────────────
describe("listRisks", () => {
  it("scopes query to organizationId", async () => {
    vi.mocked(prisma.climateRisk.findMany).mockResolvedValue([]);
    await listRisks(user);
    const where = vi.mocked(prisma.climateRisk.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ organizationId: "org1" });
  });

  it("includes reportingPeriodId filter when provided", async () => {
    vi.mocked(prisma.climateRisk.findMany).mockResolvedValue([]);
    await listRisks(user, "rp42");
    const where = vi.mocked(prisma.climateRisk.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ organizationId: "org1", reportingPeriodId: "rp42" });
  });
});

// ─── createRisk ───────────────────────────────────────────────────────────────
describe("createRisk", () => {
  it("computes riskScore as probability * impact", async () => {
    vi.mocked(prisma.climateRisk.create).mockResolvedValue(baseRisk as never);
    const payload = {
      reportingPeriodId: "rp1",
      name: "Flood risk",
      type: "PHYSICAL_ACUTE",
      probability: "High",  // score 4
      impact: "Medium",     // score 2
      status: "Open",
    };

    await createRisk(user, payload as never);

    const data = vi.mocked(prisma.climateRisk.create).mock.calls[0][0].data;
    expect(data.riskScore).toBe(8); // 4 × 2
    expect(data.probabilityScore).toBe(4);
    expect(data.impactScore).toBe(2);
  });

  it("uses explicit probabilityScore / impactScore when provided", async () => {
    vi.mocked(prisma.climateRisk.create).mockResolvedValue(baseRisk as never);
    const payload = {
      reportingPeriodId: "rp1",
      name: "X",
      type: "PHYSICAL_ACUTE",
      probability: "Low",
      impact: "Low",
      probabilityScore: 5,
      impactScore: 5,
      status: "Open",
    };

    await createRisk(user, payload as never);

    const data = vi.mocked(prisma.climateRisk.create).mock.calls[0][0].data;
    expect(data.riskScore).toBe(25); // 5 × 5 (overrides Low=1)
  });

  it("calls createAuditLog with CLIMATE_RISK_CREATED", async () => {
    vi.mocked(prisma.climateRisk.create).mockResolvedValue(baseRisk as never);
    await createRisk(user, { reportingPeriodId: "rp1", name: "X", type: "PHYSICAL_ACUTE", probability: "Low", impact: "Low", status: "Open" } as never);
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "CLIMATE_RISK_CREATED" }));
  });
});

// ─── updateRisk ───────────────────────────────────────────────────────────────
describe("updateRisk", () => {
  it("throws if id is missing", async () => {
    await expect(updateRisk(user, { name: "X" } as never)).rejects.toThrow("id is required");
  });

  it("scopes findFirstOrThrow to organizationId", async () => {
    vi.mocked(prisma.climateRisk.findFirstOrThrow).mockResolvedValue(baseRisk as never);
    vi.mocked(prisma.climateRisk.update).mockResolvedValue(baseRisk as never);
    await updateRisk(user, { id: "r1", reportingPeriodId: "rp1", name: "X", type: "PHYSICAL_ACUTE", probability: "Low", impact: "Low", status: "Open" } as never);
    const where = vi.mocked(prisma.climateRisk.findFirstOrThrow).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ id: "r1", organizationId: "org1" });
  });
});

// ─── deleteRisk ───────────────────────────────────────────────────────────────
describe("deleteRisk", () => {
  it("scopes findFirstOrThrow by org and deletes", async () => {
    vi.mocked(prisma.climateRisk.findFirstOrThrow).mockResolvedValue(baseRisk as never);
    vi.mocked(prisma.climateRisk.delete).mockResolvedValue(baseRisk as never);
    await deleteRisk(user, "r1");
    expect(prisma.climateRisk.findFirstOrThrow).toHaveBeenCalledWith({ where: { id: "r1", organizationId: "org1" } });
    expect(prisma.climateRisk.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
