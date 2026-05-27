import { decryptFile } from "./encryption";

export async function extractTextFromDoc(
  storedPath: string,
  iv: string,
  authTag: string,
  fileType: string,
  fileName: string,
): Promise<string> {
  const buf = await decryptFile(storedPath, iv, authTag);

  if (fileType === "text/plain" || fileType === "text/csv") {
    return buf.toString("utf-8");
  }

  if (fileType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    const result = await parser.getText();
    return result.text;
  }

  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value;
  }

  if (
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  ) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "buffer" });
    return wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      return `=== ${name} ===\n${XLSX.utils.sheet_to_csv(ws)}`;
    }).join("\n\n");
  }

  // PPTX/PPT: extract text roughly
  if (
    fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    fileType === "application/vnd.ms-powerpoint"
  ) {
    const text = buf.toString("utf-8", 0, Math.min(buf.length, 500_000));
    // Extract readable ASCII runs (crude but works for basic text)
    return text.replace(/[^\x20-\x7E\n\r\tÀ-ɏ]/g, " ").replace(/\s{3,}/g, "\n");
  }

  return buf.toString("utf-8", 0, Math.min(buf.length, 100_000));
}

export function chunkText(text: string, chunkSize = 900, overlap = 150): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length + 2 > chunkSize) {
      if (current.length > 50) {
        chunks.push(current.trim());
        // Overlap: keep last `overlap` chars
        current = current.slice(-overlap) + "\n\n" + trimmed;
      } else {
        current += "\n\n" + trimmed;
      }
    } else {
      current += (current ? "\n\n" : "") + trimmed;
    }
  }

  if (current.trim().length > 50) chunks.push(current.trim());

  // If still too large, split by sentence
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= chunkSize * 1.5) {
      result.push(chunk);
    } else {
      const sentences = chunk.split(/(?<=[.!?])\s+/);
      let sub = "";
      for (const sent of sentences) {
        if (sub.length + sent.length > chunkSize && sub.length > 50) {
          result.push(sub.trim());
          sub = sub.slice(-overlap) + " " + sent;
        } else {
          sub += (sub ? " " : "") + sent;
        }
      }
      if (sub.trim().length > 50) result.push(sub.trim());
    }
  }

  return result.length > 0 ? result : [text.slice(0, chunkSize)];
}
