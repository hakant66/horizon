import { DashboardClient } from "@/components/domain/DashboardClient";
import { PageHeader } from "@/components/domain/PageHeader";
import { getWorkspaceContext } from "@/lib/context";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const { organization, reportingPeriod } = await getWorkspaceContext();
  const data = await getDashboardData(organization.id, reportingPeriod?.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Home Dashboard"
        titleTr="Ana Sayfa Panosu"
        titleEn="Home Dashboard"
        description="Track reporting readiness, missing data, and certification workflow status."
        descriptionTr="Raporlama hazırlığını, eksik verileri ve belgelendirme iş akışı durumunu takip edin."
        descriptionEn="Track reporting readiness, missing data, and certification workflow status."
      />

      <DashboardClient data={data} reportingPeriodName={reportingPeriod?.name} />
    </div>
  );
}
