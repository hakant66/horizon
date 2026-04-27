"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/providers/LanguageProvider";

export function CommentThread({
  comments,
}: {
  comments: { id: string; author: string; comment: string; createdAt: string }[];
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === "tr" ? "Yorumlar" : "Comments"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comments.map((item) => (
          <div key={item.id} className="rounded border border-slate-200 p-3">
            <p className="text-sm font-medium">{item.author}</p>
            <p className="text-sm text-slate-700">{item.comment}</p>
            <p className="text-xs text-slate-500">{item.createdAt}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
