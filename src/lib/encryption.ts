import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads", "kb");

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || "dev-nextauth-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

export async function encryptAndSave(buffer: Buffer, filename: string): Promise<{ storedPath: string; iv: string; authTag: string }> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  const storedPath = path.join(UPLOADS_DIR, storedName);
  await fs.writeFile(storedPath, encrypted);

  return {
    storedPath,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export async function decryptFile(storedPath: string, iv: string, authTag: string): Promise<Buffer> {
  const encrypted = await fs.readFile(storedPath);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function deleteStoredFile(storedPath: string): Promise<void> {
  try {
    await fs.unlink(storedPath);
  } catch {
    // file already gone
  }
}
