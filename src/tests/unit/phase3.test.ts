import { describe, expect, it } from "vitest";
import { detectAnomaly } from "@/lib/anomaly";
import { transitionRequiresEvidence } from "@/lib/evidence-gate";
import { ApprovalStage } from "@prisma/client";
import { questionnaireQuestionSchema, questionnaireAnswerSchema } from "@/lib/validation";

// ── 1. detectAnomaly ─────────────────────────────────────────────────────────

describe("detectAnomaly", () => {
  it("returns null when change is below 50%", () => {
    expect(detectAnomaly(120, 100)).toBeNull();
  });

  it("returns null when values are equal", () => {
    expect(detectAnomaly(100, 100)).toBeNull();
  });

  it("returns null when previous is zero (avoids div-by-zero)", () => {
    expect(detectAnomaly(100, 0)).toBeNull();
  });

  it("returns warning for exactly 50% increase", () => {
    const result = detectAnomaly(150, 100);
    expect(result).not.toBeNull();
    expect(result?.isWarning).toBe(true);
    expect(result?.isBlock).toBe(false);
    expect(result?.pctChange).toBeCloseTo(50);
  });

  it("returns warning for 50% decrease", () => {
    const result = detectAnomaly(50, 100);
    expect(result).not.toBeNull();
    expect(result?.isWarning).toBe(true);
    expect(result?.pctChange).toBeCloseTo(-50);
  });

  it("returns warning for 200% increase", () => {
    const result = detectAnomaly(300, 100);
    expect(result?.isWarning).toBe(true);
    expect(result?.isBlock).toBe(false);
  });

  it("returns block for exactly 500% increase", () => {
    const result = detectAnomaly(600, 100);
    expect(result?.isBlock).toBe(true);
    expect(result?.isWarning).toBe(false);
  });

  it("returns block for 1000% increase", () => {
    const result = detectAnomaly(1100, 100);
    expect(result?.isBlock).toBe(true);
    expect(result?.pctChange).toBeCloseTo(1000);
  });

  it("handles negative current value triggering block (≥500% swing)", () => {
    // -400 from 100: pctChange = -500% → block
    const result = detectAnomaly(-400, 100);
    expect(result?.isBlock).toBe(true);
  });
});

// ── 2. transitionRequiresEvidence ────────────────────────────────────────────

describe("transitionRequiresEvidence", () => {
  it("DATA_ENTRY → MANAGER_REVIEW requires evidence", () => {
    expect(
      transitionRequiresEvidence(ApprovalStage.DATA_ENTRY, ApprovalStage.MANAGER_REVIEW),
    ).toBe(true);
  });

  it("MANAGER_REVIEW → HORIZON_REVIEW requires evidence", () => {
    expect(
      transitionRequiresEvidence(ApprovalStage.MANAGER_REVIEW, ApprovalStage.HORIZON_REVIEW),
    ).toBe(true);
  });

  it("HORIZON_REVIEW → APPROVED does not require evidence", () => {
    expect(
      transitionRequiresEvidence(ApprovalStage.HORIZON_REVIEW, ApprovalStage.APPROVED),
    ).toBe(false);
  });

  it("MANAGER_REVIEW → REVISION_REQUESTED does not require evidence", () => {
    expect(
      transitionRequiresEvidence(ApprovalStage.MANAGER_REVIEW, ApprovalStage.REVISION_REQUESTED),
    ).toBe(false);
  });

  it("REVISION_REQUESTED → DATA_ENTRY does not require evidence", () => {
    expect(
      transitionRequiresEvidence(ApprovalStage.REVISION_REQUESTED, ApprovalStage.DATA_ENTRY),
    ).toBe(false);
  });
});

// ── 3. questionnaireQuestionSchema — minValue / maxValue ─────────────────────

describe("questionnaireQuestionSchema — numeric bounds", () => {
  const base = {
    questionnaireId: "q-cuid",
    section: "Environmental",
    title: "Energy use",
    question_text: "How much energy did you use?",
  };

  it("accepts minValue and maxValue", () => {
    const result = questionnaireQuestionSchema.safeParse({
      ...base,
      minValue: 0,
      maxValue: 10000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minValue).toBe(0);
      expect(result.data.maxValue).toBe(10000);
    }
  });

  it("accepts question without bounds (optional)", () => {
    const result = questionnaireQuestionSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts null bounds explicitly", () => {
    const result = questionnaireQuestionSchema.safeParse({
      ...base,
      minValue: null,
      maxValue: null,
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers to numeric values", () => {
    const result = questionnaireQuestionSchema.safeParse({
      ...base,
      minValue: "0",
      maxValue: "100",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minValue).toBe(0);
      expect(result.data.maxValue).toBe(100);
    }
  });
});

// ── 4. questionnaireAnswerSchema — answer_number coercion ─────────────────────

describe("questionnaireAnswerSchema — answer_number", () => {
  const base = {
    questionnaireId: "q-cuid",
    questionnaireQuestionId: "qq-cuid",
    reportingPeriodId: "p-cuid",
  };

  it("accepts numeric answer", () => {
    const result = questionnaireAnswerSchema.safeParse({ ...base, answer_number: 42.5 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.answer_number).toBe(42.5);
  });

  it("accepts null answer_number", () => {
    const result = questionnaireAnswerSchema.safeParse({ ...base, answer_number: null });
    expect(result.success).toBe(true);
  });

  it("coerces string to number", () => {
    const result = questionnaireAnswerSchema.safeParse({ ...base, answer_number: "99.9" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.answer_number).toBeCloseTo(99.9);
  });
});

// ── 5. Anomaly boundary edge cases ────────────────────────────────────────────

describe("detectAnomaly — boundary precision", () => {
  it("49.99% change returns null (below threshold)", () => {
    expect(detectAnomaly(149.99, 100)).toBeNull();
  });

  it("499.99% increase returns warning not block", () => {
    const result = detectAnomaly(599.99, 100);
    expect(result?.isWarning).toBe(true);
    expect(result?.isBlock).toBe(false);
  });

  it("pctChange is negative for decrease", () => {
    const result = detectAnomaly(40, 100);
    expect(result?.pctChange).toBeCloseTo(-60);
    expect(result?.isWarning).toBe(true);
  });
});
