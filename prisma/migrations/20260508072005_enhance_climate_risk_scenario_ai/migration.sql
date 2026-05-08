-- AlterTable
ALTER TABLE "ClimateRisk" ADD COLUMN     "aiNarrative" TEXT,
ADD COLUMN     "aiNarrativeAt" TIMESTAMP(3),
ADD COLUMN     "impactScore" INTEGER,
ADD COLUMN     "probabilityScore" INTEGER,
ADD COLUMN     "regulatoryRef" TEXT,
ADD COLUMN     "residualRisk" TEXT,
ADD COLUMN     "riskScore" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Open',
ADD COLUMN     "timeHorizon" TEXT;

-- AlterTable
ALTER TABLE "ScenarioAnalysis" ADD COLUMN     "adaptationMeasure" TEXT,
ADD COLUMN     "aiImpactSummary" TEXT,
ADD COLUMN     "confidenceLevel" TEXT,
ADD COLUMN     "physicalHazard" TEXT,
ADD COLUMN     "scenarioFramework" TEXT;
