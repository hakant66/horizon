import { hashSync } from "bcryptjs";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "AUDITOR"]);
    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return apiOk(users);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireRole(["ADMIN"]);
    const payload = userSchema.parse(await request.json());
    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        organizationId: authUser.organizationId,
        password: hashSync(payload.password || "Demo1234!", 10),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await createAuditLog({
      organizationId: authUser.organizationId,
      userId: authUser.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      afterValueJson: user,
    });
    return apiOk(user, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await requireRole(["ADMIN"]);
    const payload = userSchema.parse(await request.json());
    if (!payload.id) throw new Error("id is required");

    const before = await prisma.user.findFirstOrThrow({ where: { id: payload.id, organizationId: authUser.organizationId } });
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: {
        name: payload.name,
        role: payload.role,
        ...(payload.password ? { password: hashSync(payload.password, 10) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await createAuditLog({
      organizationId: authUser.organizationId,
      userId: authUser.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: user.id,
      beforeValueJson: before,
      afterValueJson: user,
    });
    return apiOk(user);
  } catch (error) {
    return apiError(error, 400);
  }
}
