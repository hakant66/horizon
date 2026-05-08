import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { emissionRecalcSchema } from "@/lib/validation";
import { calculateEmissionTCO2e } from "@/lib/calculations";
import { createAuditLog } from "@/lib/audit";
import { apiError, apiOk } from "@/lib/api";

// Maps metric definition code → emission factor category name in DB
const metricToFactorCategory: Record<string, string> = {
  // Kapsam 1 — Doğrudan
  natural_gas_consumption:     "Natural gas",
  diesel_consumption:          "Diesel",
  petrol_consumption:          "Petrol",
  lpg_consumption:             "LPG",
  fuel_oil_consumption:        "Fuel oil",
  // Kapsam 2 — Satın Alınan Enerji
  electricity_consumption:     "Purchased electricity",
  district_heat_consumption:   "District heat",
  // Kapsam 3 — Dolaylı
  s3_purchased_goods_spend:    "S3_Cat1_PurchasedGoods",
  s3_fuel_energy_related:      "S3_Cat3_FuelEnergyRelated",
  s3_upstream_logistics_tkm:   "S3_Cat4_UpstreamLogistics",
  s3_waste_to_landfill:        "S3_Cat5_WasteLandfill",
  s3_waste_incinerated:        "S3_Cat5_WasteIncinerated",
  s3_business_travel_air_short:"S3_Cat6_AirShortHaul",
  s3_business_travel_air_long: "S3_Cat6_AirLongHaul",
  s3_business_travel_rail:     "S3_Cat6_Rail",
  s3_business_travel_car:      "S3_Cat6_Car",
  s3_employee_commute_car:     "S3_Cat7_CommuteCar",
  s3_employee_commute_transit: "S3_Cat7_CommuteTransit",
  s3_downstream_logistics_tkm: "S3_Cat9_DownstreamLogistics",
  s3_product_energy_use_kwh:   "S3_Cat11_ProductUse",
};

// Maps emission factor category prefix → scope3Category label
const categoryToScope3Label: Record<string, string> = {
  "S3_Cat1_PurchasedGoods":        "Kategori 1 — Satın Alınan Mal ve Hizmetler",
  "S3_Cat3_FuelEnergyRelated":     "Kategori 3 — Yakıt ve Enerji ile İlgili Faaliyetler",
  "S3_Cat4_UpstreamLogistics":     "Kategori 4 — Upstream Taşımacılık ve Dağıtım",
  "S3_Cat5_WasteLandfill":         "Kategori 5 — Operasyon Atığı (Düzenli Depolama)",
  "S3_Cat5_WasteIncinerated":      "Kategori 5 — Operasyon Atığı (Yakma)",
  "S3_Cat6_AirShortHaul":          "Kategori 6 — İş Seyahati (Kısa Mesafe Uçuş)",
  "S3_Cat6_AirLongHaul":           "Kategori 6 — İş Seyahati (Uzun Mesafe Uçuş)",
  "S3_Cat6_Rail":                  "Kategori 6 — İş Seyahati (Tren)",
  "S3_Cat6_Car":                   "Kategori 6 — İş Seyahati (Araç)",
  "S3_Cat7_CommuteCar":            "Kategori 7 — Çalışan Ulaşımı (Araç)",
  "S3_Cat7_CommuteTransit":        "Kategori 7 — Çalışan Ulaşımı (Toplu Taşıma)",
  "S3_Cat9_DownstreamLogistics":   "Kategori 9 — Downstream Taşımacılık ve Dağıtım",
  "S3_Cat11_ProductUse":           "Kategori 11 — Satılan Ürünlerin Kullanımı",
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

    const factorCategory = metricToFactorCategory[metricEntry.metricDefinition.code];
    if (!factorCategory) {
      throw new Error(`No emission factor mapping found for metric code: ${metricEntry.metricDefinition.code}`);
    }

    const factor = payload.emissionFactorId
      ? await prisma.emissionFactor.findUniqueOrThrow({ where: { id: payload.emissionFactorId } })
      : await prisma.emissionFactor.findFirstOrThrow({
          where: { category: factorCategory },
          orderBy: { versionYear: "desc" },
        });

    const activityValue = Number(metricEntry.value);
    const factorValue = payload.overrideFactorValue ?? Number(factor.factorValue);
    const result = calculateEmissionTCO2e(activityValue, factorValue);
    const formula = `${activityValue} × ${factorValue} / 1000`;

    const scope3Category = factor.scope === "SCOPE_3"
      ? (categoryToScope3Label[factor.category] ?? factor.category)
      : null;

    const calc = await prisma.emissionCalculation.create({
      data: {
        organizationId: user.organizationId,
        facilityId: metricEntry.facilityId,
        reportingPeriodId: metricEntry.reportingPeriodId,
        metricEntryId: metricEntry.id,
        emissionFactorId: factor.id,
        scope: factor.scope,
        scope3Category,
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
