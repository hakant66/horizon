import fs from "node:fs";
import path from "node:path";
import {
  CertificationStatus,
  ClimateRiskType,
  EmissionScope,
  EvidenceStatus,
  LinkedEntityType,
  MetricEntryStatus,
  PrismaClient,
  QuestionnaireType,
  ReportFramework,
  ReportStatus,
  ReportingPeriodStatus,
  TargetStatus,
  UserRole,
} from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

type QuestionnaireSeedData = Array<{
  nameTr: string;
  nameEn?: string;
  type: "VERBAL" | "NUMERIC";
  sections: Array<{
    name: string;
    subsections: Array<{
      name: string;
      questions: Array<{
        section: string;
        topic?: string;
        code?: string;
        title: string;
        questionText: string;
        unit?: string;
        owner_department?: string;
        helper?: string;
        sourceSheet?: string;
        sourceRowNumber?: number;
      }>;
    }>;
  }>;
}>;

const metricDefinitions = [
  { code: "electricity_consumption", name: "Electricity consumption", category: "Energy", unit: "kWh", isRequired: true },
  { code: "natural_gas_consumption", name: "Natural gas consumption", category: "Energy", unit: "m3", isRequired: true },
  { code: "diesel_consumption", name: "Diesel consumption", category: "Fuel", unit: "L", isRequired: true },
  { code: "petrol_consumption", name: "Petrol consumption", category: "Fuel", unit: "L", isRequired: true },
  { code: "water_consumption", name: "Water consumption", category: "Water", unit: "m3", isRequired: true },
  { code: "waste_generated", name: "Waste generated", category: "Waste", unit: "kg", isRequired: true },
  { code: "waste_recycled", name: "Waste recycled", category: "Waste", unit: "kg", isRequired: true },
  { code: "employee_count", name: "Employee count", category: "Social", unit: "count", isRequired: true },
  { code: "lost_time_injury_count", name: "Lost time injury count", category: "Social", unit: "count", isRequired: true },
];

const materialityTopics = [
  "Climate change",
  "Energy management",
  "Water management",
  "Waste and circular economy",
  "Biodiversity",
  "Occupational health and safety",
  "Labor practices",
  "Human rights",
  "Supply chain responsibility",
  "Business ethics",
  "Data privacy",
  "Community impact",
];

async function seedQuestionnaires(params: {
  organizationId: string;
  reportingPeriodId: string;
  managerId: string;
}) {
  const filePath = path.join(process.cwd(), "prisma", "data", "questionnaires.json");
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as QuestionnaireSeedData;

  for (const template of parsed) {
    const questionnaire = await prisma.questionnaire.create({
      data: {
        organizationId: params.organizationId,
        name_tr: template.nameTr,
        name_en: template.nameEn,
        type: template.type as QuestionnaireType,
        description: template.type === "NUMERIC" ? "Numeric questionnaire template" : "Verbal questionnaire template",
      },
    });

    for (let secIdx = 0; secIdx < template.sections.length; secIdx += 1) {
      const sec = template.sections[secIdx];
      const section = await prisma.questionnaireSection.create({
        data: {
          organizationId: params.organizationId,
          questionnaireId: questionnaire.id,
          name: sec.name,
          orderIndex: secIdx,
        },
      });

      for (let subIdx = 0; subIdx < sec.subsections.length; subIdx += 1) {
        const sub = sec.subsections[subIdx];
        const subsection = await prisma.questionnaireSubsection.create({
          data: {
            organizationId: params.organizationId,
            questionnaireSectionId: section.id,
            name: sub.name,
            orderIndex: subIdx,
          },
        });

        for (const q of sub.questions) {
          const topic = q.topic
            ? await prisma.questionnaireTopic.upsert({
                where: {
                  organizationId_name_tr: {
                    organizationId: params.organizationId,
                    name_tr: q.topic,
                  },
                },
                create: {
                  organizationId: params.organizationId,
                  name_tr: q.topic,
                  name_en: q.topic,
                },
                update: {},
              })
            : null;

          const question = await prisma.questionnaireQuestion.create({
            data: {
              organizationId: params.organizationId,
              questionnaireId: questionnaire.id,
              questionnaireSectionId: section.id,
              questionnaireSubsectionId: subsection.id,
              questionnaireTopicId: topic?.id,
              section: q.section,
              code: q.code || null,
              title: q.title,
              question_text: q.questionText,
              unit: q.unit || null,
              owner_name: null,
              owner_department: q.owner_department || null,
              owner_email: null,
              helper: q.helper || null,
              example: null,
              reminder: null,
              video_link: null,
              sourceSheet: q.sourceSheet || section.name,
              sourceRowNumber: q.sourceRowNumber || null,
            },
          });

          if (Math.random() < 0.12) {
            await prisma.questionnaireAnswer.create({
              data: {
                organizationId: params.organizationId,
                questionnaireId: questionnaire.id,
                questionnaireQuestionId: question.id,
                reportingPeriodId: params.reportingPeriodId,
                answer_text: template.type === "VERBAL" ? "Demo yanıt" : null,
                answer_number: template.type === "NUMERIC" ? 100 : null,
                answering_user_id: params.managerId,
                answering_timestamp: new Date(),
              },
            });
          }
        }
      }
    }
  }
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.certificationComment.deleteMany();
  await prisma.certificationSubmission.deleteMany();
  await prisma.report.deleteMany();
  await prisma.target.deleteMany();
  await prisma.scenarioAnalysis.deleteMany();
  await prisma.climateRisk.deleteMany();
  await prisma.materialityTopic.deleteMany();
  await prisma.emissionCalculation.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.metricEntry.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.questionnaireAnswer.deleteMany();
  await prisma.questionnaireQuestion.deleteMany();
  await prisma.questionnaireSubsection.deleteMany();
  await prisma.questionnaireSection.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.questionnaireTopic.deleteMany();
  await prisma.metricDefinition.deleteMany();
  await prisma.reportingPeriod.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Demo Manufacturing A.Ş.",
      sector: "Manufacturing",
      headquartersCountry: "Turkey",
      reportingCurrency: "TRY",
      taxId: "DEMO-TAX-0001",
    },
  });

  const users = await prisma.user.createManyAndReturn({
    data: [
      { name: "Admin User", email: "admin@demo.com", password: hashSync("Demo1234!", 10), role: UserRole.ADMIN, organizationId: org.id },
      { name: "Sustainability Manager", email: "sustainability@demo.com", password: hashSync("Demo1234!", 10), role: UserRole.SUSTAINABILITY_MANAGER, organizationId: org.id },
      { name: "Data Contributor", email: "contributor@demo.com", password: hashSync("Demo1234!", 10), role: UserRole.DATA_CONTRIBUTOR, organizationId: org.id },
      { name: "CFO Reviewer", email: "cfo@demo.com", password: hashSync("Demo1234!", 10), role: UserRole.FINANCE_REVIEWER, organizationId: org.id },
      { name: "Auditor User", email: "auditor@demo.com", password: hashSync("Demo1234!", 10), role: UserRole.AUDITOR, organizationId: org.id },
    ],
  });

  const admin = users.find((u) => u.role === UserRole.ADMIN)!;
  const manager = users.find((u) => u.role === UserRole.SUSTAINABILITY_MANAGER)!;
  const cfo = users.find((u) => u.role === UserRole.FINANCE_REVIEWER)!;
  const auditor = users.find((u) => u.role === UserRole.AUDITOR)!;

  const facilities = await prisma.facility.createManyAndReturn({
    data: [
      { organizationId: org.id, name: "Istanbul Plant", country: "Turkey", city: "Istanbul", facilityType: "Factory" },
      { organizationId: org.id, name: "Ankara Office", country: "Turkey", city: "Ankara", facilityType: "Office" },
    ],
  });

  const period = await prisma.reportingPeriod.create({
    data: {
      organizationId: org.id,
      name: "2025",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: ReportingPeriodStatus.OPEN,
    },
  });

  const createdDefinitions = await prisma.metricDefinition.createManyAndReturn({
    data: metricDefinitions.map((m) => ({ ...m, description: `${m.name} metric for MVP workflow`, sector: "Manufacturing" })),
  });

  const istanbulPlant = facilities[0];
  await prisma.metricEntry.createMany({
    data: createdDefinitions.map((definition, idx) => ({
      organizationId: org.id,
      facilityId: istanbulPlant.id,
      reportingPeriodId: period.id,
      metricDefinitionId: definition.id,
      value: idx < 5 ? 120 + idx * 20 : null,
      unit: definition.unit,
      status: idx < 4 ? MetricEntryStatus.VALIDATED : MetricEntryStatus.IN_PROGRESS,
      ownerUserId: manager.id,
      notes: "Demo seed value",
    })),
  });

  for (const topic of materialityTopics) {
    const financial = topic === "Climate change" ? 5 : 3;
    const severity = topic === "Water management" ? 4 : 3;
    const stakeholder = topic === "Labor practices" ? 4 : 3;
    await prisma.materialityTopic.create({
      data: {
        organizationId: org.id,
        reportingPeriodId: period.id,
        name: topic,
        category: "ESG",
        financialImpactScore: financial,
        impactSeverityScore: severity,
        likelihoodScore: 3,
        stakeholderConcernScore: stakeholder,
        isMaterial: financial >= 4 || severity >= 4 || stakeholder >= 4,
      },
    });
  }

  const factors = await prisma.emissionFactor.createManyAndReturn({
    data: [
      {
        name: "Turkey electricity placeholder factor",
        country: "Turkey",
        activityUnit: "kWh",
        factorValue: 0.43,
        factorUnit: "kgCO2e/kWh",
        source: "Demo Placeholder - Must be verified for production",
        versionYear: 2025,
        scope: EmissionScope.SCOPE_2,
        category: "Purchased electricity",
      },
      {
        name: "Natural gas placeholder factor",
        country: "Turkey",
        activityUnit: "m3",
        factorValue: 1.9,
        factorUnit: "kgCO2e/m3",
        source: "Demo Placeholder - Must be verified for production",
        versionYear: 2025,
        scope: EmissionScope.SCOPE_1,
        category: "Natural gas",
      },
      {
        name: "Diesel placeholder factor",
        country: "Turkey",
        activityUnit: "L",
        factorValue: 2.68,
        factorUnit: "kgCO2e/L",
        source: "Demo Placeholder - Must be verified for production",
        versionYear: 2025,
        scope: EmissionScope.SCOPE_1,
        category: "Diesel",
      },
      {
        name: "Petrol placeholder factor",
        country: "Turkey",
        activityUnit: "L",
        factorValue: 2.31,
        factorUnit: "kgCO2e/L",
        source: "Demo Placeholder - Must be verified for production",
        versionYear: 2025,
        scope: EmissionScope.SCOPE_1,
        category: "Petrol",
      },
    ],
  });

  const electricityMetric = await prisma.metricEntry.findFirstOrThrow({
    where: { organizationId: org.id, reportingPeriodId: period.id, metricDefinition: { code: "electricity_consumption" } },
    include: { metricDefinition: true },
  });

  const electricityFactor = factors.find((f) => f.category === "Purchased electricity")!;
  const result = (Number(electricityMetric.value ?? 0) * Number(electricityFactor.factorValue)) / 1000;
  const emission = await prisma.emissionCalculation.create({
    data: {
      organizationId: org.id,
      facilityId: electricityMetric.facilityId,
      reportingPeriodId: period.id,
      metricEntryId: electricityMetric.id,
      emissionFactorId: electricityFactor.id,
      scope: EmissionScope.SCOPE_2,
      activityValue: electricityMetric.value ?? 0,
      activityUnit: electricityMetric.unit,
      factorValue: electricityFactor.factorValue,
      resultTCO2e: result,
      calculationFormula: `${electricityMetric.value ?? 0} x ${electricityFactor.factorValue} / 1000`,
    },
  });

  await prisma.evidence.create({
    data: {
      organizationId: org.id,
      linkedEntityType: LinkedEntityType.METRIC_ENTRY,
      linkedEntityId: electricityMetric.id,
      fileName: "invoice_jan.pdf",
      fileUrl: "/uploads/invoice_jan.pdf",
      fileType: "application/pdf",
      fileSize: 123456,
      uploadedById: manager.id,
      status: EvidenceStatus.UPLOADED,
    },
  });

  const risk = await prisma.climateRisk.create({
    data: {
      organizationId: org.id,
      reportingPeriodId: period.id,
      facilityId: istanbulPlant.id,
      name: "Flooding",
      type: ClimateRiskType.PHYSICAL_ACUTE,
      probability: "High",
      impact: "Medium",
      financialImpactEstimate: 150000,
      ownerUserId: cfo.id,
      mitigationPlan: "Install barriers and improve drainage.",
      notes: "High rainfall exposure",
    },
  });

  await prisma.scenarioAnalysis.create({
    data: {
      climateRiskId: risk.id,
      scenarioName: "2C scenario",
      temperaturePathway: "2C",
      qualitativeImpact: "Moderate production interruption risk",
      estimatedRevenueImpactPercent: -5,
      estimatedCostImpact: 35000,
      assumptions: "Current mitigation partially effective",
    },
  });

  await prisma.target.create({
    data: {
      organizationId: org.id,
      reportingPeriodId: period.id,
      name: "Reduce emissions 30% by 2030",
      metricDefinitionId: createdDefinitions.find((m) => m.code === "electricity_consumption")!.id,
      baselineYear: 2023,
      baselineValue: 1500,
      targetYear: 2030,
      targetValue: 1050,
      currentValue: 1200,
      status: TargetStatus.ON_TRACK,
    },
  });

  const report = await prisma.report.create({
    data: {
      organizationId: org.id,
      reportingPeriodId: period.id,
      framework: ReportFramework.IFRS_S2,
      status: ReportStatus.GENERATED,
      governanceText: "Board-level oversight established for climate governance.",
      strategyText: "Transition planning integrated into annual capital allocation.",
      riskManagementText: "Quarterly climate risk reviews are operationalized.",
      metricsTargetsText: "Total emissions decreased by 15% versus prior year.",
      generatedAt: new Date(),
    },
  });

  const cert = await prisma.certificationSubmission.create({
    data: {
      organizationId: org.id,
      reportingPeriodId: period.id,
      reportId: report.id,
      status: CertificationStatus.UNDER_REVIEW,
      submittedById: manager.id,
      reviewedById: auditor.id,
      submittedAt: new Date(),
    },
  });

  await prisma.certificationComment.create({
    data: {
      certificationSubmissionId: cert.id,
      authorUserId: auditor.id,
      comment: "Please clarify Scope 2 calculation assumptions.",
      linkedEntityType: LinkedEntityType.EMISSION_CALCULATION,
      linkedEntityId: emission.id,
    },
  });

  await seedQuestionnaires({
    organizationId: org.id,
    reportingPeriodId: period.id,
    managerId: manager.id,
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: admin.id,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: admin.id,
        afterValueJson: { email: admin.email },
      },
      {
        organizationId: org.id,
        userId: manager.id,
        action: "EMISSION_RECALCULATED",
        entityType: "EmissionCalculation",
        entityId: emission.id,
        afterValueJson: { resultTCO2e: result },
      },
      {
        organizationId: org.id,
        userId: manager.id,
        action: "CERTIFICATION_SUBMITTED",
        entityType: "CertificationSubmission",
        entityId: cert.id,
        afterValueJson: { status: CertificationStatus.UNDER_REVIEW },
      },
      {
        organizationId: org.id,
        userId: manager.id,
        action: "QUESTIONNAIRE_SEED_IMPORTED",
        entityType: "Questionnaire",
        entityId: org.id,
        afterValueJson: { source: "Kimya questionnaires" },
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
