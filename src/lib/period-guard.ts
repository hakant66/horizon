import { prisma } from "@/lib/prisma";

export async function assertPeriodOpen(
  reportingPeriodId: string,
  organizationId: string,
): Promise<void> {
  const period = await prisma.reportingPeriod.findFirst({
    where: { id: reportingPeriodId, organizationId },
    select: { status: true },
  });
  if (!period) throw new Error("Reporting period not found.");
  if (period.status === "LOCKED" || period.status === "SUBMITTED" || period.status === "CERTIFIED") {
    throw new Error(`Reporting period is ${period.status.toLowerCase()} and no longer accepts data changes.`);
  }
}
