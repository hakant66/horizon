import { PageHeader } from "@/components/domain/PageHeader";
import { EsgSummaryClient } from "@/components/domain/EsgSummaryClient";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EsgSummaryPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [summary, org] = await Promise.all([
    prisma.esgSummary.findUnique({ where: { organizationId: session.user.organizationId } }),
    prisma.organization.findUniqueOrThrow({ where: { id: session.user.organizationId } }),
  ]);

  const serialized = summary
    ? {
        ...summary,
        fiscalYearStart: summary.fiscalYearStart?.toISOString() ?? null,
        fiscalYearEnd: summary.fiscalYearEnd?.toISOString() ?? null,
        annualRevenue: summary.annualRevenue ? Number(summary.annualRevenue) : null,
        ebitda: summary.ebitda ? Number(summary.ebitda) : null,
        netProfit: summary.netProfit ? Number(summary.netProfit) : null,
        totalAssets: summary.totalAssets ? Number(summary.totalAssets) : null,
        totalEquity: summary.totalEquity ? Number(summary.totalEquity) : null,
        sustainabilityCapexForecast: summary.sustainabilityCapexForecast ? Number(summary.sustainabilityCapexForecast) : null,
        annualElectricityConsumption: summary.annualElectricityConsumption ? Number(summary.annualElectricityConsumption) : null,
        annualNaturalGasConsumption: summary.annualNaturalGasConsumption ? Number(summary.annualNaturalGasConsumption) : null,
        annualFuelConsumption: summary.annualFuelConsumption ? Number(summary.annualFuelConsumption) : null,
        renewableEnergyPercent: summary.renewableEnergyPercent ? Number(summary.renewableEnergyPercent) : null,
        scope1Emissions: summary.scope1Emissions ? Number(summary.scope1Emissions) : null,
        scope2Emissions: summary.scope2Emissions ? Number(summary.scope2Emissions) : null,
        scope3Emissions: summary.scope3Emissions ? Number(summary.scope3Emissions) : null,
        annualWaterWithdrawal: summary.annualWaterWithdrawal ? Number(summary.annualWaterWithdrawal) : null,
        wasteRecyclingRate: summary.wasteRecyclingRate ? Number(summary.wasteRecyclingRate) : null,
        lostTimeInjuryRate: summary.lostTimeInjuryRate ? Number(summary.lostTimeInjuryRate) : null,
        avgTrainingHoursPerEmployee: summary.avgTrainingHoursPerEmployee ? Number(summary.avgTrainingHoursPerEmployee) : null,
        femaleManagerPercent: summary.femaleManagerPercent ? Number(summary.femaleManagerPercent) : null,
        employeeTurnoverRate: summary.employeeTurnoverRate ? Number(summary.employeeTurnoverRate) : null,
        rdExpenditure: summary.rdExpenditure ? Number(summary.rdExpenditure) : null,
      }
    : null;

  const orgContext = {
    sasbSector: org.sasbSector,
    naceCode: org.naceCode,
    csrdSector: org.csrdSector,
    reportingFrameworks: org.reportingFrameworks,
    employeeCount: org.employeeCount,
    annualTurnoverEurM: org.annualTurnoverEurM ? Number(org.annualTurnoverEurM) : null,
    totalAssetsEurM: org.totalAssetsEurM ? Number(org.totalAssetsEurM) : null,
    isPublicInterestEntity: org.isPublicInterestEntity,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="ESG Summary"
        titleTr="ESG Özet Bilgileri"
        titleEn="ESG Summary Data"
        description="Collect and manage key ESG data for reporting boundary and sustainability disclosures."
        descriptionTr="Raporlama sınırı ve sürdürülebilirlik açıklamaları için temel ESG verilerini toplayın ve yönetin."
        descriptionEn="Collect and manage key ESG data for reporting boundary and sustainability disclosures."
      />
      <EsgSummaryClient initial={serialized} orgContext={orgContext} />
    </div>
  );
}
