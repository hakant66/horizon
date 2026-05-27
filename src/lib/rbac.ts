import { UserRole } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

export const roleCapabilities: Record<UserRole, string[]> = {
  ADMIN: ["all"],
  SUSTAINABILITY_MANAGER: ["workflow:write", "report:submit", "audit:view"],
  DATA_CONTRIBUTOR: ["metrics:write", "evidence:upload"],
  FINANCE_REVIEWER: ["workflow:read", "approval:report", "comment"],
  AUDITOR: ["certification:review", "comment", "decision"],
  HORIZON_CONSULTANT: [
    "all:read",
    "report:review",
    "report:approve",
    "certification:review",
    "certification:decide",
    "comment",
    "task:assign",
    "bulk:revision",
    "sector:admin",
    "ai:review",
    "audit:view",
  ],
};

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireRole(roles: Array<UserRole | string>) {
  const user = await requireAuth();
  if (!roles.map((r) => String(r)).includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
