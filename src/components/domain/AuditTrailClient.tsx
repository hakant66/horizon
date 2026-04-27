"use client";

import { format } from "date-fns";
import { AuditTimeline } from "@/components/domain/AuditTimeline";
import { DataTable } from "@/components/domain/DataTable";
import { useI18n } from "@/components/providers/LanguageProvider";

type LogRow = {
  id: string;
  createdAt: string;
  user: { name: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeValueJson: unknown;
  afterValueJson: unknown;
};

export function AuditTrailClient({ logs }: { logs: LogRow[] }) {
  const { locale } = useI18n();

  return (
    <>
      <DataTable
        data={logs}
        columns={[
          { key: "time", header: locale === "tr" ? "Zaman" : "Time", render: (row) => format(new Date(row.createdAt), "yyyy-MM-dd HH:mm:ss") },
          { key: "user", header: locale === "tr" ? "Kullanıcı" : "User", render: (row) => row.user?.name || (locale === "tr" ? "Sistem" : "System") },
          { key: "action", header: locale === "tr" ? "İşlem" : "Action", render: (row) => row.action },
          { key: "entity", header: locale === "tr" ? "Varlık" : "Entity", render: (row) => `${row.entityType}:${row.entityId}` },
          { key: "before", header: locale === "tr" ? "Önce" : "Before", render: (row) => (row.beforeValueJson ? JSON.stringify(row.beforeValueJson) : "-") },
          { key: "after", header: locale === "tr" ? "Sonra" : "After", render: (row) => (row.afterValueJson ? JSON.stringify(row.afterValueJson) : "-") },
        ]}
      />

      <AuditTimeline
        items={logs.slice(0, 20).map((log) => ({
          id: log.id,
          timestamp: format(new Date(log.createdAt), "HH:mm"),
          text: `${log.user?.name || (locale === "tr" ? "Sistem" : "System")} ${log.action.toLowerCase().replaceAll("_", " ")}`,
        }))}
      />
    </>
  );
}
