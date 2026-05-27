import { describe, expect, it } from "vitest";
import { ApprovalStage, UserRole } from "@prisma/client";
import {
  approvalStageTransitionSchema,
  bulkRevisionSchema,
  notificationReadSchema,
  questionnaireAnswerSchema,
  metricEntrySchema,
} from "@/lib/validation";
import {
  validateTransition,
  canTransitionTo,
  STAGE_LABELS,
} from "@/lib/approval";

// ── 1. ApprovalStage transition validation ────────────────────────────────────

describe("validateTransition — happy paths", () => {
  it("DATA_CONTRIBUTOR can submit to MANAGER_REVIEW from DATA_ENTRY", () => {
    const result = validateTransition(
      ApprovalStage.DATA_ENTRY,
      ApprovalStage.MANAGER_REVIEW,
      UserRole.DATA_CONTRIBUTOR,
    );
    expect(result).toBeNull();
  });

  it("SUSTAINABILITY_MANAGER can submit to MANAGER_REVIEW from DATA_ENTRY", () => {
    expect(
      validateTransition(ApprovalStage.DATA_ENTRY, ApprovalStage.MANAGER_REVIEW, UserRole.SUSTAINABILITY_MANAGER),
    ).toBeNull();
  });

  it("SUSTAINABILITY_MANAGER can escalate to HORIZON_REVIEW from MANAGER_REVIEW", () => {
    expect(
      validateTransition(ApprovalStage.MANAGER_REVIEW, ApprovalStage.HORIZON_REVIEW, UserRole.SUSTAINABILITY_MANAGER),
    ).toBeNull();
  });

  it("ADMIN can escalate to HORIZON_REVIEW from MANAGER_REVIEW", () => {
    expect(
      validateTransition(ApprovalStage.MANAGER_REVIEW, ApprovalStage.HORIZON_REVIEW, UserRole.ADMIN),
    ).toBeNull();
  });

  it("HORIZON_CONSULTANT can approve from HORIZON_REVIEW", () => {
    expect(
      validateTransition(ApprovalStage.HORIZON_REVIEW, ApprovalStage.APPROVED, UserRole.HORIZON_CONSULTANT),
    ).toBeNull();
  });

  it("ADMIN can approve from HORIZON_REVIEW", () => {
    expect(
      validateTransition(ApprovalStage.HORIZON_REVIEW, ApprovalStage.APPROVED, UserRole.ADMIN),
    ).toBeNull();
  });

  it("HORIZON_CONSULTANT can request revision from HORIZON_REVIEW", () => {
    expect(
      validateTransition(ApprovalStage.HORIZON_REVIEW, ApprovalStage.REVISION_REQUESTED, UserRole.HORIZON_CONSULTANT),
    ).toBeNull();
  });

  it("SUSTAINABILITY_MANAGER can request revision from MANAGER_REVIEW", () => {
    expect(
      validateTransition(ApprovalStage.MANAGER_REVIEW, ApprovalStage.REVISION_REQUESTED, UserRole.SUSTAINABILITY_MANAGER),
    ).toBeNull();
  });

  it("HORIZON_CONSULTANT can request revision from APPROVED", () => {
    expect(
      validateTransition(ApprovalStage.APPROVED, ApprovalStage.REVISION_REQUESTED, UserRole.HORIZON_CONSULTANT),
    ).toBeNull();
  });

  it("DATA_CONTRIBUTOR can reset from REVISION_REQUESTED to DATA_ENTRY", () => {
    expect(
      validateTransition(ApprovalStage.REVISION_REQUESTED, ApprovalStage.DATA_ENTRY, UserRole.DATA_CONTRIBUTOR),
    ).toBeNull();
  });

  it("same stage transition is a no-op (null)", () => {
    expect(
      validateTransition(ApprovalStage.APPROVED, ApprovalStage.APPROVED, UserRole.ADMIN),
    ).toBeNull();
  });
});

describe("validateTransition — error cases", () => {
  it("DATA_CONTRIBUTOR cannot approve from HORIZON_REVIEW (FORBIDDEN)", () => {
    const result = validateTransition(
      ApprovalStage.HORIZON_REVIEW,
      ApprovalStage.APPROVED,
      UserRole.DATA_CONTRIBUTOR,
    );
    expect(result).not.toBeNull();
    expect(result?.code).toBe("FORBIDDEN");
  });

  it("DATA_CONTRIBUTOR cannot skip directly to HORIZON_REVIEW (INVALID_TRANSITION)", () => {
    const result = validateTransition(
      ApprovalStage.DATA_ENTRY,
      ApprovalStage.HORIZON_REVIEW,
      UserRole.DATA_CONTRIBUTOR,
    );
    expect(result).not.toBeNull();
    expect(result?.code).toBe("INVALID_TRANSITION");
  });

  it("FINANCE_REVIEWER cannot approve from HORIZON_REVIEW (FORBIDDEN)", () => {
    const result = validateTransition(
      ApprovalStage.HORIZON_REVIEW,
      ApprovalStage.APPROVED,
      UserRole.FINANCE_REVIEWER,
    );
    expect(result?.code).toBe("FORBIDDEN");
  });

  it("DATA_CONTRIBUTOR cannot request revision from MANAGER_REVIEW (FORBIDDEN)", () => {
    const result = validateTransition(
      ApprovalStage.MANAGER_REVIEW,
      ApprovalStage.REVISION_REQUESTED,
      UserRole.DATA_CONTRIBUTOR,
    );
    expect(result?.code).toBe("FORBIDDEN");
  });

  it("HORIZON_CONSULTANT cannot escalate from DATA_ENTRY to MANAGER_REVIEW (FORBIDDEN)", () => {
    const result = validateTransition(
      ApprovalStage.DATA_ENTRY,
      ApprovalStage.MANAGER_REVIEW,
      UserRole.HORIZON_CONSULTANT,
    );
    expect(result?.code).toBe("FORBIDDEN");
  });

  it("cannot jump from DATA_ENTRY to APPROVED (INVALID_TRANSITION)", () => {
    const result = validateTransition(
      ApprovalStage.DATA_ENTRY,
      ApprovalStage.APPROVED,
      UserRole.ADMIN,
    );
    expect(result?.code).toBe("INVALID_TRANSITION");
  });

  it("cannot reset DATA_ENTRY to DATA_ENTRY without going through revision (INVALID_TRANSITION)", () => {
    const result = validateTransition(
      ApprovalStage.MANAGER_REVIEW,
      ApprovalStage.DATA_ENTRY,
      UserRole.ADMIN,
    );
    expect(result?.code).toBe("INVALID_TRANSITION");
  });
});

// ── 2. canTransitionTo ────────────────────────────────────────────────────────

describe("canTransitionTo", () => {
  it("HORIZON_CONSULTANT can transition to APPROVED", () => {
    expect(canTransitionTo(ApprovalStage.APPROVED, UserRole.HORIZON_CONSULTANT)).toBe(true);
  });

  it("DATA_CONTRIBUTOR cannot transition to APPROVED", () => {
    expect(canTransitionTo(ApprovalStage.APPROVED, UserRole.DATA_CONTRIBUTOR)).toBe(false);
  });

  it("DATA_CONTRIBUTOR can transition to MANAGER_REVIEW", () => {
    expect(canTransitionTo(ApprovalStage.MANAGER_REVIEW, UserRole.DATA_CONTRIBUTOR)).toBe(true);
  });

  it("SUSTAINABILITY_MANAGER can request revision", () => {
    expect(canTransitionTo(ApprovalStage.REVISION_REQUESTED, UserRole.SUSTAINABILITY_MANAGER)).toBe(true);
  });
});

// ── 3. STAGE_LABELS ───────────────────────────────────────────────────────────

describe("STAGE_LABELS", () => {
  it("covers all ApprovalStage values", () => {
    const stages = Object.values(ApprovalStage);
    for (const stage of stages) {
      expect(STAGE_LABELS[stage]).toBeDefined();
      expect(STAGE_LABELS[stage].length).toBeGreaterThan(0);
    }
  });

  it("APPROVED label is 'Approved'", () => {
    expect(STAGE_LABELS[ApprovalStage.APPROVED]).toBe("Approved");
  });
});

// ── 4. approvalStageTransitionSchema ─────────────────────────────────────────

describe("approvalStageTransitionSchema", () => {
  it("accepts valid transition payload", () => {
    const result = approvalStageTransitionSchema.safeParse({
      id: "entry-cuid",
      approvalStage: "MANAGER_REVIEW",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional comment", () => {
    const result = approvalStageTransitionSchema.safeParse({
      id: "entry-cuid",
      approvalStage: "REVISION_REQUESTED",
      comment: "Please add source documentation",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.comment).toBe("Please add source documentation");
  });

  it("rejects missing id", () => {
    const result = approvalStageTransitionSchema.safeParse({ approvalStage: "APPROVED" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid approvalStage", () => {
    const result = approvalStageTransitionSchema.safeParse({
      id: "entry-cuid",
      approvalStage: "PENDING",
    });
    expect(result.success).toBe(false);
  });
});

// ── 5. metricEntrySchema — approvalStage field ────────────────────────────────

describe("metricEntrySchema — approvalStage", () => {
  const base = {
    facilityId: "fac-cuid",
    reportingPeriodId: "period-cuid",
    metricDefinitionId: "def-cuid",
    unit: "kWh",
  };

  it("accepts entry with approvalStage", () => {
    const result = metricEntrySchema.safeParse({ ...base, approvalStage: "MANAGER_REVIEW" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.approvalStage).toBe("MANAGER_REVIEW");
  });

  it("accepts entry without approvalStage (optional field)", () => {
    const result = metricEntrySchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects invalid approvalStage", () => {
    const result = metricEntrySchema.safeParse({ ...base, approvalStage: "IN_QUEUE" });
    expect(result.success).toBe(false);
  });
});

// ── 6. questionnaireAnswerSchema — approvalStage field ────────────────────────

describe("questionnaireAnswerSchema — approvalStage", () => {
  const base = {
    questionnaireId: "q-cuid",
    questionnaireQuestionId: "qq-cuid",
    reportingPeriodId: "period-cuid",
  };

  it("accepts answer with approvalStage", () => {
    const result = questionnaireAnswerSchema.safeParse({
      ...base,
      answer_text: "We use 1000 kWh per month.",
      approvalStage: "HORIZON_REVIEW",
    });
    expect(result.success).toBe(true);
  });

  it("accepts answer without approvalStage", () => {
    const result = questionnaireAnswerSchema.safeParse({ ...base, answer_text: "Yes" });
    expect(result.success).toBe(true);
  });
});

// ── 7. bulkRevisionSchema ─────────────────────────────────────────────────────

describe("bulkRevisionSchema", () => {
  const valid = {
    entityType: "METRIC_ENTRY",
    entityIds: ["id1", "id2"],
    comment: "Missing invoice evidence",
  };

  it("accepts valid bulk revision request", () => {
    const result = bulkRevisionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts QUESTIONNAIRE_ANSWER entityType", () => {
    const result = bulkRevisionSchema.safeParse({ ...valid, entityType: "QUESTIONNAIRE_ANSWER" });
    expect(result.success).toBe(true);
  });

  it("accepts optional dueDate", () => {
    const result = bulkRevisionSchema.safeParse({ ...valid, dueDate: "2026-08-01" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBe("2026-08-01");
  });

  it("accepts optional reportingPeriodId", () => {
    const result = bulkRevisionSchema.safeParse({ ...valid, reportingPeriodId: "period-cuid" });
    expect(result.success).toBe(true);
  });

  it("rejects empty entityIds array", () => {
    const result = bulkRevisionSchema.safeParse({ ...valid, entityIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects comment shorter than 2 chars", () => {
    const result = bulkRevisionSchema.safeParse({ ...valid, comment: "X" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid entityType", () => {
    const result = bulkRevisionSchema.safeParse({ ...valid, entityType: "REPORT" });
    expect(result.success).toBe(false);
  });
});

// ── 8. notificationReadSchema ─────────────────────────────────────────────────

describe("notificationReadSchema", () => {
  it("accepts isRead true", () => {
    const result = notificationReadSchema.safeParse({ isRead: true });
    expect(result.success).toBe(true);
  });

  it("accepts isRead false", () => {
    const result = notificationReadSchema.safeParse({ isRead: false });
    expect(result.success).toBe(true);
  });

  it("rejects missing isRead", () => {
    const result = notificationReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean isRead", () => {
    const result = notificationReadSchema.safeParse({ isRead: "yes" });
    expect(result.success).toBe(false);
  });
});

// ── 9. Complete approval flow simulation ─────────────────────────────────────

describe("full approval flow simulation", () => {
  it("DATA_CONTRIBUTOR → MANAGER_REVIEW → HORIZON_REVIEW → APPROVED", () => {
    let stage: ApprovalStage = ApprovalStage.DATA_ENTRY;

    // Step 1: contributor submits
    let err = validateTransition(stage, ApprovalStage.MANAGER_REVIEW, UserRole.DATA_CONTRIBUTOR);
    expect(err).toBeNull();
    stage = ApprovalStage.MANAGER_REVIEW;

    // Step 2: manager escalates
    err = validateTransition(stage, ApprovalStage.HORIZON_REVIEW, UserRole.SUSTAINABILITY_MANAGER);
    expect(err).toBeNull();
    stage = ApprovalStage.HORIZON_REVIEW;

    // Step 3: consultant approves
    err = validateTransition(stage, ApprovalStage.APPROVED, UserRole.HORIZON_CONSULTANT);
    expect(err).toBeNull();
    stage = ApprovalStage.APPROVED;

    expect(stage).toBe(ApprovalStage.APPROVED);
  });

  it("HORIZON_REVIEW → REVISION_REQUESTED → DATA_ENTRY → MANAGER_REVIEW (revision cycle)", () => {
    let stage: ApprovalStage = ApprovalStage.HORIZON_REVIEW;

    // Consultant requests revision
    let err = validateTransition(stage, ApprovalStage.REVISION_REQUESTED, UserRole.HORIZON_CONSULTANT);
    expect(err).toBeNull();
    stage = ApprovalStage.REVISION_REQUESTED;

    // Contributor resets to data entry
    err = validateTransition(stage, ApprovalStage.DATA_ENTRY, UserRole.DATA_CONTRIBUTOR);
    expect(err).toBeNull();
    stage = ApprovalStage.DATA_ENTRY;

    // Contributor resubmits
    err = validateTransition(stage, ApprovalStage.MANAGER_REVIEW, UserRole.DATA_CONTRIBUTOR);
    expect(err).toBeNull();
    stage = ApprovalStage.MANAGER_REVIEW;

    expect(stage).toBe(ApprovalStage.MANAGER_REVIEW);
  });
});
