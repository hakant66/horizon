"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function EvidenceUploader({ linkedEntityType, linkedEntityId }: { linkedEntityType: string; linkedEntityId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  async function onUpload() {
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    body.set("linkedEntityType", linkedEntityType);
    body.set("linkedEntityId", linkedEntityId);

    const res = await fetch("/api/evidence/upload", { method: "POST", body });
    setStatus(res.ok ? "Uploaded" : "Upload failed");
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-xs"
      />
      <Button type="button" size="sm" onClick={onUpload}>
        Upload
      </Button>
      {status ? <span className="text-xs text-slate-600">{status}</span> : null}
    </div>
  );
}
