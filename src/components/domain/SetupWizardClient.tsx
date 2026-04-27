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

const sectorOptions = [
  { value: "Manufacturing", tr: "Üretim", en: "Manufacturing" },
  { value: "Energy", tr: "Enerji", en: "Energy" },
  { value: "Banking / Finance", tr: "Bankacılık / Finans", en: "Banking / Finance" },
  { value: "Retail", tr: "Perakende", en: "Retail" },
  { value: "Logistics", tr: "Lojistik", en: "Logistics" },
  { value: "Construction", tr: "İnşaat", en: "Construction" },
  { value: "Agriculture / Food", tr: "Tarım / Gıda", en: "Agriculture / Food" },
  { value: "Other", tr: "Diğer", en: "Other" },
];

export function SetupWizardClient({
  organization,
  facilities,
  users,
}: {
  organization: {
    name: string;
    taxId: string | null;
    sector: string;
    headquartersCountry: string;
    reportingCurrency: string;
  };
  facilities: Array<{ id: string; name: string; country: string; city: string | null; facilityType: string }>;
  users: Array<{ id: string; name: string; email: string; role: UserRole }>;
}) {
  const { locale } = useI18n();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [facilityRows, setFacilityRows] = useState(facilities);
  const [orgForm, setOrgForm] = useState({
    name: organization.name,
    taxId: organization.taxId || "",
    sector: organization.sector,
    headquartersCountry: organization.headquartersCountry,
    reportingCurrency: organization.reportingCurrency,
  });

  async function saveOrg() {
    const res = await fetch("/api/organization", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orgForm),
    });
    setMessage(res.ok ? (locale === "tr" ? "Organizasyon kaydedildi" : "Organization saved") : locale === "tr" ? "Organizasyon kaydedilemedi" : "Failed to save organization");
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
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Tesis eklendi"
          : "Facility added"
        : locale === "tr"
          ? "Tesis oluşturulamadı"
          : "Facility creation failed",
    );
  }

  async function editFacility(row: (typeof facilities)[number]) {
    const nextName = window.prompt(locale === "tr" ? "Tesis adı" : "Facility name", row.name);
    if (!nextName) return;
    const nextCountry = window.prompt(locale === "tr" ? "Ülke" : "Country", row.country);
    if (!nextCountry) return;
    const nextCity = window.prompt(locale === "tr" ? "Şehir" : "City", row.city || "") || null;
    const nextType = window.prompt(locale === "tr" ? "Tesis tipi" : "Facility type", row.facilityType);
    if (!nextType) return;

    const res = await fetch("/api/facilities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        name: nextName,
        country: nextCountry,
        city: nextCity,
        facilityType: nextType,
      }),
    });
    if (res.ok) {
      const updated = (await res.json()) as (typeof facilities)[number];
      setFacilityRows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }
    setMessage(res.ok ? (locale === "tr" ? "Tesis güncellendi" : "Facility updated") : locale === "tr" ? "Tesis güncellenemedi" : "Facility update failed");
  }

  async function deleteFacility(id: string) {
    const ok = window.confirm(locale === "tr" ? "Bu tesisi silmek istiyor musunuz?" : "Delete this facility?");
    if (!ok) return;
    const res = await fetch("/api/facilities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setFacilityRows((prev) => prev.filter((f) => f.id !== id));
    setMessage(res.ok ? (locale === "tr" ? "Tesis silindi" : "Facility deleted") : locale === "tr" ? "Tesis silinemedi" : "Facility delete failed");
  }

  async function addUser(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Kullanıcı eklendi, güncel liste için sayfayı yenileyin"
          : "User added, refresh page to see latest list"
        : locale === "tr"
          ? "Kullanıcı oluşturulamadı"
          : "User creation failed",
    );
  }

  async function addPeriod(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/reporting-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? (locale === "tr" ? "Raporlama dönemi oluşturuldu" : "Reporting period created") : locale === "tr" ? "Raporlama dönemi oluşturulamadı" : "Reporting period creation failed");
  }

  return (
    <div className="space-y-4">
      <Stepper
        steps={
          locale === "tr"
            ? ["Şirket Bilgisi", "Tesisler", "Roller", "Gözden Geçirme"]
            : ["Company Info", "Facilities", "Roles", "Review"]
        }
        currentStep={step}
      />
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      {step === 1 ? (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
          <div>
            <Label>{locale === "tr" ? "Organizasyon Adı" : "Organization Name"}</Label>
            <Input value={orgForm.name} onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <Label>{locale === "tr" ? "Vergi No" : "Tax ID"}</Label>
            <Input value={orgForm.taxId} onChange={(e) => setOrgForm((prev) => ({ ...prev, taxId: e.target.value }))} />
          </div>
          <div>
            <Label>{locale === "tr" ? "Sektör" : "Sector"}</Label>
            <Select
              value={orgForm.sector}
              onChange={(value) => setOrgForm((prev) => ({ ...prev, sector: value }))}
              options={sectorOptions.map((s) => ({ label: locale === "tr" ? s.tr : s.en, value: s.value }))}
            />
          </div>
          <div>
            <Label>{locale === "tr" ? "Merkez Ülke" : "Headquarters Country"}</Label>
            <Input
              value={orgForm.headquartersCountry}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, headquartersCountry: e.target.value }))}
            />
          </div>
          <div>
            <Label>{locale === "tr" ? "Raporlama Para Birimi" : "Reporting Currency"}</Label>
            <Input
              value={orgForm.reportingCurrency}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, reportingCurrency: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={saveOrg}>
              {locale === "tr" ? "Şirket Bilgilerini Kaydet" : "Save Company Info"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <DataTable
            data={facilityRows}
            columns={[
              { key: "name", header: locale === "tr" ? "Tesis Adı" : "Facility Name", render: (row) => row.name },
              { key: "location", header: locale === "tr" ? "Konum" : "Location", render: (row) => `${row.city || "-"}, ${row.country}` },
              { key: "type", header: locale === "tr" ? "Tip" : "Type", render: (row) => row.facilityType },
              {
                key: "actions",
                header: locale === "tr" ? "İşlemler" : "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void editFacility(row)}>
                      {locale === "tr" ? "Düzenle" : "Edit"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void deleteFacility(row.id)}>
                      {locale === "tr" ? "Sil" : "Delete"}
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          <form
            className="grid gap-2 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void addFacility(new FormData(e.currentTarget));
            }}
          >
            <Input name="name" placeholder={locale === "tr" ? "Tesis adı" : "Facility name"} required />
            <Input name="country" placeholder={locale === "tr" ? "Ülke" : "Country"} required defaultValue="Turkey" />
            <Input name="city" placeholder={locale === "tr" ? "Şehir" : "City"} />
            <Input name="facilityType" placeholder={locale === "tr" ? "Tip" : "Type"} required />
            <Button type="submit">{locale === "tr" ? "Tesis Ekle" : "Add Facility"}</Button>
          </form>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <DataTable
            data={users}
            columns={[
              { key: "name", header: locale === "tr" ? "Ad" : "Name", render: (row) => row.name },
              { key: "email", header: locale === "tr" ? "E-posta" : "Email", render: (row) => row.email },
              { key: "role", header: locale === "tr" ? "Rol" : "Role", render: (row) => row.role },
            ]}
          />

          <form
            className="grid gap-2 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void addUser(new FormData(e.currentTarget));
            }}
          >
            <Input name="name" placeholder={locale === "tr" ? "Ad soyad" : "Full name"} required />
            <Input name="email" type="email" placeholder={locale === "tr" ? "E-posta" : "Email"} required />
            <select name="role" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Input name="password" type="password" placeholder={locale === "tr" ? "Parola" : "Password"} required />
            <Button type="submit">{locale === "tr" ? "Kullanıcı Davet Et" : "Invite User"}</Button>
          </form>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            {locale === "tr"
              ? "Raporlama dönemi oluşturarak ve sektör şablonunu doğrulayarak kurulumu tamamlayın."
              : "Finalize setup by creating a reporting period and confirming sector template."}
          </p>
          <form
            className="grid gap-2 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void addPeriod(new FormData(e.currentTarget));
            }}
          >
            <Input name="name" defaultValue="2026" />
            <Input type="date" name="startDate" required />
            <Input type="date" name="endDate" required />
            <select name="status" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
              <option value="OPEN">OPEN</option>
              <option value="LOCKED">LOCKED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="CERTIFIED">CERTIFIED</option>
            </select>
            <Button type="submit">{locale === "tr" ? "Dönem Oluştur" : "Create Period"}</Button>
          </form>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          {locale === "tr" ? "Geri" : "Back"}
        </Button>
        <Button onClick={() => setStep((s) => Math.min(4, s + 1))}>{locale === "tr" ? "İleri" : "Next"}</Button>
      </div>
    </div>
  );
}
