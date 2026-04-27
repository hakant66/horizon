"use client";

import { useI18n } from "@/components/providers/LanguageProvider";

export function EmptyState({
  title,
  description,
  titleTr,
  titleEn,
  descriptionTr,
  descriptionEn,
}: {
  title: string;
  description: string;
  titleTr?: string;
  titleEn?: string;
  descriptionTr?: string;
  descriptionEn?: string;
}) {
  const { locale } = useI18n();
  const resolvedTitle = locale === "tr" ? titleTr || title : titleEn || title;
  const resolvedDescription = locale === "tr" ? descriptionTr || description : descriptionEn || description;

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{resolvedTitle}</h3>
      <p className="mt-1 text-sm text-slate-600">{resolvedDescription}</p>
    </div>
  );
}
