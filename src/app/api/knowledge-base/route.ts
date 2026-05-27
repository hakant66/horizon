import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { encryptAndSave } from "@/lib/encryption";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "DATA_CONTRIBUTOR", "AUDITOR", "HORIZON_CONSULTANT"]);
    const docs = await prisma.knowledgeBaseDocument.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        description: true,
        uploadedAt: true,
        uploadedBy: { select: { name: true } },
      },
    });
    return apiOk(docs);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const description = (formData.get("description") as string | null) || null;

    if (!file) return apiError("No file provided", 400);
    if (!ALLOWED_TYPES[file.type]) return apiError(`File type '${file.type}' is not allowed`, 400);
    if (file.size > MAX_SIZE_BYTES) return apiError("File exceeds 50 MB limit", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storedPath, iv, authTag } = await encryptAndSave(buffer, file.name);

    const doc = await prisma.knowledgeBaseDocument.create({
      data: {
        organizationId: user.organizationId,
        uploadedById: user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storedPath,
        encryptionIv: iv,
        authTag,
        description: description?.trim() || null,
      },
      select: { id: true, fileName: true, fileSize: true, uploadedAt: true },
    });

    return apiOk(doc);
  } catch (error) {
    return apiError(error, 500);
  }
}
