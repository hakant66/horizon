"use client";

import { FileX } from "lucide-react";
import { useI18n } from "@/components/providers/LanguageProvider";

export function EmptyState({
  title,
  description,
  titleTr,
  titleEn,
  descriptionTr,
  descriptionEn,
  icon: Icon = FileX,
}: {
  title: string;
  description: string;
  titleTr?: string;
  titleEn?: string;
  descriptionTr?: string;
  descriptionEn?: string;
  icon?: React.ElementType;
}) {
  const { locale } = useI18n();
  const resolvedTitle = locale === "tr" ? titleTr || title : titleEn || title;
  const resolvedDescription = locale === "tr" ? descriptionTr || description : descriptionEn || description;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Icon className="mb-3 h-8 w-8 text-slate-300" />
      <h3 className="text-sm font-semibold text-slate-700">{resolvedTitle}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{resolvedDescription}</p>
    </div>
  );
}
