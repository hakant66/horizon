import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "KnowledgeBaseChunk" ADD COLUMN IF NOT EXISTS embedding vector(1536)`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS kb_chunk_embed_idx ON "KnowledgeBaseChunk" USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`,
  );
  console.log("✅ pgvector setup complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());
