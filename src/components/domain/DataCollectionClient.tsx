"use client";

import { useRef, useState } from "react";
import { MetricEntryStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/domain/DataTable";
import { EvidenceUploader } from "@/components/domain/EvidenceUploader";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";

type Entry = {
  id: string;
  facilityId: string;
  reportingPeriodId: string;
  metricDefinitionId: string;
  facility: { name: string };
  metricDefinition: { name: string; isRequired: boolean; unit: string };
  value: string | null;
  unit: string;
  status: MetricEntryStatus;
  ownerUserId: string | null;
};

type UserRow = { id: string; name: string; email: string };

type CsvRow = {
  facility: string;
  metric: string;
  value: number | null;
  unit?: string;
  status?: string;
  ownerEmail?: string;
};

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = {
    facility: headers.findIndex((h) => ["facility", "facility_name", "tesis"].includes(h)),
    metric: headers.findIndex((h) => ["metric", "metric_name", "metrik"].includes(h)),
    value: headers.findIndex((h) => ["value", "deger", "değer"].includes(h)),
    unit: headers.findIndex((h) => ["unit", "birim"].includes(h)),
    status: headers.findIndex((h) => ["status", "durum"].includes(h)),
    ownerEmail: headers.findIndex((h) => ["owner_email", "sorumlu_email", "sorumlu_eposta"].includes(h)),
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const rawValue = idx.value >= 0 ? cols[idx.value] : "";
    return {
      facility: idx.facility >= 0 ? cols[idx.facility] || "" : "",
      metric: idx.metric >= 0 ? cols[idx.metric] || "" : "",
      value: rawValue === "" ? null : Number(rawValue),
      unit: idx.unit >= 0 ? cols[idx.unit] : undefined,
      status: idx.status >= 0 ? cols[idx.status] : undefined,
      ownerEmail: idx.ownerEmail >= 0 ? cols[idx.ownerEmail] : undefined,
    };
  });
}

export function DataCollectionClient({ entries, users }: { entries: Entry[]; users: UserRow[] }) {
  const { locale } = useI18n();
  const [rows, setRows] = useState<Entry[]>(entries);
  const [message, setMessage] = useState("");
  const [bulkOwnerId, setBulkOwnerId] = useState(users[0]?.id || "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function updateEntry(row: Entry) {
    const res = await fetch("/api/metrics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        facilityId: row.facilityId,
        reportingPeriodId: row.reportingPeriodId,
        metricDefinitionId: row.metricDefinitionId,
        value: row.value ? Number(row.value) : null,
        unit: row.unit,
        status: row.status,
        ownerUserId: row.ownerUserId,
      }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Metrik güncellendi"
          : "Metric updated"
        : locale === "tr"
          ? "Metrik güncellemesi başarısız"
          : "Metric update failed",
    );
  }

  async function uploadCsv(file: File) {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv")) {
      setMessage(locale === "tr" ? "Şu an sadece CSV yükleme destekleniyor." : "Only CSV upload is supported right now.");
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      setMessage(locale === "tr" ? "CSV içinde işlenecek satır bulunamadı." : "No processable rows found in CSV.");
      return;
    }

    const res = await fetch("/api/metrics/bulk-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportingPeriodId: rows[0]?.reportingPeriodId, rows: parsed }),
    });

    if (!res.ok) {
      setMessage(locale === "tr" ? "CSV yükleme başarısız" : "CSV upload failed");
      return;
    }

    const result = (await res.json()) as { imported: number; failed: number; errors: string[] };
    setMessage(
      locale === "tr"
        ? `CSV işlendi. Başarılı: ${result.imported}, Hatalı: ${result.failed}`
        : `CSV processed. Imported: ${result.imported}, Failed: ${result.failed}`,
    );

    const refreshed = await fetch(`/api/metrics?reportingPeriodId=${rows[0]?.reportingPeriodId || ""}`);
    if (refreshed.ok) {
      const data = (await refreshed.json()) as Entry[];
      setRows(data.map((e) => ({ ...e, value: (e.value as unknown as string | null) || null })));
    }
  }

  function validateData() {
    const missingRequired = rows.filter((r) => r.metricDefinition.isRequired && (r.value === null || r.value === ""));
    const invalidUnits = rows.filter((r) => (r.unit || "").trim().toLowerCase() !== r.metricDefinition.unit.trim().toLowerCase());

    const parts: string[] = [];
    parts.push(
      locale === "tr"
        ? `Eksik zorunlu metrik: ${missingRequired.length}`
        : `Missing required metrics: ${missingRequired.length}`,
    );
    parts.push(locale === "tr" ? `Birim uyumsuzluğu: ${invalidUnits.length}` : `Unit mismatches: ${invalidUnits.length}`);
    setMessage(parts.join(" | "));
  }

  async function assignOwnersBulk() {
    if (!bulkOwnerId) {
      setMessage(locale === "tr" ? "Lütfen bir sorumlu seçin." : "Please select an owner.");
      return;
    }

    const patchedRows = rows.map((r) => ({ ...r, ownerUserId: bulkOwnerId }));
    setRows(patchedRows);

    const results = await Promise.all(
      patchedRows.map((row) =>
        fetch("/api/metrics", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: row.id,
            facilityId: row.facilityId,
            reportingPeriodId: row.reportingPeriodId,
            metricDefinitionId: row.metricDefinitionId,
            value: row.value ? Number(row.value) : null,
            unit: row.unit,
            status: row.status,
            ownerUserId: row.ownerUserId,
          }),
        }),
      ),
    );

    const okCount = results.filter((r) => r.ok).length;
    setMessage(
      locale === "tr"
        ? `Sorumlu atama tamamlandı: ${okCount}/${results.length}`
        : `Owner assignment complete: ${okCount}/${results.length}`,
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {locale === "tr"
          ? "Kanıtlar, raporlanan verinin güvenilirliğini destekler ve inceleme ile belgelendirme için gereklidir."
          : "Evidence supports the reliability of reported data and is required for review and certification."}
      </p>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={rows}
        columns={[
          { key: "facility", header: locale === "tr" ? "Tesis" : "Facility", render: (row) => row.facility.name },
          { key: "metric", header: locale === "tr" ? "Metrik" : "Metric", render: (row) => row.metricDefinition.name },
          {
            key: "value",
            header: locale === "tr" ? "Değer" : "Value",
            render: (row) => (
              <Input
                value={row.value || ""}
                onChange={(e) =>
                  setRows((prev) => prev.map((entry) => (entry.id === row.id ? { ...entry, value: e.target.value } : entry)))
                }
              />
            ),
          },
          { key: "unit", header: locale === "tr" ? "Birim" : "Unit", render: (row) => row.unit },
          {
            key: "status",
            header: locale === "tr" ? "Durum" : "Status",
            render: (row) => (
              <Select
                value={row.status}
                onChange={(value) =>
                  setRows((prev) => prev.map((entry) => (entry.id === row.id ? { ...entry, status: value as MetricEntryStatus } : entry)))
                }
                options={Object.values(MetricEntryStatus).map((s) => ({ label: s, value: s }))}
              />
            ),
          },
          {
            key: "owner",
            header: locale === "tr" ? "Sorumlu" : "Owner",
            render: (row) => (
              <Select
                value={row.ownerUserId || ""}
                onChange={(value) =>
                  setRows((prev) => prev.map((entry) => (entry.id === row.id ? { ...entry, ownerUserId: value || null } : entry)))
                }
                options={[
                  { label: locale === "tr" ? "Seçilmedi" : "Unassigned", value: "" },
                  ...users.map((u) => ({ label: `${u.name} (${u.email})`, value: u.id })),
                ]}
              />
            ),
          },
          { key: "statusLabel", header: locale === "tr" ? "Statü" : "State", render: (row) => <StatusBadge status={row.status} /> },
          {
            key: "evidence",
            header: locale === "tr" ? "Kanıt" : "Evidence",
            render: (row) => <EvidenceUploader linkedEntityType="METRIC_ENTRY" linkedEntityId={row.id} />,
          },
          {
            key: "actions",
            header: locale === "tr" ? "İşlemler" : "Actions",
            render: (row) => (
              <Button size="sm" onClick={() => updateEntry(row)}>
                {locale === "tr" ? "Kaydet" : "Save"}
              </Button>
            ),
          },
        ]}
      />

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadCsv(file);
          e.currentTarget.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          {locale === "tr" ? "Excel/CSV Yükle" : "Upload Excel/CSV"}
        </Button>
        <Button variant="outline" onClick={validateData}>
          {locale === "tr" ? "Veriyi Doğrula" : "Validate Data"}
        </Button>
        <Select
          value={bulkOwnerId}
          onChange={setBulkOwnerId}
          options={users.map((u) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
          className="w-[320px]"
        />
        <Button variant="outline" onClick={() => void assignOwnersBulk()}>
          {locale === "tr" ? "Sorumlu Ata (Toplu)" : "Assign Owners (Bulk)"}
        </Button>
      </div>
    </div>
  );
}
