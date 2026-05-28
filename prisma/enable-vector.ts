/**
 * Runs before `prisma db push` to install the pgvector extension.
 * Must execute before the schema push because the schema may contain
 * Unsupported("vector(1536)") columns that require the extension type.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
  console.log("✅ pgvector extension enabled");
}

main()
  .catch((err) => {
    console.error("❌ Failed to enable pgvector extension:", err.message);
    process.exit(1); // propagate failure so entrypoint set -eu aborts
  })
  .finally(() => prisma.$disconnect());
