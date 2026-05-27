"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/domain/DataTable";
import { Stepper } from "@/components/domain/Stepper";
import { useI18n } from "@/components/providers/LanguageProvider";
import {
  SASB_MACRO_SECTORS,
  ALL_SASB_SUBSECTORS,
  REPORTING_FRAMEWORKS,
  naceToSasb,
  determineCsrdScope,
} from "@/lib/sector-mappings";

type OrgForm = {
  name: string;
  taxId: string;
  sector: string;
  naceCode: string;
  naceDescription: string;
  sasbSector: string;
  csrdSector: string;
  reportingFrameworks: string[];
  employeeCount: string;
  annualTurnoverEurM: string;
  totalAssetsEurM: string;
  isPublicInterestEntity: boolean;
  headquartersCountry: string;
  reportingCurrency: string;
};

export function SetupWizardClient({
  organization,
  facilities,
  users,
}: {
  organization: {
    name: string;
    taxId: string | null;
    sector: string;
    naceCode?: string | null;
    naceDescription?: string | null;
    sasbSector?: string | null;
    csrdSector?: string | null;
    reportingFrameworks?: string[];
    employeeCount?: number | null;
    annualTurnoverEurM?: number | null;
    totalAssetsEurM?: number | null;
    isPublicInterestEntity?: boolean | null;
    headquartersCountry: string;
    reportingCurrency: string;
  };
  facilities: Array<{ id: string; name: string; country: string; city: string | null; facilityType: string }>;
  users: Array<{ id: string; name: string; email: string; role: UserRole }>;
}) {
  const { locale } = useI18n();
  const tr = locale === "tr";

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [facilityRows, setFacilityRows] = useState(facilities);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [periods, setPeriods] = useState<Array<{ id: string; name: string; status: string }>>([]);

  useEffect(() => {
    if (step === 4) void loadPeriods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const [orgForm, setOrgForm] = useState<OrgForm>({
    name: organization.name,
    taxId: organization.taxId || "",
    sector: organization.sector,
    naceCode: organization.naceCode || "",
    naceDescription: organization.naceDescription || "",
    sasbSector: organization.sasbSector || "",
    csrdSector: organization.csrdSector || "",
    reportingFrameworks: organization.reportingFrameworks ?? [],
    employeeCount: organization.employeeCount != null ? String(organization.employeeCount) : "",
    annualTurnoverEurM: organization.annualTurnoverEurM != null ? String(organization.annualTurnoverEurM) : "",
    totalAssetsEurM: organization.totalAssetsEurM != null ? String(organization.totalAssetsEurM) : "",
    isPublicInterestEntity: organization.isPublicInterestEntity ?? false,
    headquartersCountry: organization.headquartersCountry,
    reportingCurrency: organization.reportingCurrency,
  });

  // Derive selected macro sector for subsector filtering
  const selectedMacro = ALL_SASB_SUBSECTORS.find((s) => s.sics === orgForm.sasbSector)?.macro ?? "";

  // Auto-map NACE → SASB when NACE code changes
  function handleNaceChange(value: string) {
    const mapped = naceToSasb(value);
    const subsector = mapped ? ALL_SASB_SUBSECTORS.find((s) => s.sics === mapped) : null;
    setOrgForm((prev) => ({
      ...prev,
      naceCode: value,
      sasbSector: mapped ?? prev.sasbSector,
      csrdSector: subsector
        ? tr
          ? subsector.label_tr
          : subsector.label_en
        : prev.csrdSector,
    }));
  }

  function handleSasbChange(sics: string) {
    const subsector = ALL_SASB_SUBSECTORS.find((s) => s.sics === sics);
    setOrgForm((prev) => ({
      ...prev,
      sasbSector: sics,
      csrdSector: subsector ? (tr ? subsector.label_tr : subsector.label_en) : prev.csrdSector,
      sector: subsector
        ? SASB_MACRO_SECTORS.find((m) => m.key === subsector.macro)?.[tr ? "label_tr" : "label_en"] ?? prev.sector
        : prev.sector,
    }));
  }

  function toggleFramework(fw: string) {
    setOrgForm((prev) => ({
      ...prev,
      reportingFrameworks: prev.reportingFrameworks.includes(fw)
        ? prev.reportingFrameworks.filter((f) => f !== fw)
        : [...prev.reportingFrameworks, fw],
    }));
  }

  const csrdScope = determineCsrdScope({
    employees: orgForm.employeeCount ? Number(orgForm.employeeCount) : null,
    turnoverEurM: orgForm.annualTurnoverEurM ? Number(orgForm.annualTurnoverEurM) : null,
    assetsEurM: orgForm.totalAssetsEurM ? Number(orgForm.totalAssetsEurM) : null,
    isPublicInterestEntity: orgForm.isPublicInterestEntity,
  });

  async function fillFromAI() {
    setAiLoading(true);
    setAiMsg("");
    try {
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "setup" }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setAiMsg(err.error ?? (tr ? "AI doldurulamadı" : "AI fill failed"));
        return;
      }
      const data = (await res.json()) as { fields: Record<string, unknown> };
      const f = data.fields;
      setOrgForm((prev) => ({
        ...prev,
        ...(typeof f.name === "string" ? { name: f.name } : {}),
        ...(typeof f.taxId === "string" ? { taxId: f.taxId } : {}),
        ...(typeof f.sector === "string" ? { sector: f.sector } : {}),
        ...(typeof f.naceCode === "string" ? { naceCode: f.naceCode } : {}),
        ...(typeof f.naceDescription === "string" ? { naceDescription: f.naceDescription } : {}),
        ...(typeof f.employeeCount === "number" ? { employeeCount: String(f.employeeCount) } : {}),
        ...(typeof f.headquartersCountry === "string" ? { headquartersCountry: f.headquartersCountry } : {}),
        ...(typeof f.reportingCurrency === "string" ? { reportingCurrency: f.reportingCurrency } : {}),
      }));
      setAiMsg(tr ? "Alanlar AI ile dolduruldu. Lütfen kontrol edip kaydedin." : "Fields filled by AI. Please review and save.");
    } catch {
      setAiMsg(tr ? "AI servisine ulaşılamadı" : "Could not reach AI service");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveOrg() {
    const res = await fetch("/api/organization", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orgForm,
        taxId: orgForm.taxId || null,
        naceCode: orgForm.naceCode || null,
        naceDescription: orgForm.naceDescription || null,
        sasbSector: orgForm.sasbSector || null,
        csrdSector: orgForm.csrdSector || null,
        employeeCount: orgForm.employeeCount ? Number(orgForm.employeeCount) : null,
        annualTurnoverEurM: orgForm.annualTurnoverEurM ? Number(orgForm.annualTurnoverEurM) : null,
        totalAssetsEurM: orgForm.totalAssetsEurM ? Number(orgForm.totalAssetsEurM) : null,
      }),
    });
    setMessage(
      res.ok
        ? tr ? "Organizasyon kaydedildi" : "Organization saved"
        : tr ? "Organizasyon kaydedilemedi" : "Failed to save organization",
    );
  }

  async function addFacility(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = (await res.json()) as (typeof facilities)[number];
      setFacilityRows((prev) => [...prev, created]);
    }
    setMessage(res.ok ? (tr ? "Tesis eklendi" : "Facility added") : tr ? "Tesis oluşturulamadı" : "Facility creation failed");
  }

  async function editFacility(row: (typeof facilities)[number]) {
    const nextName = window.prompt(tr ? "Tesis adı" : "Facility name", row.name);
    if (!nextName) return;
    const nextCountry = window.prompt(tr ? "Ülke" : "Country", row.country);
    if (!nextCountry) return;
    const nextCity = window.prompt(tr ? "Şehir" : "City", row.city || "") || null;
    const nextType = window.prompt(tr ? "Tesis tipi" : "Facility type", row.facilityType);
    if (!nextType) return;

    const res = await fetch("/api/facilities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, name: nextName, country: nextCountry, city: nextCity, facilityType: nextType }),
    });
    if (res.ok) {
      const updated = (await res.json()) as (typeof facilities)[number];
      setFacilityRows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }
    setMessage(res.ok ? (tr ? "Tesis güncellendi" : "Facility updated") : tr ? "Tesis güncellenemedi" : "Facility update failed");
  }

  async function deleteFacility(id: string) {
    const ok = window.confirm(tr ? "Bu tesisi silmek istiyor musunuz?" : "Delete this facility?");
    if (!ok) return;
    const res = await fetch("/api/facilities", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setFacilityRows((prev) => prev.filter((f) => f.id !== id));
    setMessage(res.ok ? (tr ? "Tesis silindi" : "Facility deleted") : tr ? "Tesis silinemedi" : "Facility delete failed");
  }

  async function addUser(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setMessage(
      res.ok
        ? tr ? "Kullanıcı eklendi, güncel liste için sayfayı yenileyin" : "User added, refresh page to see latest list"
        : tr ? "Kullanıcı oluşturulamadı" : "User creation failed",
    );
  }

  async function addPeriod(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/reporting-periods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setMessage(res.ok ? (tr ? "Raporlama dönemi oluşturuldu" : "Reporting period created") : tr ? "Raporlama dönemi oluşturulamadı" : "Reporting period creation failed");
    if (res.ok) void loadPeriods();
  }

  async function loadPeriods() {
    const res = await fetch("/api/reporting-periods");
    if (res.ok) {
      const data = await res.json() as Array<{ id: string; name: string; status: string }>;
      setPeriods(data);
    }
  }

  async function lockPeriod(id: string) {
    const res = await fetch(`/api/reporting-periods/${id}/lock`, { method: "POST" });
    setMessage(res.ok ? (tr ? "Dönem kilitlendi" : "Period locked") : tr ? "Kilitleme başarısız" : "Lock failed");
    if (res.ok) void loadPeriods();
  }

  async function unlockPeriod(id: string) {
    const res = await fetch(`/api/reporting-periods/${id}/unlock`, { method: "POST" });
    setMessage(res.ok ? (tr ? "Dönem açıldı" : "Period unlocked") : tr ? "Açma başarısız" : "Unlock failed");
    if (res.ok) void loadPeriods();
  }

  const csrdBadgeColor =
    csrdScope === "LARGE_COMPANY" ? "bg-red-100 text-red-700" :
    csrdScope === "LISTED_SME"   ? "bg-yellow-100 text-yellow-700" :
    "bg-green-100 text-green-700";

  const csrdBadgeLabel =
    csrdScope === "LARGE_COMPANY" ? (tr ? "CSRD Kapsamında (Büyük Şirket)" : "In CSRD Scope (Large Company)") :
    csrdScope === "LISTED_SME"    ? (tr ? "CSRD Kapsamında (KOBİ)" : "In CSRD Scope (Listed SME)") :
    (tr ? "CSRD Kapsam Dışı" : "Out of CSRD Scope");

  const subsectorsForMacro = ALL_SASB_SUBSECTORS.filter((s) => s.macro === selectedMacro);

  return (
    <div className="space-y-4">
      <Stepper
        steps={tr ? ["Şirket & Sektör", "Tesisler", "Roller", "Gözden Geçirme", "Tamamlandı"] : ["Company & Sector", "Facilities", "Roles", "Review", "Complete"]}
        currentStep={step}
      />
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      {/* ── Step 1: Company Info + Sector ── */}
      {step === 1 && (
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">

          {/* Basic company fields */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{tr ? "Temel Şirket Bilgileri" : "Basic Company Info"}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>{tr ? "Organizasyon Adı" : "Organization Name"}</Label>
                <Input value={orgForm.name} onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>{tr ? "Vergi No" : "Tax ID"}</Label>
                <Input value={orgForm.taxId} onChange={(e) => setOrgForm((p) => ({ ...p, taxId: e.target.value }))} />
              </div>
              <div>
                <Label>{tr ? "Merkez Ülke" : "Headquarters Country"}</Label>
                <Input value={orgForm.headquartersCountry} onChange={(e) => setOrgForm((p) => ({ ...p, headquartersCountry: e.target.value }))} />
              </div>
              <div>
                <Label>{tr ? "Raporlama Para Birimi (ISO)" : "Reporting Currency (ISO)"}</Label>
                <Input value={orgForm.reportingCurrency} onChange={(e) => setOrgForm((p) => ({ ...p, reportingCurrency: e.target.value }))} maxLength={3} />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Sector classification */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">{tr ? "Sektör Sınıflandırması" : "Sector Classification"}</h3>
            <p className="mb-3 text-xs text-slate-500">
              {tr
                ? "NACE kodu girildiğinde SASB sektörü otomatik eşlenir. Raporlama çerçevelerine göre hangi metrikler ve önemlilik konuları gösterileceği belirlenir."
                : "Entering a NACE code auto-maps the SASB sector. This determines which metrics and materiality topics are shown across the workflow."}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>{tr ? "NACE Rev.2 Kodu" : "NACE Rev.2 Code"}</Label>
                <Input
                  value={orgForm.naceCode}
                  onChange={(e) => handleNaceChange(e.target.value)}
                  placeholder={tr ? "Örn: C20, K64, J62" : "e.g. C20, K64, J62"}
                />
                {orgForm.naceCode && naceToSasb(orgForm.naceCode) && (
                  <p className="mt-1 text-xs text-green-600">
                    {tr ? "Otomatik eşlendi:" : "Auto-mapped:"} {naceToSasb(orgForm.naceCode)}
                  </p>
                )}
                {orgForm.naceCode && !naceToSasb(orgForm.naceCode) && (
                  <p className="mt-1 text-xs text-amber-600">
                    {tr ? "Bu NACE kodu için eşleme bulunamadı, SASB sektörünü manuel seçin." : "No mapping found for this NACE code — please select SASB sector manually."}
                  </p>
                )}
              </div>
              <div>
                <Label>{tr ? "NACE Açıklaması" : "NACE Description"}</Label>
                <Input
                  value={orgForm.naceDescription}
                  onChange={(e) => setOrgForm((p) => ({ ...p, naceDescription: e.target.value }))}
                  placeholder={tr ? "Örn: Kimyasal madde üretimi" : "e.g. Manufacture of chemicals"}
                />
              </div>
              <div>
                <Label>{tr ? "SASB Makro Sektör" : "SASB Macro Sector"}</Label>
                <Select
                  value={selectedMacro}
                  onChange={(key) => {
                    // Reset subsector when macro changes
                    setOrgForm((p) => ({ ...p, sasbSector: "", csrdSector: "", sector: SASB_MACRO_SECTORS.find((m) => m.key === key)?.[tr ? "label_tr" : "label_en"] ?? p.sector }));
                  }}
                  options={[
                    { value: "", label: tr ? "— Makro sektör seçin —" : "— Select macro sector —" },
                    ...SASB_MACRO_SECTORS.map((m) => ({ value: m.key, label: tr ? m.label_tr : m.label_en })),
                  ]}
                />
              </div>
              <div>
                <Label>{tr ? "SASB Alt Sektör (SICS)" : "SASB Sub-Sector (SICS)"}</Label>
                <Select
                  value={orgForm.sasbSector}
                  onChange={handleSasbChange}
                  options={[
                    { value: "", label: tr ? "— Alt sektör seçin —" : "— Select sub-sector —" },
                    ...(selectedMacro ? subsectorsForMacro : ALL_SASB_SUBSECTORS).map((s) => ({
                      value: s.sics,
                      label: `${s.sics} — ${tr ? s.label_tr : s.label_en}`,
                    })),
                  ]}
                />
              </div>
              {orgForm.sasbSector && (
                <div className="md:col-span-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium">{tr ? "Seçili SICS:" : "Selected SICS:"}</span> {orgForm.sasbSector}
                  {" · "}
                  {ALL_SASB_SUBSECTORS.find((s) => s.sics === orgForm.sasbSector)?.[tr ? "label_tr" : "label_en"]}
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Reporting frameworks */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">{tr ? "Raporlama Çerçeveleri" : "Reporting Frameworks"}</h3>
            <p className="mb-3 text-xs text-slate-500">
              {tr
                ? "Uygulanacak tüm standartları seçin. Seçilen çerçeveler rapor şablonlarını ve zorunlu açıklama konularını belirler."
                : "Select all applicable standards. Chosen frameworks determine report templates and mandatory disclosure topics."}
            </p>
            <div className="flex flex-wrap gap-2">
              {REPORTING_FRAMEWORKS.map((fw) => {
                const selected = orgForm.reportingFrameworks.includes(fw.value);
                return (
                  <button
                    key={fw.value}
                    type="button"
                    onClick={() => toggleFramework(fw.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {tr ? fw.label_tr : fw.label_en}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* CSRD scope check */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">{tr ? "CSRD Kapsam Kontrolü" : "CSRD Scope Check"}</h3>
            <p className="mb-3 text-xs text-slate-500">
              {tr
                ? "AB CSRD kapsamı: 2 kriter karşılanırsa büyük şirket sayılır (>250 çalışan, >40M€ ciro, >20M€ varlık)."
                : "EU CSRD scope: a company qualifies as large if 2 of 3 criteria are met (>250 employees, >€40M turnover, >€20M assets)."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <Label>{tr ? "Çalışan Sayısı" : "Employee Count"}</Label>
                <Input
                  type="number"
                  min={0}
                  value={orgForm.employeeCount}
                  onChange={(e) => setOrgForm((p) => ({ ...p, employeeCount: e.target.value }))}
                  placeholder="250"
                />
              </div>
              <div>
                <Label>{tr ? "Yıllık Ciro (M€)" : "Annual Turnover (M€)"}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={orgForm.annualTurnoverEurM}
                  onChange={(e) => setOrgForm((p) => ({ ...p, annualTurnoverEurM: e.target.value }))}
                  placeholder="40"
                />
              </div>
              <div>
                <Label>{tr ? "Toplam Varlık (M€)" : "Total Assets (M€)"}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={orgForm.totalAssetsEurM}
                  onChange={(e) => setOrgForm((p) => ({ ...p, totalAssetsEurM: e.target.value }))}
                  placeholder="20"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={orgForm.isPublicInterestEntity}
                  onChange={(e) => setOrgForm((p) => ({ ...p, isPublicInterestEntity: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {tr ? "Kamuya Yararlı Kuruluş (KAMİ / PIE)" : "Public Interest Entity (PIE)"}
              </label>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${csrdBadgeColor}`}>
                {csrdBadgeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button type="button" onClick={saveOrg}>
              {tr ? "Şirket Bilgilerini Kaydet" : "Save Company Info"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void fillFromAI()} disabled={aiLoading}>
              {aiLoading ? (tr ? "Yükleniyor..." : "Loading...") : (tr ? "AI ile Doldur" : "Fill with AI")}
            </Button>
            {aiMsg && <p className="text-xs text-slate-600">{aiMsg}</p>}
          </div>
        </div>
      )}

      {/* ── Step 2: Facilities ── */}
      {step === 2 && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <DataTable
            data={facilityRows}
            columns={[
              { key: "name", header: tr ? "Tesis Adı" : "Facility Name", render: (row) => row.name },
              { key: "location", header: tr ? "Konum" : "Location", render: (row) => `${row.city || "-"}, ${row.country}` },
              { key: "type", header: tr ? "Tip" : "Type", render: (row) => row.facilityType },
              {
                key: "actions",
                header: tr ? "İşlemler" : "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void editFacility(row)}>{tr ? "Düzenle" : "Edit"}</Button>
                    <Button size="sm" variant="destructive" onClick={() => void deleteFacility(row.id)}>{tr ? "Sil" : "Delete"}</Button>
                  </div>
                ),
              },
            ]}
          />
          <form className="grid gap-2 sm:grid-cols-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void addFacility(new FormData(e.currentTarget)); }}>
            <Input name="name" placeholder={tr ? "Tesis adı" : "Facility name"} required />
            <Input name="country" placeholder={tr ? "Ülke" : "Country"} required defaultValue="Turkey" />
            <Input name="city" placeholder={tr ? "Şehir" : "City"} />
            <Input name="facilityType" placeholder={tr ? "Tip" : "Type"} required />
            <Button type="submit" className="sm:col-span-2 md:col-span-1">{tr ? "Tesis Ekle" : "Add Facility"}</Button>
          </form>
        </div>
      )}

      {/* ── Step 3: Users ── */}
      {step === 3 && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <DataTable
            data={users}
            columns={[
              { key: "name", header: tr ? "Ad" : "Name", render: (row) => row.name },
              { key: "email", header: tr ? "E-posta" : "Email", render: (row) => row.email },
              { key: "role", header: tr ? "Rol" : "Role", render: (row) => row.role },
            ]}
          />
          <form className="grid gap-2 sm:grid-cols-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void addUser(new FormData(e.currentTarget)); }}>
            <Input name="name" placeholder={tr ? "Ad soyad" : "Full name"} required />
            <Input name="email" type="email" placeholder={tr ? "E-posta" : "Email"} required />
            <select name="role" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
              {Object.values(UserRole).map((role) => (<option key={role} value={role}>{role}</option>))}
            </select>
            <Input name="password" type="password" placeholder={tr ? "Parola" : "Password"} required />
            <Button type="submit" className="sm:col-span-2 md:col-span-1">{tr ? "Kullanıcı Davet Et" : "Invite User"}</Button>
          </form>
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === 4 && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          {/* Sector summary */}
          <div className="rounded-md bg-slate-50 p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">{tr ? "Sektör & Çerçeve Özeti" : "Sector & Framework Summary"}</p>
            <div className="grid gap-1 text-slate-600 md:grid-cols-2">
              <span><span className="font-medium">NACE:</span> {orgForm.naceCode || "—"}</span>
              <span><span className="font-medium">SASB SICS:</span> {orgForm.sasbSector || "—"}</span>
              <span>
                <span className="font-medium">{tr ? "Çerçeveler:" : "Frameworks:"}</span>{" "}
                {orgForm.reportingFrameworks.length > 0 ? orgForm.reportingFrameworks.join(", ") : "—"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold w-fit ${csrdBadgeColor}`}>{csrdBadgeLabel}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            {tr
              ? "Raporlama dönemi oluşturarak kurulumu tamamlayın."
              : "Finalize setup by creating a reporting period."}
          </p>

          {/* Period status legend */}
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700 mb-1.5">{tr ? "Dönem Durumları" : "Period Statuses"}</p>
            <div className="grid gap-1 sm:grid-cols-2">
              <span><span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 mr-1">OPEN</span>{tr ? "Veri girilebilir, düzenlenebilir" : "Data entry allowed, editable"}</span>
              <span><span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 mr-1">LOCKED</span>{tr ? "Veri girişi dondurulmuş, belgelendirme başlatılabilir" : "Data entry frozen, certification can begin"}</span>
              <span><span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 mr-1">SUBMITTED</span>{tr ? "Denetçiye gönderilmiş" : "Submitted to auditor"}</span>
              <span><span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 mr-1">CERTIFIED</span>{tr ? "Onaylanmış, kapatılmış" : "Approved and closed"}</span>
            </div>
          </div>

          <form className="grid gap-2 sm:grid-cols-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void addPeriod(new FormData(e.currentTarget)); }}>
            <Input name="name" defaultValue="2026" />
            <Input type="date" name="startDate" required />
            <Input type="date" name="endDate" required />
            <select name="status" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
              <option value="OPEN">{tr ? "OPEN — Açık" : "OPEN — Active"}</option>
              <option value="LOCKED">{tr ? "LOCKED — Kilitli" : "LOCKED — Frozen"}</option>
              <option value="SUBMITTED">{tr ? "SUBMITTED — Gönderildi" : "SUBMITTED — Sent"}</option>
              <option value="CERTIFIED">{tr ? "CERTIFIED — Belgelendi" : "CERTIFIED — Certified"}</option>
            </select>
            <Button type="submit" className="sm:col-span-2 md:col-span-1">{tr ? "Dönem Oluştur" : "Create Period"}</Button>
          </form>

          {periods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">{tr ? "Mevcut Dönemler" : "Existing Periods"}</p>
              {periods.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      p.status === "OPEN" ? "bg-green-100 text-green-700" :
                      p.status === "LOCKED" ? "bg-amber-100 text-amber-700" :
                      p.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-200 text-slate-600"
                    }`}>
                      {tr
                        ? p.status === "OPEN" ? "Açık"
                        : p.status === "LOCKED" ? "Kilitli"
                        : p.status === "SUBMITTED" ? "Gönderildi"
                        : "Belgelendi"
                        : p.status}
                    </span>
                    {p.status === "OPEN" && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => void lockPeriod(p.id)}>
                        {tr ? "Kilitle" : "Lock"}
                      </Button>
                    )}
                    {(p.status === "LOCKED" || p.status === "SUBMITTED") && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => void unlockPeriod(p.id)}>
                        {tr ? "Aç" : "Unlock"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 5: Complete ── */}
      {step === 5 && (
        <div className="rounded-lg border border-green-200 bg-white p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              {tr ? "Kurulum tamamlandı!" : "Setup complete!"}
            </h2>
            <p className="text-sm text-slate-500">
              {tr
                ? "Platformunuz kullanıma hazır. Aşağıdaki adımlarla sürdürülebilirlik raporlamasına başlayabilirsiniz."
                : "Your platform is ready. You can start sustainability reporting with the steps below."}
            </p>
          </div>

          {/* Summary chips */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              {orgForm.name || (tr ? "Şirket" : "Company")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              {facilityRows.length} {tr ? "tesis" : "facilit" + (facilityRows.length === 1 ? "y" : "ies")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              {users.length} {tr ? "kullanıcı" : "user" + (users.length === 1 ? "" : "s")}
            </span>
            {periods.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                {periods.length} {tr ? "raporlama dönemi" : "reporting period" + (periods.length === 1 ? "" : "s")}
              </span>
            )}
          </div>

          {/* Next steps */}
          <div className="text-left space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 text-center">
              {tr ? "Önerilen sonraki adımlar" : "Recommended next steps"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  href: "/esg-summary",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                  title: tr ? "ESG Özet Bilgileri" : "ESG Summary",
                  desc: tr ? "Temel ESG metriklerini ve şirket verilerini girin." : "Enter key ESG metrics and company data.",
                },
                {
                  href: "/materiality",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                  title: tr ? "Önemlilik Değerlendirmesi" : "Materiality Assessment",
                  desc: tr ? "Paydaş ve çevre önem sıralamasını belirleyin." : "Prioritize stakeholder and environmental topics.",
                },
                {
                  href: "/knowledge-base",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  ),
                  title: tr ? "Bilgi Bankası" : "Knowledge Base",
                  desc: tr ? "Belge yükleyin ve AI ile veri doldurmayı etkinleştirin." : "Upload documents and enable AI-assisted data entry.",
                },
                {
                  href: "/reports",
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  ),
                  title: tr ? "Raporlar" : "Reports",
                  desc: tr ? "Sürdürülebilirlik raporlarınızı oluşturun ve yönetin." : "Generate and manage sustainability reports.",
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
            >
              {tr ? "Ana Sayfaya Git" : "Go to Dashboard"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 1 || step === 5} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          {tr ? "Geri" : "Back"}
        </Button>
        <Button onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={step === 5}>
          {tr ? (step === 4 ? "Tamamla" : "İleri") : (step === 4 ? "Finish" : "Next")}
        </Button>
      </div>
    </div>
  );
}
