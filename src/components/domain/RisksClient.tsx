"use client";

import { useState } from "react";
import { ClimateRiskType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/domain/DataTable";
import { RiskCard } from "@/components/domain/RiskCard";
import { useI18n } from "@/components/providers/LanguageProvider";

export function RisksClient({
  reportingPeriodId,
  facilities,
  users,
  risks,
}: {
  reportingPeriodId: string;
  facilities: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
  risks: Array<{
    id: string;
    name: string;
    type: ClimateRiskType;
    probability: string;
    impact: string;
    facility?: { name: string } | null;
    ownerUser?: { name: string } | null;
    mitigationPlan: string | null;
    scenarios: Array<{ id: string; scenarioName: string; temperaturePathway: string; estimatedRevenueImpactPercent: string | null }>;
  }>;
}) {
  const { locale } = useI18n();
  const [message, setMessage] = useState("");

  async function createRisk(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/risks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, reportingPeriodId }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Risk oluşturuldu. Güncel liste için sayfayı yenileyin."
          : "Risk created. Refresh to see latest list."
        : locale === "tr"
          ? "Risk oluşturma başarısız"
          : "Risk creation failed",
    );
  }

  async function addScenario(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Senaryo kaydedildi. Güncel liste için sayfayı yenileyin."
          : "Scenario saved. Refresh to see latest list."
        : locale === "tr"
          ? "Senaryo kaydetme başarısız"
          : "Scenario save failed",
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <DataTable
        data={risks}
        columns={[
          { key: "name", header: locale === "tr" ? "Risk" : "Risk", render: (row) => row.name },
          { key: "type", header: locale === "tr" ? "Tür" : "Type", render: (row) => row.type },
          { key: "probability", header: locale === "tr" ? "Olasılık" : "Probability", render: (row) => row.probability },
          { key: "impact", header: locale === "tr" ? "Etki" : "Impact", render: (row) => row.impact },
          { key: "owner", header: locale === "tr" ? "Sorumlu" : "Owner", render: (row) => row.ownerUser?.name || "-" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {risks.map((risk) => (
          <RiskCard
            key={risk.id}
            name={risk.name}
            type={risk.type}
            probability={risk.probability}
            impact={risk.impact}
            owner={risk.ownerUser?.name || undefined}
          />
        ))}
      </div>

      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void createRisk(new FormData(e.currentTarget));
        }}
      >
        <h3 className="col-span-full text-sm font-semibold">{locale === "tr" ? "İklim Riski Ekle" : "Add Climate Risk"}</h3>
        <Input name="name" placeholder={locale === "tr" ? "Risk adı" : "Risk name"} required />
        <select name="type" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          {Object.values(ClimateRiskType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Input name="probability" placeholder={locale === "tr" ? "Olasılık (Yüksek/Orta/Düşük)" : "Probability (High/Medium/Low)"} required />
        <Input name="impact" placeholder={locale === "tr" ? "Etki (Yüksek/Orta/Düşük)" : "Impact (High/Medium/Low)"} required />
        <select name="facilityId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">{locale === "tr" ? "Tesis yok" : "No facility"}</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select name="ownerUserId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">{locale === "tr" ? "Sorumlu yok" : "No owner"}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Input type="number" name="financialImpactEstimate" placeholder={locale === "tr" ? "Finansal etki tahmini" : "Financial impact estimate"} />
        <Textarea name="mitigationPlan" placeholder={locale === "tr" ? "Azaltım planı" : "Mitigation plan"} />
        <Button type="submit">{locale === "tr" ? "Risk Ekle" : "Add Risk"}</Button>
      </form>

      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void addScenario(new FormData(e.currentTarget));
        }}
      >
        <h3 className="col-span-full text-sm font-semibold">{locale === "tr" ? "Senaryo Analizi Ekle" : "Add Scenario Analysis"}</h3>
        <select name="climateRiskId" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          {risks.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Input name="scenarioName" defaultValue={locale === "tr" ? "2C senaryosu" : "2C scenario"} />
        <select name="temperaturePathway" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="1.5C">{locale === "tr" ? "1.5C senaryosu" : "1.5C scenario"}</option>
          <option value="2C">{locale === "tr" ? "2C senaryosu" : "2C scenario"}</option>
          <option value="4C">{locale === "tr" ? "4C senaryosu" : "4C scenario"}</option>
        </select>
        <Input type="number" step="0.1" name="estimatedRevenueImpactPercent" placeholder={locale === "tr" ? "Gelir etkisi %" : "Revenue impact %"} />
        <Input type="number" step="0.01" name="estimatedCostImpact" placeholder={locale === "tr" ? "Maliyet etkisi" : "Cost impact"} />
        <Textarea name="qualitativeImpact" placeholder={locale === "tr" ? "Nitel etki" : "Qualitative impact"} />
        <Textarea name="assumptions" placeholder={locale === "tr" ? "Varsayımlar" : "Assumptions"} />
        <Button type="submit">{locale === "tr" ? "Senaryoyu Kaydet" : "Save Scenario"}</Button>
      </form>
    </div>
  );
}
