import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listMetricEntries,
  upsertMetricEntry,
  updateMetricEntry,
  transitionMetricStage,
} from "@/services/metric-entry.service";
import type { AuthUser } from "@/services/types";

// ── mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization:    { findUnique: vi.fn() },
    metricEntry:     { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findFirstOrThrow: vi.fn(), create: vi.fn(), update: vi.fn() },
    reportingPeriod: { findUnique: vi.fn(), findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/audit",         () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/notifications",  () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/period-guard",   () => ({ assertPeriodOpen: vi.fn() }));
vi.mock("@/lib/anomaly",        () => ({ detectAnomaly: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/evidence-gate",  () => ({
  transitionRequiresEvidence: vi.fn().mockReturnValue(false),
  hasEvidence: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/approval",       () => ({ validateTransition: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/sector-mappings", () => ({ getSectorMetricCodes: vi.fn().mockReturnValue(["electricity_consumption"]) }));

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { assertPeriodOpen } from "@/lib/period-guard";
import { detectAnomaly } from "@/lib/anomaly";
import { validateTransition } from "@/lib/approval";
import { transitionRequiresEvidence, hasEvidence } from "@/lib/evidence-gate";

const user: AuthUser = { id: "u1", organizationId: "org1", role: "SUSTAINABILITY_MANAGER" };

const baseEntry = {
  id: "e1",
  organizationId: "org1",
  facilityId: "f1",
  reportingPeriodId: "rp1",
  metricDefinitionId: "md1",
  value: "1000",
  unit: "kWh",
  status: "IN_PROGRESS",
  approvalStage: "DATA_ENTRY",
  ownerUserId: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerUser: null,
};

const basePayload = {
  facilityId: "f1",
  reportingPeriodId: "rp1",
  metricDefinitionId: "md1",
  value: 1000,
  unit: "kWh",
};

beforeEach(() => vi.clearAllMocks());

// ─── listMetricEntries ────────────────────────────────────────────────────────
describe("listMetricEntries", () => {
  it("scopes query to organizationId", async () => {
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ sasbSector: null } as never);
    vi.mocked(prisma.metricEntry.findMany).mockResolvedValue([]);

    await listMetricEntries(user);

    const where = vi.mocked(prisma.metricEntry.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ organizationId: "org1" });
  });

  it("filters by facilityId and reportingPeriodId when provided", async () => {
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ sasbSector: null } as never);
    vi.mocked(prisma.metricEntry.findMany).mockResolvedValue([]);

    await listMetricEntries(user, { facilityId: "f99", reportingPeriodId: "rp2" });

    const where = vi.mocked(prisma.metricEntry.findMany).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ organizationId: "org1", facilityId: "f99", reportingPeriodId: "rp2" });
  });
});

// ─── upsertMetricEntry ────────────────────────────────────────────────────────
describe("upsertMetricEntry", () => {
  it("creates a new entry when none exists and returns isNew:true", async () => {
    vi.mocked(assertPeriodOpen).mockResolvedValue(undefined);
    vi.mocked(prisma.metricEntry.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.reportingPeriod.findUnique).mockResolvedValue(null); // no prev period
    vi.mocked(prisma.metricEntry.create).mockResolvedValue(baseEntry as never);

    const result = await upsertMetricEntry(user, basePayload as never);

    expect(prisma.metricEntry.create).toHaveBeenCalledOnce();
    expect(result.isNew).toBe(true);
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "METRIC_ENTRY_CREATED" }),
    );
  });

  it("updates an existing entry and returns isNew:false", async () => {
    vi.mocked(assertPeriodOpen).mockResolvedValue(undefined);
    vi.mocked(prisma.metricEntry.findUnique).mockResolvedValue(baseEntry as never);
    vi.mocked(prisma.reportingPeriod.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.metricEntry.update).mockResolvedValue(baseEntry as never);

    const result = await upsertMetricEntry(user, basePayload as never);

    expect(prisma.metricEntry.update).toHaveBeenCalledOnce();
    expect(result.isNew).toBe(false);
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "METRIC_ENTRY_UPDATED" }),
    );
  });

  it("throws before writing when anomaly detector returns isBlock:true", async () => {
    vi.mocked(assertPeriodOpen).mockResolvedValue(undefined);
    vi.mocked(prisma.metricEntry.findUnique).mockResolvedValue(null);
    // Simulate a previous value that exists.
    vi.mocked(prisma.reportingPeriod.findUnique).mockResolvedValue({ startDate: new Date("2023-01-01") } as never);
    vi.mocked(prisma.reportingPeriod.findFirst).mockResolvedValue({ id: "rp0" } as never);
    vi.mocked(prisma.metricEntry.findFirst).mockResolvedValue({ value: "10" } as never);
    // Anomaly detector says block.
    vi.mocked(detectAnomaly).mockReturnValue({ isBlock: true, isWarning: false, pctChange: 600 } as never);

    await expect(upsertMetricEntry(user, basePayload as never)).rejects.toThrow(
      "Year-over-year change",
    );
    expect(prisma.metricEntry.create).not.toHaveBeenCalled();
  });
});

// ─── updateMetricEntry ────────────────────────────────────────────────────────
describe("updateMetricEntry", () => {
  it("throws if id is missing", async () => {
    await expect(updateMetricEntry(user, { unit: "kWh" } as never)).rejects.toThrow("id is required");
  });

  it("scopes findFirstOrThrow to organizationId", async () => {
    vi.mocked(prisma.metricEntry.findFirstOrThrow).mockResolvedValue(baseEntry as never);
    vi.mocked(prisma.metricEntry.update).mockResolvedValue(baseEntry as never);

    await updateMetricEntry(user, { id: "e1", facilityId: "f1", reportingPeriodId: "rp1", metricDefinitionId: "md1", value: 500, unit: "kWh" } as never);

    const where = vi.mocked(prisma.metricEntry.findFirstOrThrow).mock.calls[0][0]?.where;
    expect(where).toMatchObject({ id: "e1", organizationId: "org1" });
  });
});

// ─── transitionMetricStage ────────────────────────────────────────────────────
describe("transitionMetricStage", () => {
  it("updates approvalStage and writes audit log on valid transition", async () => {
    vi.mocked(prisma.metricEntry.findFirstOrThrow).mockResolvedValue(baseEntry as never);
    vi.mocked(validateTransition).mockReturnValue(null);
    vi.mocked(transitionRequiresEvidence).mockReturnValue(false);
    vi.mocked(prisma.metricEntry.update).mockResolvedValue({ ...baseEntry, approvalStage: "MANAGER_REVIEW" } as never);

    await transitionMetricStage(user, { id: "e1", approvalStage: "MANAGER_REVIEW" } as never);

    expect(prisma.metricEntry.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { approvalStage: "MANAGER_REVIEW" },
    });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "METRIC_STAGE_TRANSITIONED" }),
    );
  });

  it("throws with httpStatus 403 when validateTransition returns FORBIDDEN", async () => {
    vi.mocked(prisma.metricEntry.findFirstOrThrow).mockResolvedValue(baseEntry as never);
    vi.mocked(validateTransition).mockReturnValue({ message: "Forbidden", code: "FORBIDDEN" } as never);

    const err = await transitionMetricStage(user, { id: "e1", approvalStage: "APPROVED" } as never).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as { httpStatus: number }).httpStatus).toBe(403);
  });

  it("throws with httpStatus 422 when evidence is required but missing", async () => {
    vi.mocked(prisma.metricEntry.findFirstOrThrow).mockResolvedValue(baseEntry as never);
    vi.mocked(validateTransition).mockReturnValue(null);
    vi.mocked(transitionRequiresEvidence).mockReturnValue(true);
    vi.mocked(hasEvidence).mockResolvedValue(false);

    const err = await transitionMetricStage(user, { id: "e1", approvalStage: "HORIZON_REVIEW" } as never).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as { httpStatus: number }).httpStatus).toBe(422);
    expect(err.message).toContain("Evidence is required");
  });

  it("notifies the metric owner when the transition succeeds", async () => {
    const entryWithOwner = { ...baseEntry, ownerUser: { id: "owner1" } };
    vi.mocked(prisma.metricEntry.findFirstOrThrow).mockResolvedValue(entryWithOwner as never);
    vi.mocked(validateTransition).mockReturnValue(null);
    vi.mocked(transitionRequiresEvidence).mockReturnValue(false);
    vi.mocked(prisma.metricEntry.update).mockResolvedValue({ ...baseEntry, approvalStage: "APPROVED" } as never);

    await transitionMetricStage(user, { id: "e1", approvalStage: "APPROVED", comment: "All good" } as never);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "owner1", type: "METRIC_APPROVED" }),
    );
  });

  it("does NOT notify when actor IS the owner", async () => {
    const entryOwnedByActor = { ...baseEntry, ownerUser: { id: "u1" } }; // same as user.id
    vi.mocked(prisma.metricEntry.findFirstOrThrow).mockResolvedValue(entryOwnedByActor as never);
    vi.mocked(validateTransition).mockReturnValue(null);
    vi.mocked(transitionRequiresEvidence).mockReturnValue(false);
    vi.mocked(prisma.metricEntry.update).mockResolvedValue(baseEntry as never);

    await transitionMetricStage(user, { id: "e1", approvalStage: "MANAGER_REVIEW" } as never);

    expect(createNotification).not.toHaveBeenCalled();
  });
});
