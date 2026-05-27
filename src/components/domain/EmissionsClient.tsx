"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculationDetailsCard } from "@/components/domain/CalculationDetailsCard";
import { EvidenceUploader } from "@/components/domain/EvidenceUploader";
import { MetricCard } from "@/components/domain/MetricCard";
import { useI18n } from "@/components/providers/LanguageProvider";

type Calc = {
  id: string;
  metricEntryId: string;
  activityValue: string;
  activityUnit: string;
  factorValue: string;
  resultTCO2e: string;
  calculationFormula: string;
  scope3Category?: string | null;
  emissionFactor: { id: string; name: string; source: string; versionYear: number; scope: string; category: string };
  metricEntry: {
    metricDefinition: { name: string; code: string };
    facility: { name: string };
  };
};

type MetricSeed = {
  id: string;
  metricDefinition: { name: string; code: string; category: string };
  value: string | null;
};

// ─── Scope explanations ───────────────────────────────────────────────────────
const SCOPE_INFO = {
  tr: {
    s1: {
      title: "Kapsam 1 — Doğrudan Emisyonlar",
      description:
        "Şirketin sahip olduğu veya doğrudan kontrol ettiği kaynaklardan atmosfere salınan seragazlarıdır. Başlıca kaynaklar: şirkete ait araçların yaktığı yakıt (dizel, benzin, LPG), tesislerdeki doğalgaz kazanları, fırınlar ve endüstriyel süreç emisyonlarıdır.",
      formula: "Faaliyet Değeri × Emisyon Faktörü ÷ 1000 = tCO₂e",
      example: "Örnek: 1.000 litre dizel × 2,68 kgCO₂e/L ÷ 1.000 = 2,68 tCO₂e",
      standard: "GHG Protokolü: Kapsam 1 | IFRS S2: Parametre 40(a)(i)",
      color: "border-orange-300 bg-orange-50",
      badge: "bg-orange-100 text-orange-800",
    },
    s2: {
      title: "Kapsam 2 — Satın Alınan Enerji Kaynaklı Dolaylı Emisyonlar",
      description:
        "Şirketin dışarıdan satın aldığı elektrik, ısı veya buharın üretimi sırasında oluşan ve şirketin faaliyeti nedeniyle gerçekleşen seragazı emisyonlarıdır. Şirkette fiziksel bir baca olmaz; emisyonlar elektrik santralinde veya ısı merkezinde oluşur.",
      formula: "Faaliyet Değeri (kWh) × Şebeke Faktörü (kgCO₂e/kWh) ÷ 1000 = tCO₂e",
      example: "Örnek: 10.000 kWh elektrik × 0,43 kgCO₂e/kWh ÷ 1.000 = 4,3 tCO₂e",
      standard: "GHG Protokolü: Kapsam 2 — Konum Bazlı Yöntem | IFRS S2: Parametre 40(a)(ii)",
      color: "border-blue-300 bg-blue-50",
      badge: "bg-blue-100 text-blue-800",
    },
    s3: {
      title: "Kapsam 3 — Değer Zinciri Dolaylı Emisyonları",
      description:
        "Şirketin faaliyetleriyle bağlantılı ancak doğrudan kontrolü dışındaki tüm dolaylı emisyonlardır. GHG Protokolü bu emisyonları 15 kategoriye ayırır: tedarikçiden satın alınan mallarda gömülü karbon (Kat.1), şirketin attığı atıklar (Kat.5), çalışanların işe gidip gelişi (Kat.7) ve satılan ürünlerin tüketici tarafından kullanımı (Kat.11) bunların başlıcalarıdır.",
      formula: "Faaliyet Değeri × Emisyon Faktörü ÷ 1000 = tCO₂e",
      example: "Örnek (iş seyahati): 5.000 km uçuş × 0,255 kgCO₂e/km ÷ 1.000 = 1,275 tCO₂e",
      standard: "GHG Protokolü: Kapsam 3 Standardı (2011) | IFRS S2: Parametre 40(a)(iii) | ESRS E1-6",
      color: "border-purple-300 bg-purple-50",
      badge: "bg-purple-100 text-purple-800",
    },
  },
  en: {
    s1: {
      title: "Scope 1 — Direct Emissions",
      description:
        "Greenhouse gas emissions released directly from sources owned or controlled by the company. Key sources include combustion of fuel in company vehicles (diesel, petrol, LPG), natural gas boilers and furnaces at facilities, and industrial process emissions.",
      formula: "Activity Value × Emission Factor ÷ 1000 = tCO₂e",
      example: "Example: 1,000 litres diesel × 2.68 kgCO₂e/L ÷ 1,000 = 2.68 tCO₂e",
      standard: "GHG Protocol: Scope 1 | IFRS S2: Para. 40(a)(i)",
      color: "border-orange-300 bg-orange-50",
      badge: "bg-orange-100 text-orange-800",
    },
    s2: {
      title: "Scope 2 — Purchased Energy Indirect Emissions",
      description:
        "Indirect greenhouse gas emissions resulting from the generation of purchased electricity, heat, or steam consumed by the company. The company has no physical chimney; emissions occur at the power plant or heat station.",
      formula: "Activity Value (kWh) × Grid Factor (kgCO₂e/kWh) ÷ 1000 = tCO₂e",
      example: "Example: 10,000 kWh electricity × 0.43 kgCO₂e/kWh ÷ 1,000 = 4.3 tCO₂e",
      standard: "GHG Protocol: Scope 2 — Location-Based | IFRS S2: Para. 40(a)(ii)",
      color: "border-blue-300 bg-blue-50",
      badge: "bg-blue-100 text-blue-800",
    },
    s3: {
      title: "Scope 3 — Value Chain Indirect Emissions",
      description:
        "All indirect emissions linked to the company's activities but outside its direct control. GHG Protocol divides these into 15 categories: carbon embedded in purchased goods from suppliers (Cat.1), operational waste (Cat.5), employee commuting (Cat.7), and consumer use of sold products (Cat.11) are among the most significant.",
      formula: "Activity Value × Emission Factor ÷ 1000 = tCO₂e",
      example: "Example (business travel): 5,000 km flight × 0.255 kgCO₂e/km ÷ 1,000 = 1.275 tCO₂e",
      standard: "GHG Protocol: Scope 3 Standard (2011) | IFRS S2: Para. 40(a)(iii) | ESRS E1-6",
      color: "border-purple-300 bg-purple-50",
      badge: "bg-purple-100 text-purple-800",
    },
  },
};

// Maps metric.code → which scope section it belongs to
const SCOPE3_CODES = new Set([
  "s3_purchased_goods_spend", "s3_fuel_energy_related", "s3_upstream_logistics_tkm",
  "s3_waste_to_landfill", "s3_waste_incinerated", "s3_business_travel_air_short",
  "s3_business_travel_air_long", "s3_business_travel_rail", "s3_business_travel_car",
  "s3_employee_commute_car", "s3_employee_commute_transit", "s3_downstream_logistics_tkm",
  "s3_product_energy_use_kwh",
]);

const SCOPE1_CODES = new Set(["natural_gas_consumption", "diesel_consumption", "petrol_consumption", "lpg_consumption", "fuel_oil_consumption"]);

function ScopeExplanationCard({ info, locale }: { info: (typeof SCOPE_INFO)["tr"]["s1"]; locale: string }) {
  const [open, setOpen] = useState(false);
  const tr = locale === "tr";
  return (
    <div className={`rounded-lg border-2 p-4 ${info.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{info.title}</h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{info.description}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          {open ? (tr ? "Gizle" : "Hide") : (tr ? "Formül" : "Formula")}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-1 rounded-md bg-white/70 p-3 text-xs">
          <p><span className="font-semibold">{tr ? "Formül:" : "Formula:"}</span> <code className="font-mono">{info.formula}</code></p>
          <p><span className="font-semibold">{tr ? "Örnek:" : "Example:"}</span> {info.example}</p>
          <p><span className="font-semibold">{tr ? "Standart:" : "Standard:"}</span> <span className="text-slate-500">{info.standard}</span></p>
        </div>
      )}
    </div>
  );
}

function ScopeTable({ calcs, locale, onSelect }: { calcs: Calc[]; locale: string; onSelect: (c: Calc) => void }) {
  const tr = locale === "tr";
  if (calcs.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">{tr ? "Bu kapsam için henüz hesaplama yok." : "No calculations yet for this scope."}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left">{tr ? "Tesis" : "Facility"}</th>
            <th className="px-3 py-2 text-left">{tr ? "Metrik" : "Metric"}</th>
            <th className="px-3 py-2 text-left">{tr ? "Kategori" : "Category"}</th>
            <th className="px-3 py-2 text-right">{tr ? "Aktivite" : "Activity"}</th>
            <th className="px-3 py-2 text-right">{tr ? "Faktör" : "Factor"}</th>
            <th className="px-3 py-2 text-right">{tr ? "Sonuç" : "Result"}</th>
            <th className="px-3 py-2 text-left">{tr ? "Formül" : "Formula"}</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {calcs.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-700">{row.metricEntry.facility.name}</td>
              <td className="px-3 py-2 text-slate-700">{row.metricEntry.metricDefinition.name}</td>
              <td className="px-3 py-2 text-slate-500 text-xs">{row.scope3Category ?? row.emissionFactor.category}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.activityValue} {row.activityUnit}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500 text-xs">{row.factorValue}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">{Number(row.resultTCO2e).toFixed(4)} tCO₂e</td>
              <td className="px-3 py-2 font-mono text-xs text-slate-400">{row.calculationFormula}</td>
              <td className="px-3 py-2">
                <Button size="sm" variant="outline" onClick={() => onSelect(row)}>
                  {tr ? "Detay" : "Detail"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50">
          <tr>
            <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-slate-600">
              {tr ? "Alt Toplam" : "Subtotal"}
            </td>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-800">
              {calcs.reduce((s, c) => s + Number(c.resultTCO2e), 0).toFixed(4)} tCO₂e
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function EmissionsClient({
  reportingPeriodId,
  calculations,
  metricsForRecalc,
}: {
  reportingPeriodId: string;
  calculations: Calc[];
  metricsForRecalc: MetricSeed[];
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";
  const lang = tr ? "tr" : "en";

  const [selected, setSelected] = useState<Calc | null>(null);
  const [metricId, setMetricId] = useState(metricsForRecalc[0]?.id || "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [calculating, setCalculating] = useState(false);

  const scope1Calcs = calculations.filter((c) => c.emissionFactor.scope === "SCOPE_1");
  const scope2Calcs = calculations.filter((c) => c.emissionFactor.scope === "SCOPE_2");
  const scope3Calcs = calculations.filter((c) => c.emissionFactor.scope === "SCOPE_3");

  const scope1Total = scope1Calcs.reduce((s, c) => s + Number(c.resultTCO2e), 0);
  const scope2Total = scope2Calcs.reduce((s, c) => s + Number(c.resultTCO2e), 0);
  const scope3Total = scope3Calcs.reduce((s, c) => s + Number(c.resultTCO2e), 0);
  const grandTotal = scope1Total + scope2Total + scope3Total;

  // Group metrics for recalc by scope
  const scope1Metrics = metricsForRecalc.filter((m) => SCOPE1_CODES.has(m.metricDefinition.code));
  const scope2Metrics = metricsForRecalc.filter((m) => m.metricDefinition.code === "electricity_consumption" || m.metricDefinition.code === "district_heat_consumption");
  const scope3Metrics = metricsForRecalc.filter((m) => SCOPE3_CODES.has(m.metricDefinition.code));

  async function recalculate() {
    if (!metricId || calculating) return;
    setCalculating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/emissions/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricEntryId: metricId }),
      });
      if (res.ok) {
        setMessage({ ok: true, text: tr ? "Yeniden hesaplama tamamlandı. Güncel sonuçlar için sayfayı yenileyin." : "Recalculation completed. Refresh for latest results." });
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setMessage({ ok: false, text: err.error ?? (tr ? "Hesaplama başarısız." : "Calculation failed.") });
      }
    } finally {
      setCalculating(false);
    }
  }

  const info = SCOPE_INFO[lang];

  return (
    <div className="space-y-6">

      {/* ── Genel Bilgi ── */}
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-700 mb-1">{tr ? "GHG Protokolü Emisyon Kapsamları" : "GHG Protocol Emission Scopes"}</p>
        <p>
          {tr
            ? "Seragazı emisyonları üç kapsama ayrılır. Kapsam 1 ve 2 zorunlu raporlama kapsamındadır; Kapsam 3 ise değer zincirini kapsar ve IFRS S2/ESRS E1 kapsamında giderek daha fazla zorunlu hale gelmektedir."
            : "Greenhouse gas emissions are classified into three scopes. Scopes 1 and 2 are mandatory; Scope 3 covers the value chain and is increasingly required under IFRS S2 and ESRS E1."}
        </p>
        <p className="mt-1 text-xs text-amber-700">
          ⚠ {tr ? "Aşağıdaki emisyon katsayıları demo amaçlıdır. Gerçek raporlama öncesinde doğrulanmış resmi kaynaklarla değiştirilmelidir." : "Emission factors shown are demo/placeholder values and must be replaced with verified official sources before production reporting."}
        </p>
      </div>

      {/* ── Özet Kartlar ── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MetricCard title={tr ? "Toplam (1+2+3)" : "Total (1+2+3)"} value={`${grandTotal.toFixed(2)} tCO₂e`} />
        <MetricCard title={tr ? "Kapsam 1 — Doğrudan" : "Scope 1 — Direct"} value={`${scope1Total.toFixed(2)} tCO₂e`} />
        <MetricCard title={tr ? "Kapsam 2 — Satın Alınan Enerji" : "Scope 2 — Purchased Energy"} value={`${scope2Total.toFixed(2)} tCO₂e`} />
        <MetricCard title={tr ? "Kapsam 3 — Değer Zinciri" : "Scope 3 — Value Chain"} value={`${scope3Total.toFixed(2)} tCO₂e`} />
      </div>

      {/* ── Hesaplama Tetikleyici ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{tr ? "Emisyon Hesapla / Yeniden Hesapla" : "Calculate / Recalculate Emission"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            {tr
              ? "Aşağıdan bir metrik girişi seçin ve hesapla butonuna basın. Sistem, ilgili emisyon katsayısını otomatik seçerek tCO₂e değerini hesaplar ve kaydeder."
              : "Select a metric entry below and press Calculate. The system will auto-select the matching emission factor and compute tCO₂e."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 max-w-xs rounded-md border border-slate-300 px-3 text-sm"
              value={metricId}
              onChange={(e) => setMetricId(e.target.value)}
            >
              {scope1Metrics.length > 0 && (
                <optgroup label={tr ? "Kapsam 1 — Doğrudan" : "Scope 1 — Direct"}>
                  {scope1Metrics.map((m) => (
                    <option key={m.id} value={m.id}>{m.metricDefinition.name} {m.value ? `(${m.value})` : "(—)"}</option>
                  ))}
                </optgroup>
              )}
              {scope2Metrics.length > 0 && (
                <optgroup label={tr ? "Kapsam 2 — Satın Alınan Enerji" : "Scope 2 — Purchased Energy"}>
                  {scope2Metrics.map((m) => (
                    <option key={m.id} value={m.id}>{m.metricDefinition.name} {m.value ? `(${m.value})` : "(—)"}</option>
                  ))}
                </optgroup>
              )}
              {scope3Metrics.length > 0 && (
                <optgroup label={tr ? "Kapsam 3 — Değer Zinciri" : "Scope 3 — Value Chain"}>
                  {scope3Metrics.map((m) => (
                    <option key={m.id} value={m.id}>{m.metricDefinition.name} {m.value ? `(${m.value})` : "(—)"}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <Button onClick={recalculate} disabled={calculating || !metricId}>
              {calculating ? (tr ? "Hesaplanıyor…" : "Calculating…") : (tr ? "Hesapla" : "Calculate")}
            </Button>
          </div>
          {message && (
            <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>
          )}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const a = document.createElement("a");
                a.href = `/api/export/emissions?reportingPeriodId=${reportingPeriodId}`;
                a.download = "emissions.csv";
                a.click();
              }}
            >
              {tr ? "CSV İndir" : "Export CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Kapsam 1 Bölümü ── */}
      <div className="space-y-3">
        <ScopeExplanationCard info={info.s1} locale={locale} />
        <ScopeTable calcs={scope1Calcs} locale={locale} onSelect={setSelected} />
      </div>

      {/* ── Kapsam 2 Bölümü ── */}
      <div className="space-y-3">
        <ScopeExplanationCard info={info.s2} locale={locale} />
        <ScopeTable calcs={scope2Calcs} locale={locale} onSelect={setSelected} />
      </div>

      {/* ── Kapsam 3 Bölümü ── */}
      <div className="space-y-3">
        <ScopeExplanationCard info={info.s3} locale={locale} />

        {/* Kapsam 3 Kategori Rehberi */}
        <div className="rounded-md border border-purple-200 bg-purple-50 px-4 py-3 text-xs text-purple-800">
          <p className="mb-2 font-semibold">{tr ? "GHG Protokolü Kapsam 3 Kategorileri — Sistem Kapsamı" : "GHG Protocol Scope 3 Categories — System Coverage"}</p>
          <div className="grid gap-1 md:grid-cols-2">
            {[
              { cat: "Kat.1 / Cat.1", tr: "Satın Alınan Mal & Hizmetler (harcama bazlı)", en: "Purchased Goods & Services (spend-based)", ok: true },
              { cat: "Kat.3 / Cat.3", tr: "Yakıt & Enerji (iletim kayıpları)", en: "Fuel & Energy Related (T&D losses)", ok: true },
              { cat: "Kat.4 / Cat.4", tr: "Upstream Lojistik (ton-km)", en: "Upstream Logistics (ton-km)", ok: true },
              { cat: "Kat.5 / Cat.5", tr: "Operasyon Atığı (depolama, yakma)", en: "Waste in Operations (landfill, incineration)", ok: true },
              { cat: "Kat.6 / Cat.6", tr: "İş Seyahati (uçak, tren, araç)", en: "Business Travel (air, rail, car)", ok: true },
              { cat: "Kat.7 / Cat.7", tr: "Çalışan Ulaşımı (araç, toplu taşıma)", en: "Employee Commuting (car, transit)", ok: true },
              { cat: "Kat.9 / Cat.9", tr: "Downstream Lojistik (ton-km)", en: "Downstream Logistics (ton-km)", ok: true },
              { cat: "Kat.11 / Cat.11", tr: "Satılan Ürün Kullanımı", en: "Use of Sold Products", ok: true },
              { cat: "Kat.2 / Cat.2", tr: "Sermaye Malları — kapsam dışı", en: "Capital Goods — not covered", ok: false },
              { cat: "Kat.8 / Cat.8", tr: "Upstream Kiralık Varlıklar — kapsam dışı", en: "Upstream Leased Assets — not covered", ok: false },
              { cat: "Kat.10 / Cat.10", tr: "Ürün İşleme — kapsam dışı", en: "Processing of Sold Products — not covered", ok: false },
              { cat: "Kat.12-15", tr: "Diğer downstream — kapsam dışı", en: "Other downstream — not covered", ok: false },
            ].map((item) => (
              <div key={item.cat} className="flex items-start gap-1.5">
                <span className={`mt-0.5 text-base leading-none ${item.ok ? "text-green-600" : "text-slate-400"}`}>{item.ok ? "✓" : "○"}</span>
                <span>
                  <span className="font-medium">{item.cat}:</span>{" "}
                  <span className={item.ok ? "" : "text-purple-600/50"}>{tr ? item.tr : item.en}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <ScopeTable calcs={scope3Calcs} locale={locale} onSelect={setSelected} />
      </div>

      {/* ── Seçili Hesaplama Detay Paneli ── */}
      {selected && (
        <div className="grid gap-4 md:grid-cols-2">
          <CalculationDetailsCard
            activity={`${selected.activityValue} ${selected.activityUnit}`}
            factor={selected.factorValue}
            formula={selected.calculationFormula}
            result={`${selected.resultTCO2e} tCO₂e`}
            source={selected.emissionFactor.source}
            version={String(selected.emissionFactor.versionYear)}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
            {selected.scope3Category && (
              <p className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                {selected.scope3Category}
              </p>
            )}
            <h3 className="text-sm font-semibold">{tr ? "Kanıt Ekle" : "Attach Evidence"}</h3>
            <EvidenceUploader linkedEntityType="EMISSION_CALCULATION" linkedEntityId={selected.id} />
          </div>
        </div>
      )}
    </div>
  );
}
