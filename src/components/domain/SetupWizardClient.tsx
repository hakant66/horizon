"use client";

import { useState } from "react";
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
        steps={tr ? ["Şirket & Sektör", "Tesisler", "Roller", "Gözden Geçirme"] : ["Company & Sector", "Facilities", "Roles", "Review"]}
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

          <Button type="button" onClick={saveOrg}>
            {tr ? "Şirket Bilgilerini Kaydet" : "Save Company Info"}
          </Button>
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
          <form className="grid gap-2 sm:grid-cols-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void addPeriod(new FormData(e.currentTarget)); }}>
            <Input name="name" defaultValue="2026" />
            <Input type="date" name="startDate" required />
            <Input type="date" name="endDate" required />
            <select name="status" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
              <option value="OPEN">OPEN</option>
              <option value="LOCKED">LOCKED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="CERTIFIED">CERTIFIED</option>
            </select>
            <Button type="submit" className="sm:col-span-2 md:col-span-1">{tr ? "Dönem Oluştur" : "Create Period"}</Button>
          </form>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          {tr ? "Geri" : "Back"}
        </Button>
        <Button onClick={() => setStep((s) => Math.min(4, s + 1))}>
          {tr ? "İleri" : "Next"}
        </Button>
      </div>
    </div>
  );
}
