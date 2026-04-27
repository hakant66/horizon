"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/domain/DataTable";
import { Stepper } from "@/components/domain/Stepper";

const sectorOptions = [
  "Manufacturing",
  "Energy",
  "Banking / Finance",
  "Retail",
  "Logistics",
  "Construction",
  "Agriculture / Food",
  "Other",
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
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
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
    setMessage(res.ok ? "Organization saved" : "Failed to save organization");
  }

  async function addFacility(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? "Facility added, refresh page to see latest list" : "Facility creation failed");
  }

  async function addUser(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? "User added, refresh page to see latest list" : "User creation failed");
  }

  async function addPeriod(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch("/api/reporting-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(res.ok ? "Reporting period created" : "Reporting period creation failed");
  }

  return (
    <div className="space-y-4">
      <Stepper steps={["Company Info", "Facilities", "Roles", "Review"]} currentStep={step} />
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      {step === 1 ? (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
          <div>
            <Label>Organization Name</Label>
            <Input value={orgForm.name} onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <Label>Tax ID</Label>
            <Input value={orgForm.taxId} onChange={(e) => setOrgForm((prev) => ({ ...prev, taxId: e.target.value }))} />
          </div>
          <div>
            <Label>Sector</Label>
            <Select
              value={orgForm.sector}
              onChange={(value) => setOrgForm((prev) => ({ ...prev, sector: value }))}
              options={sectorOptions.map((s) => ({ label: s, value: s }))}
            />
          </div>
          <div>
            <Label>Headquarters Country</Label>
            <Input
              value={orgForm.headquartersCountry}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, headquartersCountry: e.target.value }))}
            />
          </div>
          <div>
            <Label>Reporting Currency</Label>
            <Input
              value={orgForm.reportingCurrency}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, reportingCurrency: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={saveOrg}>
              Save Company Info
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <DataTable
            data={facilities}
            columns={[
              { key: "name", header: "Facility Name", render: (row) => row.name },
              { key: "location", header: "Location", render: (row) => `${row.city || "-"}, ${row.country}` },
              { key: "type", header: "Type", render: (row) => row.facilityType },
              { key: "actions", header: "Actions", render: () => "Edit/Delete via API" },
            ]}
          />

          <form
            className="grid gap-2 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void addFacility(new FormData(e.currentTarget));
            }}
          >
            <Input name="name" placeholder="Facility name" required />
            <Input name="country" placeholder="Country" required defaultValue="Turkey" />
            <Input name="city" placeholder="City" />
            <Input name="facilityType" placeholder="Type" required />
            <Button type="submit">Add Facility</Button>
          </form>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <DataTable
            data={users}
            columns={[
              { key: "name", header: "Name", render: (row) => row.name },
              { key: "email", header: "Email", render: (row) => row.email },
              { key: "role", header: "Role", render: (row) => row.role },
            ]}
          />

          <form
            className="grid gap-2 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void addUser(new FormData(e.currentTarget));
            }}
          >
            <Input name="name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <select name="role" className="h-9 rounded-md border border-slate-300 px-3 text-sm">
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Input name="password" type="password" placeholder="Password" required />
            <Button type="submit">Invite User</Button>
          </form>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Finalize setup by creating a reporting period and confirming sector template.</p>
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
            <Button type="submit">Create Period</Button>
          </form>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          Back
        </Button>
        <Button onClick={() => setStep((s) => Math.min(4, s + 1))}>Next</Button>
      </div>
    </div>
  );
}
