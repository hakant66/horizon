"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/LanguageProvider";

const STATUS_MAP: Record<string, { tr: string; en: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  VALIDATED:                    { tr: "Doğrulandı",             en: "Validated",              variant: "success" },
  APPROVED:                     { tr: "Onaylandı",              en: "Approved",               variant: "success" },
  ON_TRACK:                     { tr: "Yolunda",                en: "On Track",               variant: "success" },
  ACCEPTED:                     { tr: "Kabul Edildi",           en: "Accepted",               variant: "success" },
  CERTIFIED:                    { tr: "Belgelendi",             en: "Certified",              variant: "success" },
  GENERATED:                    { tr: "Oluşturuldu",            en: "Generated",              variant: "success" },
  COMPLETED:                    { tr: "Tamamlandı",             en: "Completed",              variant: "success" },
  COMPLETE:                     { tr: "Tamam",                  en: "Complete",               variant: "success" },
  NEEDS_CORRECTION:             { tr: "Düzeltme Gerekli",       en: "Needs Correction",       variant: "danger"  },
  REJECTED:                     { tr: "Reddedildi",             en: "Rejected",               variant: "danger"  },
  OFF_TRACK:                    { tr: "Hedeften Sapmış",        en: "Off Track",              variant: "danger"  },
  CHANGES_REQUESTED:            { tr: "Değişiklik İstendi",     en: "Changes Requested",      variant: "danger"  },
  UNDER_REVIEW:                 { tr: "İncelemede",             en: "Under Review",           variant: "warning" },
  SUBMITTED:                    { tr: "Gönderildi",             en: "Submitted",              variant: "warning" },
  IN_PROGRESS:                  { tr: "Devam Ediyor",           en: "In Progress",            variant: "warning" },
  AT_RISK:                      { tr: "Riskte",                 en: "At Risk",                variant: "warning" },
  PENDING:                      { tr: "Beklemede",              en: "Pending",                variant: "warning" },
  RESUBMITTED:                  { tr: "Tekrar Gönderildi",      en: "Resubmitted",            variant: "warning" },
  SUBMITTED_FOR_CERTIFICATION:  { tr: "Belgelendirmeye Gönderildi", en: "Submitted for Certification", variant: "warning" },
  NEEDS_CLARIFICATION:          { tr: "Açıklama Gerekli",       en: "Needs Clarification",    variant: "warning" },
  DRAFT:                        { tr: "Taslak",                 en: "Draft",                  variant: "default" },
  NOT_STARTED:                  { tr: "Başlanmadı",             en: "Not Started",            variant: "default" },
  OPEN:                         { tr: "Açık",                   en: "Open",                   variant: "info"    },
  LOCKED:                       { tr: "Kilitli",                en: "Locked",                 variant: "default" },
  UPLOADED:                     { tr: "Yüklendi",               en: "Uploaded",               variant: "info"    },
  OVERDUE:                      { tr: "Gecikmiş",               en: "Overdue",                variant: "danger"  },
  HIGH:                         { tr: "Yüksek",                 en: "High",                   variant: "danger"  },
  MEDIUM:                       { tr: "Orta",                   en: "Medium",                 variant: "warning" },
  LOW:                          { tr: "Düşük",                  en: "Low",                    variant: "success" },
};

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  const { locale } = useI18n();
  const entry = STATUS_MAP[status.toUpperCase()];
  const label = entry ? (locale === "tr" ? entry.tr : entry.en) : humanize(status);
  const variant = entry?.variant ?? "default";
  return <Badge variant={variant}>{label}</Badge>;
}
