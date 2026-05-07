import { PageHeader } from "@/components/domain/PageHeader";
import { SetupWizardClient } from "@/components/domain/SetupWizardClient";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function SetupPage() {
  const { organization } = await getWorkspaceContext();
  const [facilities, users] = await Promise.all([
    prisma.facility.findMany({ where: { organizationId: organization.id }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true, email: true, role: true } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Setup"
        titleTr="Kurulum"
        titleEn="Setup"
        description="Configure organization, facilities, users, and reporting periods."
        descriptionTr="Organizasyonu, tesisleri, kullanıcıları ve raporlama dönemlerini yapılandırın."
        descriptionEn="Configure organization, facilities, users, and reporting periods."
      />
      <SetupWizardClient
        organization={{
          ...organization,
          annualTurnoverEurM: organization.annualTurnoverEurM ? Number(organization.annualTurnoverEurM) : null,
          totalAssetsEurM: organization.totalAssetsEurM ? Number(organization.totalAssetsEurM) : null,
        }}
        facilities={facilities}
        users={users}
      />
    </div>
  );
}
