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
  naceCode: z.string().optional().nullable(),
  naceDescription: z.string().optional().nullable(),
  sasbSector: z.string().optional().nullable(),
  csrdSector: z.string().optional().nullable(),
  reportingFrameworks: z.array(z.string()).optional().default([]),
  employeeCount: z.coerce.number().int().optional().nullable(),
  annualTurnoverEurM: z.coerce.number().optional().nullable(),
  totalAssetsEurM: z.coerce.number().optional().nullable(),
  isPublicInterestEntity: z.boolean().optional().nullable(),
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
  probability: z.enum(["High", "Medium", "Low"]),
  impact: z.enum(["High", "Medium", "Low"]),
  probabilityScore: z.coerce.number().int().min(1).max(5).nullable().optional(),
  impactScore: z.coerce.number().int().min(1).max(5).nullable().optional(),
  timeHorizon: z.enum(["Short-term", "Medium-term", "Long-term"]).nullable().optional(),
  status: z.enum(["Open", "Mitigated", "Accepted", "Transferred"]).optional().default("Open"),
  residualRisk: z.string().nullable().optional(),
  regulatoryRef: z.string().nullable().optional(),
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
  scenarioFramework: z.enum(["NGFS", "IEA NZE", "IPCC SSP", "Custom"]).nullable().optional(),
  physicalHazard: z.string().nullable().optional(),
  qualitativeImpact: z.string().nullable().optional(),
  estimatedRevenueImpactPercent: z.coerce.number().nullable().optional(),
  estimatedCostImpact: z.coerce.number().nullable().optional(),
  assumptions: z.string().nullable().optional(),
  adaptationMeasure: z.string().nullable().optional(),
  confidenceLevel: z.enum(["Low", "Medium", "High"]).nullable().optional(),
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

export const esgSummarySchema = z.object({
  legalName: z.string().optional().nullable(),
  brandPortfolio: z.string().optional().nullable(),
  naceCode: z.string().optional().nullable(),
  sectorDescription: z.string().optional().nullable(),
  operatingCountries: z.string().optional().nullable(),
  totalEmployees: z.coerce.number().int().optional().nullable(),
  employeeBlueCollar: z.coerce.number().int().optional().nullable(),
  employeeWhiteCollar: z.coerce.number().int().optional().nullable(),
  employeeMale: z.coerce.number().int().optional().nullable(),
  employeeFemale: z.coerce.number().int().optional().nullable(),
  employeePermanent: z.coerce.number().int().optional().nullable(),
  employeeTemporary: z.coerce.number().int().optional().nullable(),
  fiscalYearStart: z.string().optional().nullable(),
  fiscalYearEnd: z.string().optional().nullable(),
  annualRevenue: z.coerce.number().optional().nullable(),
  ebitda: z.coerce.number().optional().nullable(),
  netProfit: z.coerce.number().optional().nullable(),
  totalAssets: z.coerce.number().optional().nullable(),
  totalEquity: z.coerce.number().optional().nullable(),
  sustainabilityCapexForecast: z.coerce.number().optional().nullable(),
  sustainabilityGovernanceBody: z.string().optional().nullable(),
  businessResilienceAssessment: z.string().optional().nullable(),
  antiBriberyPolicyUpdated: z.boolean().optional().nullable(),
  gdprKvkkPolicyUpdated: z.boolean().optional().nullable(),
  annualElectricityConsumption: z.coerce.number().optional().nullable(),
  annualNaturalGasConsumption: z.coerce.number().optional().nullable(),
  annualFuelConsumption: z.coerce.number().optional().nullable(),
  renewableEnergyPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  scope1Emissions: z.coerce.number().optional().nullable(),
  scope2Emissions: z.coerce.number().optional().nullable(),
  scope3Emissions: z.coerce.number().optional().nullable(),
  annualWaterWithdrawal: z.coerce.number().optional().nullable(),
  wasteRecyclingRate: z.coerce.number().min(0).max(100).optional().nullable(),
  lostTimeInjuryRate: z.coerce.number().optional().nullable(),
  avgTrainingHoursPerEmployee: z.coerce.number().optional().nullable(),
  femaleManagerPercent: z.coerce.number().min(0).max(100).optional().nullable(),
  supplierSocialAuditConducted: z.boolean().optional().nullable(),
  employeeTurnoverRate: z.coerce.number().min(0).max(100).optional().nullable(),
  climateRiskInRiskRegister: z.boolean().optional().nullable(),
  rdExpenditure: z.coerce.number().optional().nullable(),
  reportBoundaryNote: z.string().optional().nullable(),
});
