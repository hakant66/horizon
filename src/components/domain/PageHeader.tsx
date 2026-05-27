"use client";

import { useI18n } from "@/components/providers/LanguageProvider";

export function PageHeader({
  title,
  titleTr,
  titleEn,
  description,
  descriptionTr,
  descriptionEn,
  actions,
}: {
  title: string;
  titleTr?: string;
  titleEn?: string;
  description?: string;
  descriptionTr?: string;
  descriptionEn?: string;
  actions?: React.ReactNode;
}) {
  const { locale } = useI18n();
  const resolvedTitle = locale === "tr" ? titleTr || title : titleEn || title;
  const resolvedDescription = locale === "tr" ? descriptionTr || description : descriptionEn || description;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{resolvedTitle}</h1>
        {resolvedDescription && (
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{resolvedDescription}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
