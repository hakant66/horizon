import { prisma } from "./prisma";

export async function upsertChunk(
  id: string,
  organizationId: string,
  documentId: string,
  content: string,
  chunkIndex: number,
  embedding: number[],
): Promise<void> {
  // Upsert text record
  await prisma.knowledgeBaseChunk.upsert({
    where: { id },
    create: { id, organizationId, documentId, content, chunkIndex, tokenCount: Math.ceil(content.length / 4) },
    update: { content, chunkIndex, tokenCount: Math.ceil(content.length / 4) },
  });

  // Store embedding via raw SQL (pgvector)
  const vec = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeBaseChunk" SET embedding = $1::vector WHERE id = $2`,
    vec,
    id,
  );
}

export async function similaritySearch(
  organizationId: string,
  queryEmbedding: number[],
  k = 12,
): Promise<Array<{ id: string; content: string; documentId: string; similarity: number }>> {
  const vec = `[${queryEmbedding.join(",")}]`;
  const rows = await prisma.$queryRawUnsafe<
    Array<{ id: string; content: string; documentId: string; similarity: number }>
  >(
    `SELECT id, content, "documentId",
            1 - (embedding <=> $1::vector) AS similarity
     FROM "KnowledgeBaseChunk"
     WHERE "organizationId" = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    vec,
    organizationId,
    k,
  );
  return rows;
}

export async function deleteChunksByDoc(documentId: string): Promise<void> {
  await prisma.knowledgeBaseChunk.deleteMany({ where: { documentId } });
}

export async function deleteChunksByOrg(organizationId: string): Promise<void> {
  await prisma.knowledgeBaseChunk.deleteMany({ where: { organizationId } });
}

export async function countChunks(organizationId: string): Promise<number> {
  return prisma.knowledgeBaseChunk.count({ where: { organizationId } });
}
