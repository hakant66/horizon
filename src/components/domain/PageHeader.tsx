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
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{resolvedTitle}</h2>
        {resolvedDescription ? <p className="mt-1 text-sm text-slate-600">{resolvedDescription}</p> : null}
      </div>
      {actions}
    </div>
  );
}
