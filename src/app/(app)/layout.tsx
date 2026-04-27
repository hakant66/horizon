import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!organization) {
    redirect("/login");
  }

  const reportingPeriod = await prisma.reportingPeriod.findFirst({
    where: { organizationId: organization.id },
    orderBy: { startDate: "desc" },
  });

  return (
    <AppShell
      orgName={organization.name}
      period={reportingPeriod?.name || "No period"}
      userName={session.user.name || session.user.email || "User"}
    >
      {children}
    </AppShell>
  );
}
