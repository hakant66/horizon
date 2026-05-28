/**
 * Runs before `prisma db push` to install the pgvector extension.
 * Must execute before the schema push because the schema contains
 * Unsupported("vector(1536)") columns that require the extension type.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
  console.log("✅ pgvector extension enabled");
}

main().catch(console.error).finally(() => prisma.$disconnect());
