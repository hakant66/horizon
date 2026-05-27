"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/LanguageProvider";

type UploadState = "idle" | "uploading" | "success" | "error";

export function EvidenceUploader({
  linkedEntityType,
  linkedEntityId,
}: {
  linkedEntityType: string;
  linkedEntityId: string;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onUpload() {
    if (!file || state === "uploading") return;
    setState("uploading");
    setErrorMsg("");

    const body = new FormData();
    body.set("file", file);
    body.set("linkedEntityType", linkedEntityType);
    body.set("linkedEntityId", linkedEntityId);

    try {
      const res = await fetch("/api/evidence/upload", { method: "POST", body });
      if (res.ok) {
        setState("success");
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setErrorMsg(err.error ?? (tr ? "Yükleme başarısız" : "Upload failed"));
        setState("error");
      }
    } catch {
      setErrorMsg(tr ? "Ağ hatası" : "Network error");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
      >
        <Paperclip className="h-3 w-3" />
        {file ? file.name.slice(0, 18) + (file.name.length > 18 ? "…" : "") : (tr ? "Dosya Seç" : "Choose file")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
        className="hidden"
        onChange={(e) => { setFile(e.target.files?.[0] ?? null); setState("idle"); }}
      />
      {file && (
        <Button
          type="button"
          size="sm"
          disabled={state === "uploading"}
          onClick={() => void onUpload()}
          className="h-7 px-2 text-xs"
        >
          {state === "uploading" ? (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {tr ? "Yükleniyor" : "Uploading"}
            </span>
          ) : (
            <span className="flex items-center gap-1"><Upload className="h-3 w-3" />{tr ? "Yükle" : "Upload"}</span>
          )}
        </Button>
      )}
      {state === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
      {state === "error" && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <XCircle className="h-3.5 w-3.5" />{errorMsg}
        </span>
      )}
    </div>
  );
}
