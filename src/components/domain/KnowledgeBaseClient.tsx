"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LLM_PROVIDERS } from "@/lib/rag";

type AiSettings = {
  llmProvider: string;
  llmModel: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  googleApiKey: string;
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
  indexedAt: string | null;
  indexedChunks: number;
  indexedDocs: number;
};

type KbDoc = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  uploadedAt: string;
  uploadedBy: { name: string };
};

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.csv,.xls,.xlsx,.txt";
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(fileType: string) {
  if (fileType === "application/pdf") return "📄";
  if (fileType.includes("word")) return "📝";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📊";
  if (fileType.includes("sheet") || fileType.includes("excel") || fileType === "text/csv") return "📈";
  return "📃";
}

export function KnowledgeBaseClient({ initialDocs }: { initialDocs: KbDoc[] }) {
  const { locale } = useI18n();
  const tr = locale === "tr";

  const [docs, setDocs] = useState<KbDoc[]>(initialDocs);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const res = await fetch("/api/knowledge-base");
    if (res.ok) setDocs((await res.json()) as KbDoc[]);
  }

  function showMsg(text: string, ok = true) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  }

  const uploadFiles = useCallback(async (files: FileList) => {
    const valid = Array.from(files).filter((f) => {
      if (!ALLOWED_MIME.has(f.type)) {
        showMsg(tr ? `${f.name}: desteklenmeyen format.` : `${f.name}: unsupported format.`, false);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        showMsg(tr ? `${f.name}: 50 MB limitini aşıyor.` : `${f.name}: exceeds 50 MB limit.`, false);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: valid.length });

    let failed = 0;
    for (let i = 0; i < valid.length; i++) {
      const fd = new FormData();
      fd.append("file", valid[i]);
      const res = await fetch("/api/knowledge-base", { method: "POST", body: fd });
      if (!res.ok) failed++;
      setUploadProgress({ done: i + 1, total: valid.length });
    }

    setUploading(false);
    setUploadProgress(null);
    await refresh();

    if (failed === 0) {
      showMsg(tr ? `${valid.length} dosya yüklendi.` : `${valid.length} file(s) uploaded.`);
    } else {
      showMsg(tr ? `${valid.length - failed} yüklendi, ${failed} başarısız.` : `${valid.length - failed} uploaded, ${failed} failed.`, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tr]);

  async function deleteDoc(id: string) {
    const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      await refresh();
      showMsg(tr ? "Belge silindi." : "Document deleted.");
    } else {
      showMsg(tr ? "Silme başarısız." : "Delete failed.", false);
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const ids = [...selected];
    let failed = 0;
    for (const id of ids) {
      const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      if (!res.ok) failed++;
    }
    setSelected(new Set());
    await refresh();
    if (failed === 0) {
      showMsg(tr ? `${ids.length} belge silindi.` : `${ids.length} document(s) deleted.`);
    } else {
      showMsg(tr ? `${ids.length - failed} silindi, ${failed} başarısız.` : `${ids.length - failed} deleted, ${failed} failed.`, false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (selected.size === docs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(docs.map((d) => d.id)));
    }
  }

  const allSelected = docs.length > 0 && selected.size === docs.length;
  const someSelected = selected.size > 0;

  // ── AI Settings state ──
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    llmProvider: "openai",
    llmModel: "gpt-4o-mini",
    openaiApiKey: "",
    anthropicApiKey: "",
    googleApiKey: "",
    hasOpenaiKey: false,
    hasAnthropicKey: false,
    hasGoogleKey: false,
    indexedAt: null,
    indexedChunks: 0,
    indexedDocs: 0,
  });
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/ai/settings")
      .then((r) => r.ok ? r.json() as Promise<AiSettings | null> : null)
      .then((s) => { if (s) setAiSettings((prev) => ({ ...prev, ...s })); })
      .catch(() => null);
  }, []);

  const currentProviderModels = LLM_PROVIDERS[aiSettings.llmProvider as keyof typeof LLM_PROVIDERS]?.models ?? [];

  async function saveAiSettings() {
    setAiSaving(true);
    const res = await fetch("/api/ai/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        llmProvider: aiSettings.llmProvider,
        llmModel: aiSettings.llmModel,
        openaiApiKey: aiSettings.openaiApiKey || undefined,
        anthropicApiKey: aiSettings.anthropicApiKey || undefined,
        googleApiKey: aiSettings.googleApiKey || undefined,
      }),
    });
    setAiSaving(false);
    if (res.ok) {
      const updated = (await res.json()) as AiSettings;
      setAiSettings((prev) => ({ ...prev, ...updated, openaiApiKey: "", anthropicApiKey: "", googleApiKey: "" }));
      setIndexMsg({ text: tr ? "AI ayarları kaydedildi." : "AI settings saved.", ok: true });
    } else {
      setIndexMsg({ text: tr ? "Kaydetme başarısız." : "Save failed.", ok: false });
    }
    setTimeout(() => setIndexMsg(null), 4000);
  }

  async function runIndexing() {
    setIndexing(true);
    setIndexMsg({ text: tr ? "Belgeler işleniyor, lütfen bekleyin..." : "Processing documents, please wait...", ok: true });
    const res = await fetch("/api/ai/index", { method: "POST" });
    setIndexing(false);
    if (res.ok) {
      const data = (await res.json()) as { processedDocs: number; totalChunks: number; errors?: string[] };
      setAiSettings((prev) => ({
        ...prev,
        indexedDocs: data.processedDocs,
        indexedChunks: data.totalChunks,
        indexedAt: new Date().toISOString(),
      }));
      const errNote = data.errors?.length ? ` (${data.errors.length} hata)` : "";
      setIndexMsg({
        text: tr
          ? `✅ ${data.processedDocs} belge, ${data.totalChunks} parça indekslendi.${errNote}`
          : `✅ ${data.processedDocs} docs, ${data.totalChunks} chunks indexed.${errNote}`,
        ok: true,
      });
    } else {
      const err = (await res.json().catch(() => ({ error: "Unknown error" }))) as { error?: string };
      setIndexMsg({ text: err.error ?? (tr ? "İndeksleme başarısız." : "Indexing failed."), ok: false });
    }
    setTimeout(() => setIndexMsg(null), 8000);
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle>{tr ? "Dosya Yükle" : "Upload Files"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-100"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
            }}
          >
            <span className="text-3xl">📁</span>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {tr ? "Dosyaları buraya sürükleyin veya tıklayın" : "Drag & drop files here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {tr
                ? "PDF, Word, PowerPoint, Excel, CSV, TXT — maks. 50 MB"
                : "PDF, Word, PowerPoint, Excel, CSV, TXT — max 50 MB"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {tr ? "Birden fazla dosya seçilebilir" : "Multiple files can be selected"}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ""; }}
          />
          {uploadProgress && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{tr ? "Yükleniyor..." : "Uploading..."}</span>
                <span>{uploadProgress.done}/{uploadProgress.total}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div className={`rounded-md px-4 py-2 text-sm ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          {docs.length === 0
            ? (tr ? "Henüz belge yok." : "No documents yet.")
            : (tr ? `${docs.length} belge` : `${docs.length} document${docs.length !== 1 ? "s" : ""}`)}
          {someSelected ? (tr ? ` · ${selected.size} seçili` : ` · ${selected.size} selected`) : ""}
        </p>
        {someSelected && (
          <Button variant="destructive" size="sm" onClick={() => void deleteSelected()} disabled={uploading}>
            {tr ? `${selected.size} Belgeyi Sil` : `Delete ${selected.size} Selected`}
          </Button>
        )}
      </div>

      {/* Table */}
      {docs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tr ? "Belge" : "Document"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tr ? "Açıklama" : "Description"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tr ? "Boyut" : "Size"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tr ? "Yükleyen" : "Uploaded By"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tr ? "Tarih" : "Date"}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {tr ? "İşlem" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <tr key={doc.id} className={`transition-colors hover:bg-slate-50 ${selected.has(doc.id) ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{fileIcon(doc.fileType)}</span>
                      <a
                        href={`/api/knowledge-base/${doc.id}`}
                        download={doc.fileName}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                    {doc.description || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtSize(doc.fileSize)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{doc.uploadedBy.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {new Date(doc.uploadedAt).toLocaleDateString(tr ? "tr-TR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/knowledge-base/${doc.id}`}
                        download={doc.fileName}
                        className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        {tr ? "İndir" : "Download"}
                      </a>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void deleteDoc(doc.id)}
                      >
                        {tr ? "Sil" : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AI Panel ── */}
      <Card className="border-blue-100 bg-blue-50/40">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span>🤖</span>
                {tr ? "Yapay Zeka" : "AI Assistant"}
              </CardTitle>
              {aiSettings.indexedAt && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {tr
                    ? `Son indeksleme: ${new Date(aiSettings.indexedAt).toLocaleString("tr-TR")} — ${aiSettings.indexedDocs} belge, ${aiSettings.indexedChunks} parça`
                    : `Last indexed: ${new Date(aiSettings.indexedAt).toLocaleString("en-GB")} — ${aiSettings.indexedDocs} docs, ${aiSettings.indexedChunks} chunks`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAiPanelOpen((v) => !v)}>
                {aiPanelOpen ? (tr ? "Ayarları Gizle" : "Hide Settings") : (tr ? "AI Ayarları" : "AI Settings")}
              </Button>
              <Button
                onClick={() => void runIndexing()}
                disabled={indexing || !aiSettings.hasOpenaiKey}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {indexing ? (tr ? "İşleniyor..." : "Processing...") : (tr ? "Yapay Zeka Kullan" : "Use AI")}
              </Button>
            </div>
          </div>
        </CardHeader>

        {aiPanelOpen && (
          <CardContent className="space-y-4 border-t border-blue-100 pt-4">
            <p className="text-xs text-slate-500">
              {tr
                ? "Gömülü vektör oluşturma için OpenAI API anahtarı zorunludur. Metin üretimi için istediğiniz LLM'yi seçebilirsiniz."
                : "OpenAI API key is required for embeddings. You can choose any LLM for text generation."}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Generation LLM */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {tr ? "Metin Üretimi — Sağlayıcı" : "Text Generation — Provider"}
                </label>
                <select
                  value={aiSettings.llmProvider}
                  onChange={(e) => setAiSettings((p) => ({ ...p, llmProvider: e.target.value, llmModel: LLM_PROVIDERS[e.target.value as keyof typeof LLM_PROVIDERS]?.models[0]?.id ?? "" }))}
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                >
                  {Object.entries(LLM_PROVIDERS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {tr ? "Model" : "Model"}
                </label>
                <select
                  value={aiSettings.llmModel}
                  onChange={(e) => setAiSettings((p) => ({ ...p, llmModel: e.target.value }))}
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                >
                  {currentProviderModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  OpenAI API Key {tr ? "(Gömülü + GPT)" : "(Embeddings + GPT)"}
                  {aiSettings.hasOpenaiKey && <span className="ml-1 text-green-600">✓</span>}
                </label>
                <input
                  type="password"
                  placeholder={aiSettings.hasOpenaiKey ? "••••••••••• (kayıtlı)" : "sk-..."}
                  value={aiSettings.openaiApiKey}
                  onChange={(e) => setAiSettings((p) => ({ ...p, openaiApiKey: e.target.value }))}
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Anthropic API Key
                  {aiSettings.hasAnthropicKey && <span className="ml-1 text-green-600">✓</span>}
                </label>
                <input
                  type="password"
                  placeholder={aiSettings.hasAnthropicKey ? "••••••••••• (kayıtlı)" : "sk-ant-..."}
                  value={aiSettings.anthropicApiKey}
                  onChange={(e) => setAiSettings((p) => ({ ...p, anthropicApiKey: e.target.value }))}
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Google API Key
                  {aiSettings.hasGoogleKey && <span className="ml-1 text-green-600">✓</span>}
                </label>
                <input
                  type="password"
                  placeholder={aiSettings.hasGoogleKey ? "••••••••••• (kayıtlı)" : "AIza..."}
                  value={aiSettings.googleApiKey}
                  onChange={(e) => setAiSettings((p) => ({ ...p, googleApiKey: e.target.value }))}
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>

            <Button onClick={() => void saveAiSettings()} disabled={aiSaving} size="sm">
              {aiSaving ? (tr ? "Kaydediliyor..." : "Saving...") : (tr ? "Ayarları Kaydet" : "Save Settings")}
            </Button>
          </CardContent>
        )}

        {indexMsg && (
          <div className={`mx-4 mb-4 rounded-md px-3 py-2 text-sm ${indexMsg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
            {indexMsg.text}
          </div>
        )}
      </Card>

      {/* Security note */}
      <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="mt-0.5 text-base">🔒</span>
        <p className="text-xs text-slate-500">
          {tr
            ? "Tüm dosyalar AES-256-GCM ile şifrelenerek Docker volume üzerinde saklanır. Şifreleme anahtarı ve IV veritabanında ayrı tutulur — dosya erişimi yalnızca uygulama üzerinden mümkündür."
            : "All files are encrypted with AES-256-GCM and stored on a Docker volume. The key and IV are stored separately in the database — file access is only possible through the application."}
        </p>
      </div>
    </div>
  );
}
