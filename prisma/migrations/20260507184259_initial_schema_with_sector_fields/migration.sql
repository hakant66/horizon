-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUSTAINABILITY_MANAGER', 'DATA_CONTRIBUTOR', 'FINANCE_REVIEWER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ReportingPeriodStatus" AS ENUM ('OPEN', 'LOCKED', 'SUBMITTED', 'CERTIFIED');

-- CreateEnum
CREATE TYPE "MetricEntryStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'VALIDATED', 'NEEDS_CORRECTION');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('UPLOADED', 'ACCEPTED', 'REJECTED', 'NEEDS_CLARIFICATION');

-- CreateEnum
CREATE TYPE "EmissionScope" AS ENUM ('SCOPE_1', 'SCOPE_2');

-- CreateEnum
CREATE TYPE "ClimateRiskType" AS ENUM ('PHYSICAL_ACUTE', 'PHYSICAL_CHRONIC', 'TRANSITION_POLICY_LEGAL', 'TRANSITION_MARKET', 'TRANSITION_TECHNOLOGY', 'TRANSITION_REPUTATION');

-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'OFF_TRACK');

-- CreateEnum
CREATE TYPE "ReportFramework" AS ENUM ('IFRS_S1', 'IFRS_S2', 'TSRS_1', 'TSRS_2');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'UNDER_REVIEW', 'APPROVED', 'SUBMITTED_FOR_CERTIFICATION');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LinkedEntityType" AS ENUM ('METRIC_ENTRY', 'EMISSION_CALCULATION', 'CLIMATE_RISK', 'REPORT', 'CERTIFICATION_SUBMISSION');

-- CreateEnum
CREATE TYPE "QuestionnaireType" AS ENUM ('VERBAL', 'NUMERIC');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "sector" TEXT NOT NULL,
    "naceCode" TEXT,
    "naceDescription" TEXT,
    "sasbSector" TEXT,
    "csrdSector" TEXT,
    "reportingFrameworks" TEXT[],
    "employeeCount" INTEGER,
    "annualTurnoverEurM" DECIMAL(12,2),
    "totalAssetsEurM" DECIMAL(12,2),
    "isPublicInterestEntity" BOOLEAN,
    "headquartersCountry" TEXT NOT NULL,
    "reportingCurrency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "facilityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ReportingPeriodStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sector" TEXT,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "value" DECIMAL(14,4),
    "unit" TEXT NOT NULL,
    "status" "MetricEntryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "ownerUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "linkedEntityType" "LinkedEntityType" NOT NULL,
    "linkedEntityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'UPLOADED',
    "reviewerComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "activityUnit" TEXT NOT NULL,
    "factorValue" DECIMAL(12,6) NOT NULL,
    "factorUnit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "versionYear" INTEGER NOT NULL,
    "scope" "EmissionScope" NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionCalculation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "metricEntryId" TEXT NOT NULL,
    "emissionFactorId" TEXT NOT NULL,
    "scope" "EmissionScope" NOT NULL,
    "activityValue" DECIMAL(14,4) NOT NULL,
    "activityUnit" TEXT NOT NULL,
    "factorValue" DECIMAL(12,6) NOT NULL,
    "resultTCO2e" DECIMAL(14,6) NOT NULL,
    "calculationFormula" TEXT NOT NULL,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialityTopic" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "financialImpactScore" INTEGER NOT NULL,
    "impactSeverityScore" INTEGER NOT NULL,
    "likelihoodScore" INTEGER NOT NULL,
    "stakeholderConcernScore" INTEGER NOT NULL,
    "isMaterial" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialityTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClimateRisk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "facilityId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ClimateRiskType" NOT NULL,
    "probability" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "financialImpactEstimate" DECIMAL(14,2),
    "ownerUserId" TEXT,
    "mitigationPlan" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClimateRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioAnalysis" (
    "id" TEXT NOT NULL,
    "climateRiskId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "temperaturePathway" TEXT NOT NULL,
    "qualitativeImpact" TEXT,
    "estimatedRevenueImpactPercent" DECIMAL(8,2),
    "estimatedCostImpact" DECIMAL(14,2),
    "assumptions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "baselineYear" INTEGER NOT NULL,
    "baselineValue" DECIMAL(14,4) NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "targetValue" DECIMAL(14,4) NOT NULL,
    "currentValue" DECIMAL(14,4) NOT NULL,
    "status" "TargetStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "framework" "ReportFramework" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "governanceText" TEXT,
    "strategyText" TEXT,
    "riskManagementText" TEXT,
    "metricsTargetsText" TEXT,
    "generatedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "CertificationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationComment" (
    "id" TEXT NOT NULL,
    "certificationSubmissionId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "linkedEntityType" "LinkedEntityType",
    "linkedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificationComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireTopic" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name_tr" TEXT NOT NULL,
    "name_en" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name_tr" TEXT NOT NULL,
    "name_en" TEXT,
    "type" "QuestionnaireType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireSection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireSubsection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "questionnaireSectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireSubsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireQuestion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "questionnaireSectionId" TEXT,
    "questionnaireSubsectionId" TEXT,
    "questionnaireTopicId" TEXT,
    "section" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "unit" TEXT,
    "owner_name" TEXT,
    "owner_department" TEXT,
    "owner_email" TEXT,
    "helper" TEXT,
    "example" TEXT,
    "reminder" TEXT,
    "video_link" TEXT,
    "sourceSheet" TEXT,
    "sourceRowNumber" INTEGER,
    "created_datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_datetime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireAnswer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "questionnaireQuestionId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "answer_text" TEXT,
    "answer_number" DECIMAL(18,4),
    "answering_user_id" TEXT NOT NULL,
    "answering_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" TEXT,
    "updated_timestamp" TIMESTAMP(3),
    "deleted_by_id" TEXT,
    "deleted_timestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsgSummary" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "legalName" TEXT,
    "brandPortfolio" TEXT,
    "naceCode" TEXT,
    "sectorDescription" TEXT,
    "operatingCountries" TEXT,
    "totalEmployees" INTEGER,
    "employeeBlueCollar" INTEGER,
    "employeeWhiteCollar" INTEGER,
    "employeeMale" INTEGER,
    "employeeFemale" INTEGER,
    "employeePermanent" INTEGER,
    "employeeTemporary" INTEGER,
    "fiscalYearStart" TIMESTAMP(3),
    "fiscalYearEnd" TIMESTAMP(3),
    "annualRevenue" DECIMAL(20,2),
    "ebitda" DECIMAL(20,2),
    "netProfit" DECIMAL(20,2),
    "totalAssets" DECIMAL(20,2),
    "totalEquity" DECIMAL(20,2),
    "sustainabilityCapexForecast" DECIMAL(20,2),
    "sustainabilityGovernanceBody" TEXT,
    "businessResilienceAssessment" TEXT,
    "antiBriberyPolicyUpdated" BOOLEAN,
    "gdprKvkkPolicyUpdated" BOOLEAN,
    "annualElectricityConsumption" DECIMAL(14,4),
    "annualNaturalGasConsumption" DECIMAL(14,4),
    "annualFuelConsumption" DECIMAL(14,4),
    "renewableEnergyPercent" DECIMAL(5,2),
    "scope1Emissions" DECIMAL(14,4),
    "scope2Emissions" DECIMAL(14,4),
    "scope3Emissions" DECIMAL(14,4),
    "annualWaterWithdrawal" DECIMAL(14,4),
    "wasteRecyclingRate" DECIMAL(5,2),
    "lostTimeInjuryRate" DECIMAL(8,4),
    "avgTrainingHoursPerEmployee" DECIMAL(8,2),
    "femaleManagerPercent" DECIMAL(5,2),
    "supplierSocialAuditConducted" BOOLEAN,
    "employeeTurnoverRate" DECIMAL(5,2),
    "climateRiskInRiskRegister" BOOLEAN,
    "rdExpenditure" DECIMAL(20,2),
    "reportBoundaryNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsgSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeValueJson" JSONB,
    "afterValueJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_organizationId_name_key" ON "ReportingPeriod"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_code_key" ON "MetricDefinition"("code");

-- CreateIndex
CREATE INDEX "MetricEntry_organizationId_reportingPeriodId_idx" ON "MetricEntry"("organizationId", "reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricEntry_facilityId_reportingPeriodId_metricDefinitionId_key" ON "MetricEntry"("facilityId", "reportingPeriodId", "metricDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialityTopic_organizationId_reportingPeriodId_name_key" ON "MaterialityTopic"("organizationId", "reportingPeriodId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireTopic_organizationId_name_tr_key" ON "QuestionnaireTopic"("organizationId", "name_tr");

-- CreateIndex
CREATE UNIQUE INDEX "Questionnaire_organizationId_name_tr_key" ON "Questionnaire"("organizationId", "name_tr");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireSection_questionnaireId_name_key" ON "QuestionnaireSection"("questionnaireId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireSubsection_questionnaireSectionId_name_key" ON "QuestionnaireSubsection"("questionnaireSectionId", "name");

-- CreateIndex
CREATE INDEX "QuestionnaireAnswer_organizationId_questionnaireId_idx" ON "QuestionnaireAnswer"("organizationId", "questionnaireId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireAnswer_questionnaireQuestionId_reportingPeriod_key" ON "QuestionnaireAnswer"("questionnaireQuestionId", "reportingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "EsgSummary_organizationId_key" ON "EsgSummary"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEntry" ADD CONSTRAINT "MetricEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEntry" ADD CONSTRAINT "MetricEntry_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEntry" ADD CONSTRAINT "MetricEntry_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEntry" ADD CONSTRAINT "MetricEntry_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEntry" ADD CONSTRAINT "MetricEntry_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionCalculation" ADD CONSTRAINT "EmissionCalculation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionCalculation" ADD CONSTRAINT "EmissionCalculation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionCalculation" ADD CONSTRAINT "EmissionCalculation_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionCalculation" ADD CONSTRAINT "EmissionCalculation_metricEntryId_fkey" FOREIGN KEY ("metricEntryId") REFERENCES "MetricEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionCalculation" ADD CONSTRAINT "EmissionCalculation_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "EmissionFactor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialityTopic" ADD CONSTRAINT "MaterialityTopic_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialityTopic" ADD CONSTRAINT "MaterialityTopic_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimateRisk" ADD CONSTRAINT "ClimateRisk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimateRisk" ADD CONSTRAINT "ClimateRisk_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimateRisk" ADD CONSTRAINT "ClimateRisk_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClimateRisk" ADD CONSTRAINT "ClimateRisk_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioAnalysis" ADD CONSTRAINT "ScenarioAnalysis_climateRiskId_fkey" FOREIGN KEY ("climateRiskId") REFERENCES "ClimateRisk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationSubmission" ADD CONSTRAINT "CertificationSubmission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationSubmission" ADD CONSTRAINT "CertificationSubmission_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationSubmission" ADD CONSTRAINT "CertificationSubmission_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationSubmission" ADD CONSTRAINT "CertificationSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationSubmission" ADD CONSTRAINT "CertificationSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationComment" ADD CONSTRAINT "CertificationComment_certificationSubmissionId_fkey" FOREIGN KEY ("certificationSubmissionId") REFERENCES "CertificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationComment" ADD CONSTRAINT "CertificationComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireTopic" ADD CONSTRAINT "QuestionnaireTopic_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSection" ADD CONSTRAINT "QuestionnaireSection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSection" ADD CONSTRAINT "QuestionnaireSection_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSubsection" ADD CONSTRAINT "QuestionnaireSubsection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSubsection" ADD CONSTRAINT "QuestionnaireSubsection_questionnaireSectionId_fkey" FOREIGN KEY ("questionnaireSectionId") REFERENCES "QuestionnaireSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionnaireSectionId_fkey" FOREIGN KEY ("questionnaireSectionId") REFERENCES "QuestionnaireSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionnaireSubsectionId_fkey" FOREIGN KEY ("questionnaireSubsectionId") REFERENCES "QuestionnaireSubsection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionnaireTopicId_fkey" FOREIGN KEY ("questionnaireTopicId") REFERENCES "QuestionnaireTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_questionnaireQuestionId_fkey" FOREIGN KEY ("questionnaireQuestionId") REFERENCES "QuestionnaireQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_answering_user_id_fkey" FOREIGN KEY ("answering_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsgSummary" ADD CONSTRAINT "EsgSummary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
