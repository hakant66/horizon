import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { decryptFile, deleteStoredFile } from "@/lib/encryption";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "DATA_CONTRIBUTOR", "AUDITOR", "HORIZON_CONSULTANT"]);
    const { id } = await params;

    const doc = await prisma.knowledgeBaseDocument.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!doc) return apiError("Document not found", 404);

    const decrypted = await decryptFile(doc.storedPath, doc.encryptionIv, doc.authTag);

    return new NextResponse(new Uint8Array(decrypted), {
      headers: {
        "Content-Type": doc.fileType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Content-Length": String(decrypted.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const { id } = await params;

    const doc = await prisma.knowledgeBaseDocument.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!doc) return apiError("Document not found", 404);

    await deleteStoredFile(doc.storedPath);
    await prisma.knowledgeBaseDocument.delete({ where: { id } });

    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error, 500);
  }
}
