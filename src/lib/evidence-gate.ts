import { prisma } from "@/lib/prisma";
import type { ApprovalStage, LinkedEntityType } from "@prisma/client";

// Transitions that require at least one attached Evidence record.
const GATED: Array<[ApprovalStage, ApprovalStage]> = [
  ["DATA_ENTRY", "MANAGER_REVIEW"],
  ["MANAGER_REVIEW", "HORIZON_REVIEW"],
];

export function transitionRequiresEvidence(from: ApprovalStage, to: ApprovalStage): boolean {
  return GATED.some(([f, t]) => f === from && t === to);
}

export async function hasEvidence(
  linkedEntityType: LinkedEntityType,
  linkedEntityId: string,
  organizationId: string,
): Promise<boolean> {
  const count = await prisma.evidence.count({
    where: { organizationId, linkedEntityType, linkedEntityId },
  });
  return count > 0;
}
