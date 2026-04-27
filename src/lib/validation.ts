import { z } from "zod";
import {
  ClimateRiskType,
  MetricEntryStatus,
  ReportFramework,
  CertificationStatus,
  EvidenceStatus,
  QuestionnaireType,
  UserRole,
} from "@prisma/client";

export const orgSchema = z.object({
  name: z.string().min(2),
  taxId: z.string().optional().nullable(),
  sector: z.string().min(2),
  headquartersCountry: z.string().min(2),
  reportingCurrency: z.string().length(3),
});

export const facilitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional().nullable(),
  facilityType: z.string().min(2),
});

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  password: z.string().min(8).optional(),
});

export const periodSchema = z.object({
  name: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["OPEN", "LOCKED", "SUBMITTED", "CERTIFIED"]).default("OPEN"),
});

export const metricEntrySchema = z.object({
  id: z.string().optional(),
  facilityId: z.string(),
  reportingPeriodId: z.string(),
  metricDefinitionId: z.string(),
  value: z.coerce.number().nullable().optional(),
  unit: z.string().min(1),
  status: z.nativeEnum(MetricEntryStatus).optional(),
  ownerUserId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const materialitySchema = z.object({
  id: z.string().optional(),
  reportingPeriodId: z.string(),
  name: z.string(),
  category: z.string().default("ESG"),
  financialImpactScore: z.number().min(1).max(5),
  impactSeverityScore: z.number().min(1).max(5),
  likelihoodScore: z.number().min(1).max(5),
  stakeholderConcernScore: z.number().min(1).max(5),
  notes: z.string().optional().nullable(),
});

export const evidenceSchema = z.object({
  linkedEntityType: z.enum([
    "METRIC_ENTRY",
    "EMISSION_CALCULATION",
    "CLIMATE_RISK",
    "REPORT",
    "CERTIFICATION_SUBMISSION",
  ]),
  linkedEntityId: z.string(),
  status: z.nativeEnum(EvidenceStatus).optional(),
  reviewerComment: z.string().optional().nullable(),
});

export const emissionRecalcSchema = z.object({
  metricEntryId: z.string(),
  emissionFactorId: z.string().optional(),
  overrideFactorValue: z.coerce.number().optional(),
  overrideReason: z.string().optional(),
});

export const climateRiskSchema = z.object({
  id: z.string().optional(),
  reportingPeriodId: z.string(),
  facilityId: z.string().nullable().optional(),
  name: z.string().min(2),
  type: z.nativeEnum(ClimateRiskType),
  probability: z.string().min(2),
  impact: z.string().min(2),
  financialImpactEstimate: z.coerce.number().nullable().optional(),
  ownerUserId: z.string().nullable().optional(),
  mitigationPlan: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const scenarioSchema = z.object({
  id: z.string().optional(),
  climateRiskId: z.string(),
  scenarioName: z.string(),
  temperaturePathway: z.enum(["1.5C", "2C", "4C"]),
  qualitativeImpact: z.string().nullable().optional(),
  estimatedRevenueImpactPercent: z.coerce.number().nullable().optional(),
  estimatedCostImpact: z.coerce.number().nullable().optional(),
  assumptions: z.string().nullable().optional(),
});

export const targetSchema = z.object({
  id: z.string().optional(),
  reportingPeriodId: z.string(),
  name: z.string().min(2),
  metricDefinitionId: z.string(),
  baselineYear: z.coerce.number().int(),
  baselineValue: z.coerce.number(),
  targetYear: z.coerce.number().int(),
  targetValue: z.coerce.number(),
  currentValue: z.coerce.number(),
  status: z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK"]).optional(),
});

export const reportSchema = z.object({
  id: z.string().optional(),
  reportingPeriodId: z.string(),
  framework: z.nativeEnum(ReportFramework),
  governanceText: z.string().optional().nullable(),
  strategyText: z.string().optional().nullable(),
  riskManagementText: z.string().optional().nullable(),
  metricsTargetsText: z.string().optional().nullable(),
});

export const certificationSchema = z.object({
  id: z.string().optional(),
  reportId: z.string(),
  reportingPeriodId: z.string(),
  status: z.nativeEnum(CertificationStatus).optional(),
  decisionNotes: z.string().optional().nullable(),
});

export const commentSchema = z.object({
  certificationSubmissionId: z.string(),
  comment: z.string().min(2),
  linkedEntityType: z
    .enum(["METRIC_ENTRY", "EMISSION_CALCULATION", "CLIMATE_RISK", "REPORT", "CERTIFICATION_SUBMISSION"])
    .optional(),
  linkedEntityId: z.string().optional(),
});

export const questionnaireTopicSchema = z.object({
  id: z.string().optional(),
  name_tr: z.string().min(2),
  name_en: z.string().optional().nullable(),
});

export const questionnaireSchema = z.object({
  id: z.string().optional(),
  name_tr: z.string().min(2),
  name_en: z.string().optional().nullable(),
  type: z.nativeEnum(QuestionnaireType),
  description: z.string().optional().nullable(),
});

export const questionnaireSectionSchema = z.object({
  id: z.string().optional(),
  questionnaireId: z.string(),
  name: z.string().min(2),
  orderIndex: z.coerce.number().int().optional(),
});

export const questionnaireSubsectionSchema = z.object({
  id: z.string().optional(),
  questionnaireSectionId: z.string(),
  name: z.string().min(2),
  orderIndex: z.coerce.number().int().optional(),
});

export const questionnaireQuestionSchema = z.object({
  id: z.string().optional(),
  questionnaireId: z.string(),
  questionnaireSectionId: z.string().optional().nullable(),
  questionnaireSubsectionId: z.string().optional().nullable(),
  questionnaireTopicId: z.string().optional().nullable(),
  section: z.string().min(1),
  code: z.string().optional().nullable(),
  title: z.string().min(1),
  question_text: z.string().min(1),
  unit: z.string().optional().nullable(),
  owner_name: z.string().optional().nullable(),
  owner_department: z.string().optional().nullable(),
  owner_email: z.string().email().optional().nullable(),
  helper: z.string().optional().nullable(),
  example: z.string().optional().nullable(),
  reminder: z.string().optional().nullable(),
  video_link: z.string().url().optional().nullable(),
});

export const questionnaireAnswerSchema = z.object({
  id: z.string().optional(),
  questionnaireId: z.string(),
  questionnaireQuestionId: z.string(),
  reportingPeriodId: z.string(),
  answer_text: z.string().optional().nullable(),
  answer_number: z.coerce.number().optional().nullable(),
});
