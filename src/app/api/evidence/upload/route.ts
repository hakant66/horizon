import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
]);

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR"]);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const linkedEntityType = String(formData.get("linkedEntityType") || "METRIC_ENTRY");
    const linkedEntityId = String(formData.get("linkedEntityId") || "");

    if (!file) throw new Error("File is required");
    if (!linkedEntityId) throw new Error("linkedEntityId is required");
    if (!allowedMimeTypes.has(file.type)) throw new Error("File type not allowed");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "uploads", user.organizationId);
    await fs.mkdir(uploadDir, { recursive: true });

    const extension = path.extname(file.name);
    const storedName = `${randomUUID()}${extension}`;
    const absoluteFilePath = path.join(uploadDir, storedName);
    await fs.writeFile(absoluteFilePath, buffer);

    const evidence = await prisma.evidence.create({
      data: {
        organizationId: user.organizationId,
        linkedEntityType: linkedEntityType as never,
        linkedEntityId,
        fileName: file.name,
        fileUrl: `/uploads/${user.organizationId}/${storedName}`,
        fileType: file.type,
        fileSize: file.size,
        uploadedById: user.id,
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "EVIDENCE_UPLOADED",
      entityType: "Evidence",
      entityId: evidence.id,
      afterValueJson: evidence,
    });

    return apiOk(evidence, 201);
  } catch (error) {
    return apiError(error, 400);
  }
}
