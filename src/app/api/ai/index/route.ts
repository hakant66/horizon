import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { extractTextFromDoc, chunkText } from "@/lib/text-extractor";
import { generateEmbedding } from "@/lib/rag";
import { upsertChunk, deleteChunksByDoc } from "@/lib/vector-store";

export async function POST() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);

    const settings = await prisma.aiSettings.findUnique({
      where: { organizationId: user.organizationId },
    });
    if (!settings?.openaiApiKey) {
      return apiError("OpenAI API anahtarı gerekli (gömülü vektör oluşturma için)", 400);
    }

    const docs = await prisma.knowledgeBaseDocument.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { uploadedAt: "asc" },
    });

    if (docs.length === 0) {
      return apiError("Bilgi bankasında işlenecek belge yok", 400);
    }

    let totalChunks = 0;
    let processedDocs = 0;
    const errors: string[] = [];

    for (const doc of docs) {
      try {
        // Remove old chunks for this doc before re-indexing
        await deleteChunksByDoc(doc.id);

        const text = await extractTextFromDoc(
          doc.storedPath,
          doc.encryptionIv,
          doc.authTag,
          doc.fileType,
          doc.fileName,
        );

        if (!text.trim()) continue;

        const chunks = chunkText(text);

        for (let i = 0; i < chunks.length; i++) {
          const chunkId = `${doc.id}-chunk-${i}`;
          const embedding = await generateEmbedding(chunks[i], settings.openaiApiKey!);
          await upsertChunk(chunkId, user.organizationId, doc.id, chunks[i], i, embedding);
          totalChunks++;
        }

        processedDocs++;
      } catch (err) {
        errors.push(`${doc.fileName}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Update AiSettings with index stats
    await prisma.aiSettings.update({
      where: { organizationId: user.organizationId },
      data: { indexedAt: new Date(), indexedChunks: totalChunks, indexedDocs: processedDocs },
    });

    return apiOk({
      processedDocs,
      totalChunks,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
