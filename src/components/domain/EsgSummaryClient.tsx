"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

type EsgSummaryData = {
  legalName?: string | null;
  brandPortfolio?: string | null;
  naceCode?: string | null;
  sectorDescription?: string | null;
  operatingCountries?: string | null;
  totalEmployees?: number | null;
  employeeBlueCollar?: number | null;
  employeeWhiteCollar?: number | null;
  employeeMale?: number | null;
  employeeFemale?: number | null;
  employeePermanent?: number | null;
  employeeTemporary?: number | null;
  fiscalYearStart?: string | null;
  fiscalYearEnd?: string | null;
  annualRevenue?: number | null;
  ebitda?: number | null;
  netProfit?: number | null;
  totalAssets?: number | null;
  totalEquity?: number | null;
  sustainabilityCapexForecast?: number | null;
  sustainabilityGovernanceBody?: string | null;
  businessResilienceAssessment?: string | null;
  antiBriberyPolicyUpdated?: boolean | null;
  gdprKvkkPolicyUpdated?: boolean | null;
  annualElectricityConsumption?: number | null;
  annualNaturalGasConsumption?: number | null;
  annualFuelConsumption?: number | null;
  renewableEnergyPercent?: number | null;
  scope1Emissions?: number | null;
  scope2Emissions?: number | null;
  scope3Emissions?: number | null;
  annualWaterWithdrawal?: number | null;
  wasteRecyclingRate?: number | null;
  lostTimeInjuryRate?: number | null;
  avgTrainingHoursPerEmployee?: number | null;
  femaleManagerPercent?: number | null;
  supplierSocialAuditConducted?: boolean | null;
  employeeTurnoverRate?: number | null;
  climateRiskInRiskRegister?: boolean | null;
  rdExpenditure?: number | null;
  reportBoundaryNote?: string | null;
};

function toFormValue(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}

function toFormDate(v: string | null | undefined): string {
  if (!v) return "";
  return v.slice(0, 10);
}

export function EsgSummaryClient({ initial }: { initial: EsgSummaryData | null }) {
  const { locale } = useI18n();
  const tr = locale === "tr";

  const [form, setForm] = useState<EsgSummaryData>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function setStr(key: keyof EsgSummaryData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value || null }));
  }

  function setNum(key: keyof EsgSummaryData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value === "" ? null : Number(value) }));
  }

  function setBool(key: keyof EsgSummaryData, value: boolean | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/esg-summary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage({ ok: true, text: tr ? "ESG özet bilgileri kaydedildi." : "ESG summary data saved." });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ ok: false, text: err?.error ?? (tr ? "Kaydetme başarısız." : "Failed to save.") });
      }
    } catch {
      setMessage({ ok: false, text: tr ? "Bir hata oluştu." : "An error occurred." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-md px-4 py-2 text-sm ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* 1. Kurumsal Kimlik ve Operasyonel Yapı */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tr ? "1. Kurumsal Kimlik ve Operasyonel Yapı" : "1. Corporate Identity & Operational Structure"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>{tr ? "Resmi Şirket Unvanı" : "Legal Company Name"}</Label>
            <Input
              value={form.legalName ?? ""}
              onChange={(e) => setStr("legalName", e.target.value)}
              placeholder={tr ? "Şirketin yasal tam adı" : "Full legal name of the company"}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{tr ? "Marka Portföyü / Bağlı Ortaklıklar" : "Brand Portfolio / Subsidiaries"}</Label>
            <Textarea
              value={form.brandPortfolio ?? ""}
              onChange={(e) => setStr("brandPortfolio", e.target.value)}
              placeholder={tr ? "Ana markalar, alt markalar ve bağlı ortaklıklar" : "Main brands, sub-brands and subsidiaries"}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "NACE / ISIC Kodu" : "NACE / ISIC Code"}</Label>
            <Input
              value={form.naceCode ?? ""}
              onChange={(e) => setStr("naceCode", e.target.value)}
              placeholder="A01, C26.1, ..."
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Sektörel Tanımlama" : "Sector Description"}</Label>
            <Input
              value={form.sectorDescription ?? ""}
              onChange={(e) => setStr("sectorDescription", e.target.value)}
              placeholder={tr ? "Ana faaliyet kolu" : "Main line of activity"}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{tr ? "Operasyon Yürütülen Coğrafyalar" : "Operating Geographies"}</Label>
            <Textarea
              value={form.operatingCountries ?? ""}
              onChange={(e) => setStr("operatingCountries", e.target.value)}
              placeholder={tr ? "Hizmet/operasyon yürütülen tüm ülke ve bölgeler" : "All countries and regions where services/operations are conducted"}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Toplam Çalışan Sayısı" : "Total Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.totalEmployees)}
              onChange={(e) => setNum("totalEmployees", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Mavi Yaka Çalışan" : "Blue Collar Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.employeeBlueCollar)}
              onChange={(e) => setNum("employeeBlueCollar", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Beyaz Yaka Çalışan" : "White Collar Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.employeeWhiteCollar)}
              onChange={(e) => setNum("employeeWhiteCollar", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Erkek Çalışan" : "Male Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.employeeMale)}
              onChange={(e) => setNum("employeeMale", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Kadın Çalışan" : "Female Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.employeeFemale)}
              onChange={(e) => setNum("employeeFemale", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Daimi Çalışan" : "Permanent Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.employeePermanent)}
              onChange={(e) => setNum("employeePermanent", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Geçici / Sözleşmeli Çalışan" : "Temporary / Contract Employees"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.employeeTemporary)}
              onChange={(e) => setNum("employeeTemporary", e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{tr ? "Raporlama Sınırı Notu" : "Report Boundary Note"}</Label>
            <Textarea
              value={form.reportBoundaryNote ?? ""}
              onChange={(e) => setStr("reportBoundaryNote", e.target.value)}
              placeholder={tr ? "Tüm bağlı ortaklıklar raporlama kapsamına dahil mi? Açıklayın." : "Are all subsidiaries included in the reporting scope? Explain."}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Finansal Temeller */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tr ? "2. Finansal Temeller" : "2. Financial Foundations"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{tr ? "Finansal Yıl Başlangıç Tarihi" : "Fiscal Year Start Date"}</Label>
            <Input
              type="date"
              value={toFormDate(form.fiscalYearStart)}
              onChange={(e) => setStr("fiscalYearStart", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Finansal Yıl Bitiş Tarihi" : "Fiscal Year End Date"}</Label>
            <Input
              type="date"
              value={toFormDate(form.fiscalYearEnd)}
              onChange={(e) => setStr("fiscalYearEnd", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Toplam Ciro" : "Total Revenue"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.annualRevenue)}
              onChange={(e) => setNum("annualRevenue", e.target.value)}
              placeholder={tr ? "Raporlama para birimi cinsinden" : "In reporting currency"}
            />
          </div>
          <div className="space-y-1">
            <Label>EBITDA</Label>
            <Input
              type="number"
              value={toFormValue(form.ebitda)}
              onChange={(e) => setNum("ebitda", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Net Kâr" : "Net Profit"}</Label>
            <Input
              type="number"
              value={toFormValue(form.netProfit)}
              onChange={(e) => setNum("netProfit", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Toplam Varlık Değeri" : "Total Assets"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.totalAssets)}
              onChange={(e) => setNum("totalAssets", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Özkaynaklar" : "Total Equity"}</Label>
            <Input
              type="number"
              value={toFormValue(form.totalEquity)}
              onChange={(e) => setNum("totalEquity", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Sürdürülebilirlik CapEx Öngörüsü (3-5 yıl)" : "Sustainability CapEx Forecast (3-5 years)"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.sustainabilityCapexForecast)}
              onChange={(e) => setNum("sustainabilityCapexForecast", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Ar-Ge Harcaması" : "R&D Expenditure"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.rdExpenditure)}
              onChange={(e) => setNum("rdExpenditure", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Yönetişim ve Stratejik Yaklaşım */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tr ? "3. Yönetişim ve Stratejik Yaklaşım" : "3. Governance & Strategic Approach"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>{tr ? "Sürdürülebilirlikten Sorumlu Üst Yönetici / Komite" : "Sustainability Governance Body / Senior Executive"}</Label>
            <Input
              value={form.sustainabilityGovernanceBody ?? ""}
              onChange={(e) => setStr("sustainabilityGovernanceBody", e.target.value)}
              placeholder={tr ? "Örn. Sürdürülebilirlik Komitesi, CFO" : "e.g. Sustainability Committee, CFO"}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>{tr ? "İş Modeli Dayanıklılığı Değerlendirmesi" : "Business Resilience Assessment"}</Label>
            <Textarea
              value={form.businessResilienceAssessment ?? ""}
              onChange={(e) => setStr("businessResilienceAssessment", e.target.value)}
              placeholder={tr ? "İklim ve sosyal değişimlere karşı iş modelinizin dayanıklılığını açıklayın." : "Describe your business model's resilience against climate and social changes."}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Rüşvetle Mücadele / Etik Politikası Güncel mi?" : "Anti-Bribery / Ethics Policy Up to Date?"}</Label>
            <BoolSelect
              value={form.antiBriberyPolicyUpdated}
              onChange={(v) => setBool("antiBriberyPolicyUpdated", v)}
              locale={locale}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "GDPR / KVKK Veri Gizliliği Politikası Güncel mi?" : "GDPR / KVKK Data Privacy Policy Up to Date?"}</Label>
            <BoolSelect
              value={form.gdprKvkkPolicyUpdated}
              onChange={(v) => setBool("gdprKvkkPolicyUpdated", v)}
              locale={locale}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "İklim Riskleri Kurumsal Risk Siciline İşlendi mi?" : "Climate Risks Registered in Corporate Risk Register?"}</Label>
            <BoolSelect
              value={form.climateRiskInRiskRegister}
              onChange={(v) => setBool("climateRiskInRiskRegister", v)}
              locale={locale}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Çevresel ve İklimsel Veriler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tr ? "4. Çevresel ve İklimsel Veriler (IFRS S2)" : "4. Environmental & Climate Data (IFRS S2)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{tr ? "Yıllık Elektrik Tüketimi (MWh)" : "Annual Electricity Consumption (MWh)"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.annualElectricityConsumption)}
              onChange={(e) => setNum("annualElectricityConsumption", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Yıllık Doğalgaz Tüketimi (MWh)" : "Annual Natural Gas Consumption (MWh)"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.annualNaturalGasConsumption)}
              onChange={(e) => setNum("annualNaturalGasConsumption", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Yıllık Yakıt Tüketimi (MWh)" : "Annual Fuel Consumption (MWh)"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.annualFuelConsumption)}
              onChange={(e) => setNum("annualFuelConsumption", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Yenilenebilir Enerji Oranı (%)" : "Renewable Energy Share (%)"}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={toFormValue(form.renewableEnergyPercent)}
              onChange={(e) => setNum("renewableEnergyPercent", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Kapsam 1 Emisyonlar (tCO₂e) — Doğrudan" : "Scope 1 Emissions (tCO₂e) — Direct"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.scope1Emissions)}
              onChange={(e) => setNum("scope1Emissions", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Kapsam 2 Emisyonlar (tCO₂e) — Satın Alınan Enerji" : "Scope 2 Emissions (tCO₂e) — Purchased Energy"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.scope2Emissions)}
              onChange={(e) => setNum("scope2Emissions", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Kapsam 3 Emisyonlar (tCO₂e) — Dolaylı (Tedarik, Lojistik, Atık)" : "Scope 3 Emissions (tCO₂e) — Indirect"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.scope3Emissions)}
              onChange={(e) => setNum("scope3Emissions", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Yıllık Su Çekimi (m³)" : "Annual Water Withdrawal (m³)"}</Label>
            <Input
              type="number"
              min={0}
              value={toFormValue(form.annualWaterWithdrawal)}
              onChange={(e) => setNum("annualWaterWithdrawal", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Atık Geri Dönüşüm Oranı (%)" : "Waste Recycling Rate (%)"}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={toFormValue(form.wasteRecyclingRate)}
              onChange={(e) => setNum("wasteRecyclingRate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Sosyal ve Beşeri Sermaye */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tr ? "5. Sosyal ve Beşeri Sermaye" : "5. Social & Human Capital"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{tr ? "Kayıp Zamanlı Kaza Sıklık Oranı (LTI Frequency Rate)" : "Lost-Time Injury Frequency Rate (LTIFR)"}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={toFormValue(form.lostTimeInjuryRate)}
              onChange={(e) => setNum("lostTimeInjuryRate", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Çalışan Başına Yıllık Ortalama Eğitim Saati" : "Avg. Annual Training Hours per Employee"}</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={toFormValue(form.avgTrainingHoursPerEmployee)}
              onChange={(e) => setNum("avgTrainingHoursPerEmployee", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Yönetim Kademelerinde Kadın Yönetici Oranı (%)" : "Female Manager Ratio in Management (%)"}  </Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={toFormValue(form.femaleManagerPercent)}
              onChange={(e) => setNum("femaleManagerPercent", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Personel Devir Oranı / Turnover (%)" : "Employee Turnover Rate (%)"}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={toFormValue(form.employeeTurnoverRate)}
              onChange={(e) => setNum("employeeTurnoverRate", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{tr ? "Tedarikçi Sosyal Uygunluk Denetimi Yapılıyor mu?" : "Supplier Social Compliance Audits Conducted?"}</Label>
            <BoolSelect
              value={form.supplierSocialAuditConducted}
              onChange={(v) => setBool("supplierSocialAuditConducted", v)}
              locale={locale}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (tr ? "Kaydediliyor..." : "Saving...") : tr ? "ESG Özetini Kaydet" : "Save ESG Summary"}
        </Button>
      </div>
    </div>
  );
}

function BoolSelect({
  value,
  onChange,
  locale,
}: {
  value: boolean | null | undefined;
  onChange: (v: boolean | null) => void;
  locale: string;
}) {
  const tr = locale === "tr";
  return (
    <select
      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
      value={value == null ? "" : value ? "true" : "false"}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? null : v === "true");
      }}
    >
      <option value="">{tr ? "Seçiniz" : "Select"}</option>
      <option value="true">{tr ? "Evet" : "Yes"}</option>
      <option value="false">{tr ? "Hayır" : "No"}</option>
    </select>
  );
}
