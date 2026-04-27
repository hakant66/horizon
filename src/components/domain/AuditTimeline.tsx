"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

export function AuditTimeline({
  items,
}: {
  items: { id: string; timestamp: string; text: string }[];
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === "tr" ? "Aktivite Kaydı" : "Activity Log"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="text-sm text-slate-700">
              <span className="font-medium">{item.timestamp}</span> - {item.text}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
