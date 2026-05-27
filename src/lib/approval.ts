import { ApprovalStage, UserRole } from "@prisma/client";

type TransitionRule = {
  from: ApprovalStage[];
  allowedRoles: UserRole[];
};

// Full transition matrix — every valid (from → to) pair with which roles may trigger it.
const TRANSITION_RULES: Record<ApprovalStage, TransitionRule[]> = {
  // Anyone who entered data can submit for manager review; so can the manager directly.
  MANAGER_REVIEW: [
    {
      from: [ApprovalStage.DATA_ENTRY, ApprovalStage.REVISION_REQUESTED],
      allowedRoles: [UserRole.DATA_CONTRIBUTOR, UserRole.SUSTAINABILITY_MANAGER, UserRole.ADMIN],
    },
  ],
  // Only managers/admins escalate to Horizon review.
  HORIZON_REVIEW: [
    {
      from: [ApprovalStage.MANAGER_REVIEW],
      allowedRoles: [UserRole.SUSTAINABILITY_MANAGER, UserRole.ADMIN],
    },
  ],
  // Horizon consultant or admin gives final approval.
  APPROVED: [
    {
      from: [ApprovalStage.HORIZON_REVIEW],
      allowedRoles: [UserRole.HORIZON_CONSULTANT, UserRole.ADMIN],
    },
  ],
  // Revision can be requested by managers, Horizon consultants, or admins at any review stage.
  REVISION_REQUESTED: [
    {
      from: [ApprovalStage.MANAGER_REVIEW, ApprovalStage.HORIZON_REVIEW, ApprovalStage.APPROVED],
      allowedRoles: [UserRole.SUSTAINABILITY_MANAGER, UserRole.ADMIN, UserRole.HORIZON_CONSULTANT],
    },
  ],
  // Data entry is the reset state — used when a revision has been addressed.
  DATA_ENTRY: [
    {
      from: [ApprovalStage.REVISION_REQUESTED],
      allowedRoles: [UserRole.DATA_CONTRIBUTOR, UserRole.SUSTAINABILITY_MANAGER, UserRole.ADMIN],
    },
  ],
};

export type TransitionError =
  | { code: "INVALID_TRANSITION"; message: string }
  | { code: "FORBIDDEN"; message: string };

/**
 * Returns null if the transition is allowed, or a TransitionError describing why it is not.
 */
export function validateTransition(
  currentStage: ApprovalStage,
  targetStage: ApprovalStage,
  actorRole: UserRole,
): TransitionError | null {
  if (currentStage === targetStage) return null;

  const rules = TRANSITION_RULES[targetStage];
  const matchingRule = rules.find((r) => r.from.includes(currentStage));

  if (!matchingRule) {
    return {
      code: "INVALID_TRANSITION",
      message: `Cannot move from ${currentStage} to ${targetStage}`,
    };
  }

  if (!matchingRule.allowedRoles.includes(actorRole)) {
    return {
      code: "FORBIDDEN",
      message: `Role ${actorRole} is not allowed to move from ${currentStage} to ${targetStage}`,
    };
  }

  return null;
}

/**
 * Returns true if the given role can initiate a transition to `targetStage`
 * from *any* current stage (used for UI permission gates).
 */
export function canTransitionTo(targetStage: ApprovalStage, role: UserRole): boolean {
  return TRANSITION_RULES[targetStage].some((r) => r.allowedRoles.includes(role));
}

/** Human-readable label for each stage (English). */
export const STAGE_LABELS: Record<ApprovalStage, string> = {
  DATA_ENTRY: "Data Entry",
  MANAGER_REVIEW: "Manager Review",
  HORIZON_REVIEW: "Horizon Review",
  APPROVED: "Approved",
  REVISION_REQUESTED: "Revision Requested",
};
