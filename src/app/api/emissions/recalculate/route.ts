import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { emissionRecalcSchema } from "@/lib/validation";
import { calculateEmissionTCO2e } from "@/lib/calculations";
import { createAuditLog } from "@/lib/audit";
import { apiError, apiOk } from "@/lib/api";

const metricToFactorCategory: Record<string, string> = {
  electricity_consumption: "Purchased electricity",
  natural_gas_consumption: "Natural gas",
  diesel_consumption: "Diesel",
  petrol_consumption: "Petrol",
};

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const payload = emissionRecalcSchema.parse(await request.json());

    const metricEntry = await prisma.metricEntry.findFirstOrThrow({
      where: { id: payload.metricEntryId, organizationId: user.organizationId },
      include: { metricDefinition: true },
    });

    if (!metricEntry.value) throw new Error("Metric entry value is required for calculation");

    const factor = payload.emissionFactorId
      ? await prisma.emissionFactor.findUniqueOrThrow({ where: { id: payload.emissionFactorId } })
      : await prisma.emissionFactor.findFirstOrThrow({
          where: {
            category: metricToFactorCategory[metricEntry.metricDefinition.code],
          },
          orderBy: { versionYear: "desc" },
        });

    const activityValue = Number(metricEntry.value);
    const factorValue = payload.overrideFactorValue ?? Number(factor.factorValue);
    const result = calculateEmissionTCO2e(activityValue, factorValue);
    const formula = `${activityValue} x ${factorValue} / 1000`;

    const calc = await prisma.emissionCalculation.create({
      data: {
        organizationId: user.organizationId,
        facilityId: metricEntry.facilityId,
        reportingPeriodId: metricEntry.reportingPeriodId,
        metricEntryId: metricEntry.id,
        emissionFactorId: factor.id,
        scope: factor.scope,
        activityValue: new Prisma.Decimal(activityValue),
        activityUnit: metricEntry.unit,
        factorValue: new Prisma.Decimal(factorValue),
        resultTCO2e: new Prisma.Decimal(result),
        calculationFormula: formula,
        overrideReason: payload.overrideReason,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "EMISSIONS_RECALCULATED",
      entityType: "EmissionCalculation",
      entityId: calc.id,
      afterValueJson: calc,
    });

    return apiOk(calc, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
