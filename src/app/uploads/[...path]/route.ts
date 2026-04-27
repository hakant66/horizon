import path from "node:path";
import fs from "node:fs/promises";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const relativePath = resolvedParams.path.join("/");
  const fullPath = path.join(process.cwd(), "uploads", relativePath);

  try {
    const content = await fs.readFile(fullPath);
    return new Response(content, { status: 200 });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
