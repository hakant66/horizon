"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/LanguageProvider";

const statusMap: Record<string, { tr: string; en: string }> = {
  VALIDATED: { tr: "Doğrulandı", en: "Validated" },
  APPROVED: { tr: "Onaylandı", en: "Approved" },
  ON_TRACK: { tr: "Yolunda", en: "On Track" },
  ACCEPTED: { tr: "Kabul Edildi", en: "Accepted" },
  CERTIFIED: { tr: "Belgelendi", en: "Certified" },
  GENERATED: { tr: "Oluşturuldu", en: "Generated" },
  COMPLETED: { tr: "Tamamlandı", en: "Completed" },
  NEEDS_CORRECTION: { tr: "Düzeltme Gerekli", en: "Needs Correction" },
  REJECTED: { tr: "Reddedildi", en: "Rejected" },
  OFF_TRACK: { tr: "Hedeften Sapmış", en: "Off Track" },
  CHANGES_REQUESTED: { tr: "Değişiklik İstendi", en: "Changes Requested" },
  UNDER_REVIEW: { tr: "İncelemede", en: "Under Review" },
  SUBMITTED: { tr: "Gönderildi", en: "Submitted" },
  IN_PROGRESS: { tr: "Devam Ediyor", en: "In Progress" },
  AT_RISK: { tr: "Riskte", en: "At Risk" },
  NOT_STARTED: { tr: "Başlanmadı", en: "Not Started" },
  DRAFT: { tr: "Taslak", en: "Draft" },
  RESUBMITTED: { tr: "Tekrar Gönderildi", en: "Resubmitted" },
  UPLOADED: { tr: "Yüklendi", en: "Uploaded" },
  NEEDS_CLARIFICATION: { tr: "Açıklama Gerekli", en: "Needs Clarification" },
  OPEN: { tr: "Açık", en: "Open" },
  LOCKED: { tr: "Kilitli", en: "Locked" },
  SUBMITTED_FOR_CERTIFICATION: { tr: "Belgelendirmeye Gönderildi", en: "Submitted for Certification" },
  PHYSICAL_ACUTE: { tr: "Fiziksel Akut", en: "Physical Acute" },
  PHYSICAL_CHRONIC: { tr: "Fiziksel Kronik", en: "Physical Chronic" },
  TRANSITION_POLICY_LEGAL: { tr: "Geçiş Politik/Hukuki", en: "Transition Policy/Legal" },
  TRANSITION_MARKET: { tr: "Geçiş Piyasa", en: "Transition Market" },
  TRANSITION_TECHNOLOGY: { tr: "Geçiş Teknoloji", en: "Transition Technology" },
  TRANSITION_REPUTATION: { tr: "Geçiş İtibar", en: "Transition Reputation" },
  HIGH: { tr: "Yüksek", en: "High" },
  MEDIUM: { tr: "Orta", en: "Medium" },
  LOW: { tr: "Düşük", en: "Low" },
  COMPLETE: { tr: "Tamam", en: "Complete" },
  PENDING: { tr: "Beklemede", en: "Pending" },
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  const { locale } = useI18n();
  const normalized = status.toUpperCase();
  const mapped = statusMap[normalized];
  const label = mapped ? (locale === "tr" ? mapped.tr : mapped.en) : humanize(status);

  if (["VALIDATED", "APPROVED", "ON_TRACK", "ACCEPTED", "CERTIFIED", "GENERATED", "COMPLETED", "COMPLETE"].includes(normalized)) {
    return <Badge variant="success">{label}</Badge>;
  }
  if (["NEEDS_CORRECTION", "REJECTED", "OFF_TRACK", "CHANGES_REQUESTED"].includes(normalized)) {
    return <Badge variant="danger">{label}</Badge>;
  }
  if (["UNDER_REVIEW", "SUBMITTED", "IN_PROGRESS", "AT_RISK", "PENDING", "RESUBMITTED", "SUBMITTED_FOR_CERTIFICATION"].includes(normalized)) {
    return <Badge variant="warning">{label}</Badge>;
  }
  return <Badge variant="default">{label}</Badge>;
}
