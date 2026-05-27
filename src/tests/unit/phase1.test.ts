import { describe, expect, it } from "vitest";
import {
  orgSchema,
  subsidiarySchema,
  businessUnitSchema,
  sectorDefinitionSchema,
  taskSchema,
  climateRiskSchema,
  questionnaireQuestionSchema,
  emissionRecalcSchema,
} from "@/lib/validation";
import { roleCapabilities } from "@/lib/rbac";
import { convert, getConversionFactor, getConversionsFrom } from "@/lib/unit-conversions";

// ── 1. RBAC: HORIZON_CONSULTANT role ─────────────────────────────────────────

describe("RBAC — HORIZON_CONSULTANT", () => {
  it("HORIZON_CONSULTANT is present in roleCapabilities", () => {
    expect(roleCapabilities).toHaveProperty("HORIZON_CONSULTANT");
  });

  it("HORIZON_CONSULTANT has report:review capability", () => {
    expect(roleCapabilities.HORIZON_CONSULTANT).toContain("report:review");
  });

  it("HORIZON_CONSULTANT has report:approve capability", () => {
    expect(roleCapabilities.HORIZON_CONSULTANT).toContain("report:approve");
  });

  it("HORIZON_CONSULTANT has task:assign capability", () => {
    expect(roleCapabilities.HORIZON_CONSULTANT).toContain("task:assign");
  });

  it("HORIZON_CONSULTANT has bulk:revision capability", () => {
    expect(roleCapabilities.HORIZON_CONSULTANT).toContain("bulk:revision");
  });

  it("HORIZON_CONSULTANT has sector:admin capability", () => {
    expect(roleCapabilities.HORIZON_CONSULTANT).toContain("sector:admin");
  });

  it("all 6 original roles are still present", () => {
    const roles = Object.keys(roleCapabilities);
    expect(roles).toContain("ADMIN");
    expect(roles).toContain("SUSTAINABILITY_MANAGER");
    expect(roles).toContain("DATA_CONTRIBUTOR");
    expect(roles).toContain("FINANCE_REVIEWER");
    expect(roles).toContain("AUDITOR");
    expect(roles).toContain("HORIZON_CONSULTANT");
  });
});

// ── 2. orgSchema — consolidationMethod ───────────────────────────────────────

describe("orgSchema — consolidationMethod", () => {
  const base = {
    name: "Test Org",
    sector: "Manufacturing",
    headquartersCountry: "TR",
    reportingCurrency: "TRY",
  };

  it("accepts OPERATIONAL_CONTROL", () => {
    const result = orgSchema.safeParse({ ...base, consolidationMethod: "OPERATIONAL_CONTROL" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.consolidationMethod).toBe("OPERATIONAL_CONTROL");
  });

  it("accepts FINANCIAL_CONTROL", () => {
    const result = orgSchema.safeParse({ ...base, consolidationMethod: "FINANCIAL_CONTROL" });
    expect(result.success).toBe(true);
  });

  it("accepts EQUITY_SHARE", () => {
    const result = orgSchema.safeParse({ ...base, consolidationMethod: "EQUITY_SHARE" });
    expect(result.success).toBe(true);
  });

  it("accepts null consolidationMethod (field is optional)", () => {
    const result = orgSchema.safeParse({ ...base, consolidationMethod: null });
    expect(result.success).toBe(true);
  });

  it("accepts missing consolidationMethod", () => {
    const result = orgSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects invalid consolidationMethod", () => {
    const result = orgSchema.safeParse({ ...base, consolidationMethod: "INVALID_METHOD" });
    expect(result.success).toBe(false);
  });
});

// ── 3. subsidiarySchema ───────────────────────────────────────────────────────

describe("subsidiarySchema", () => {
  const valid = { name: "Sub-Corp A.Ş.", country: "TR", ownershipPercent: 75.5 };

  it("accepts valid subsidiary", () => {
    const result = subsidiarySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("defaults isInScope to true", () => {
    const result = subsidiarySchema.safeParse(valid);
    if (result.success) expect(result.data.isInScope).toBe(true);
  });

  it("accepts isInScope false", () => {
    const result = subsidiarySchema.safeParse({ ...valid, isInScope: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isInScope).toBe(false);
  });

  it("rejects ownershipPercent > 100", () => {
    const result = subsidiarySchema.safeParse({ ...valid, ownershipPercent: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects ownershipPercent < 0", () => {
    const result = subsidiarySchema.safeParse({ ...valid, ownershipPercent: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects missing country", () => {
    const result = subsidiarySchema.safeParse({ name: "Sub", ownershipPercent: 50 });
    expect(result.success).toBe(false);
  });

  it("accepts optional consolidationNote", () => {
    const result = subsidiarySchema.safeParse({ ...valid, consolidationNote: "Equity method" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.consolidationNote).toBe("Equity method");
  });
});

// ── 4. businessUnitSchema ─────────────────────────────────────────────────────

describe("businessUnitSchema", () => {
  it("accepts valid business unit", () => {
    const result = businessUnitSchema.safeParse({ name: "Istanbul Plant" });
    expect(result.success).toBe(true);
  });

  it("accepts unit with parentId", () => {
    const result = businessUnitSchema.safeParse({ name: "Line A", parentId: "cuid123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBe("cuid123");
  });

  it("accepts null parentId (top-level unit)", () => {
    const result = businessUnitSchema.safeParse({ name: "HQ", parentId: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });

  it("rejects name shorter than 2 chars", () => {
    const result = businessUnitSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });
});

// ── 5. sectorDefinitionSchema ─────────────────────────────────────────────────

describe("sectorDefinitionSchema", () => {
  const valid = { code: "RT-CH", name_tr: "Kimyasallar", name_en: "Chemicals" };

  it("accepts valid sector", () => {
    const result = sectorDefinitionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("defaults isActive to true", () => {
    const result = sectorDefinitionSchema.safeParse(valid);
    if (result.success) expect(result.data.isActive).toBe(true);
  });

  it("defaults metricCodes to empty array", () => {
    const result = sectorDefinitionSchema.safeParse(valid);
    if (result.success) expect(result.data.metricCodes).toEqual([]);
  });

  it("accepts metricCodes array", () => {
    const result = sectorDefinitionSchema.safeParse({
      ...valid,
      metricCodes: ["electricity_consumption", "natural_gas_consumption"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.metricCodes).toHaveLength(2);
  });

  it("rejects code longer than 20 chars", () => {
    const result = sectorDefinitionSchema.safeParse({ ...valid, code: "A".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects missing name_en", () => {
    const result = sectorDefinitionSchema.safeParse({ code: "RT-CH", name_tr: "Kimyasallar" });
    expect(result.success).toBe(false);
  });
});

// ── 6. taskSchema ─────────────────────────────────────────────────────────────

describe("taskSchema", () => {
  const valid = { assignedToId: "user-cuid", title: "Enter Q3 energy data" };

  it("accepts minimal valid task", () => {
    const result = taskSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("defaults priority to MEDIUM", () => {
    const result = taskSchema.safeParse(valid);
    if (result.success) expect(result.data.priority).toBe("MEDIUM");
  });

  it("accepts CRITICAL priority", () => {
    const result = taskSchema.safeParse({ ...valid, priority: "CRITICAL" });
    expect(result.success).toBe(true);
  });

  it("accepts optional dueDate string", () => {
    const result = taskSchema.safeParse({ ...valid, dueDate: "2026-06-30" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBe("2026-06-30");
  });

  it("rejects title shorter than 2 chars", () => {
    const result = taskSchema.safeParse({ ...valid, title: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = taskSchema.safeParse({ ...valid, priority: "VERY_URGENT" });
    expect(result.success).toBe(false);
  });

  it("accepts entityType and entityId for linking", () => {
    const result = taskSchema.safeParse({
      ...valid,
      entityType: "METRIC_ENTRY",
      entityId: "entry-cuid-123",
    });
    expect(result.success).toBe(true);
  });
});

// ── 7. climateRiskSchema — entryType ─────────────────────────────────────────

describe("climateRiskSchema — entryType (RiskOrOpportunity)", () => {
  const base = {
    reportingPeriodId: "period-cuid",
    name: "Flood risk at Istanbul plant",
    type: "PHYSICAL_ACUTE",
    probability: "High",
    impact: "High",
  };

  it("defaults entryType to RISK", () => {
    const result = climateRiskSchema.safeParse(base);
    if (result.success) expect(result.data.entryType).toBe("RISK");
  });

  it("accepts OPPORTUNITY", () => {
    const result = climateRiskSchema.safeParse({ ...base, entryType: "OPPORTUNITY" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.entryType).toBe("OPPORTUNITY");
  });

  it("accepts RISK explicitly", () => {
    const result = climateRiskSchema.safeParse({ ...base, entryType: "RISK" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid entryType", () => {
    const result = climateRiskSchema.safeParse({ ...base, entryType: "NEUTRAL" });
    expect(result.success).toBe(false);
  });
});

// ── 8. questionnaireQuestionSchema — versioning fields ────────────────────────

describe("questionnaireQuestionSchema — versioning fields", () => {
  const base = {
    questionnaireId: "q-cuid",
    section: "Environmental",
    title: "Energy consumption",
    question_text: "What was your total electricity consumption?",
  };

  it("accepts standardCode", () => {
    const result = questionnaireQuestionSchema.safeParse({ ...base, standardCode: "IFRS-S2-40a" });
    expect(result.success).toBe(true);
  });

  it("accepts evidenceType", () => {
    const result = questionnaireQuestionSchema.safeParse({ ...base, evidenceType: "invoice" });
    expect(result.success).toBe(true);
  });

  it("defaults isMandatory to false", () => {
    const result = questionnaireQuestionSchema.safeParse(base);
    if (result.success) expect(result.data.isMandatory).toBe(false);
  });

  it("accepts isMandatory true", () => {
    const result = questionnaireQuestionSchema.safeParse({ ...base, isMandatory: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isMandatory).toBe(true);
  });

  it("accepts acceptanceCriteria", () => {
    const result = questionnaireQuestionSchema.safeParse({
      ...base,
      acceptanceCriteria: "Value must be supported by a meter reading or invoice",
    });
    expect(result.success).toBe(true);
  });

  it("accepts errorWarning", () => {
    const result = questionnaireQuestionSchema.safeParse({
      ...base,
      errorWarning: "Ensure the value is in kWh, not MWh",
    });
    expect(result.success).toBe(true);
  });
});

// ── 9. emissionRecalcSchema — scope2Method ────────────────────────────────────

describe("emissionRecalcSchema — scope2Method", () => {
  const base = { metricEntryId: "entry-cuid" };

  it("accepts LOCATION_BASED", () => {
    const result = emissionRecalcSchema.safeParse({ ...base, scope2Method: "LOCATION_BASED" });
    expect(result.success).toBe(true);
  });

  it("accepts MARKET_BASED", () => {
    const result = emissionRecalcSchema.safeParse({ ...base, scope2Method: "MARKET_BASED" });
    expect(result.success).toBe(true);
  });

  it("accepts missing scope2Method (Scope 1 calculations)", () => {
    const result = emissionRecalcSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects invalid scope2Method value", () => {
    const result = emissionRecalcSchema.safeParse({ ...base, scope2Method: "HYBRID" });
    expect(result.success).toBe(false);
  });
});

// ── 10. Unit Conversion helpers ───────────────────────────────────────────────

describe("unit-conversions", () => {
  it("converts kWh to GJ correctly", () => {
    expect(convert(1000, "kWh_to_GJ")).toBeCloseTo(3.6, 4);
  });

  it("converts GJ to kWh correctly", () => {
    expect(convert(3.6, "GJ_to_kWh")).toBeCloseTo(1000, 1);
  });

  it("kWh→GJ and GJ→kWh are inverses", () => {
    const original = 5000;
    const roundTrip = convert(convert(original, "kWh_to_GJ"), "GJ_to_kWh");
    expect(roundTrip).toBeCloseTo(original, 2);
  });

  it("converts m3 natural gas to kWh using Turkey LHV (10.55)", () => {
    expect(convert(1000, "m3_gas_to_kWh")).toBeCloseTo(10550, 0);
  });

  it("converts diesel L to kg (0.835 density)", () => {
    expect(convert(100, "L_diesel_to_kg")).toBeCloseTo(83.5, 2);
  });

  it("converts LPG kg to L (0.51 density)", () => {
    expect(convert(51, "kg_lpg_to_L")).toBeCloseTo(100, 1);
  });

  it("getConversionFactor returns correct factor for kWh_to_GJ", () => {
    expect(getConversionFactor("kWh_to_GJ")).toBe(0.0036);
  });

  it("getConversionsFrom returns valid keys for kWh", () => {
    const keys = getConversionsFrom("kWh");
    expect(keys).toContain("kWh_to_GJ");
  });

  it("getConversionsFrom returns empty array for unknown unit", () => {
    expect(getConversionsFrom("unknown_unit")).toEqual([]);
  });
});
