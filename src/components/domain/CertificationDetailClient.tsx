"use client";

import { useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentThread } from "@/components/domain/CommentThread";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { useI18n } from "@/components/providers/LanguageProvider";

export function CertificationDetailClient({
  submission,
  userRole,
}: {
  submission: {
    id: string;
    status: string;
    decisionNotes: string | null;
    comments: Array<{ id: string; comment: string; createdAt: string; authorUser: { name: string } }>;
  };
  userRole: UserRole;
}) {
  const { locale } = useI18n();
  const [comment, setComment] = useState("");
  const [decisionNotes, setDecisionNotes] = useState(submission.decisionNotes || "");
  const [message, setMessage] = useState("");

  const isAuditor = userRole === UserRole.AUDITOR;

  async function sendComment() {
    const res = await fetch("/api/certification/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificationSubmissionId: submission.id, comment }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? "Yorum eklendi. En güncel akış için sayfayı yenileyin."
          : "Comment added. Refresh to see latest thread."
        : locale === "tr"
          ? "Yorum ekleme başarısız"
          : "Failed to add comment",
    );
    if (res.ok) setComment("");
  }

  async function submitAgain() {
    const res = await fetch("/api/certification/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id }),
    });
    setMessage(res.ok ? (locale === "tr" ? "Başvuru gönderildi" : "Submission sent") : locale === "tr" ? "Gönderim başarısız" : "Submission failed");
  }

  async function decide(status: "CHANGES_REQUESTED" | "APPROVED" | "REJECTED") {
    const res = await fetch("/api/certification/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id, status, decisionNotes }),
    });
    setMessage(
      res.ok
        ? locale === "tr"
          ? `Karar güncellendi: ${status}`
          : `Decision updated: ${status}`
        : locale === "tr"
          ? "Karar güncelleme başarısız"
          : "Decision update failed",
    );
  }

  const steps = useMemo(
    () => [
      { name: locale === "tr" ? "Hazırlandı" : "Prepared", done: true },
      {
        name: locale === "tr" ? "Gönderildi" : "Submitted",
        done: ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "APPROVED"].includes(submission.status),
      },
      {
        name: locale === "tr" ? "Denetçi İncelemesi" : "Auditor Review",
        done: ["UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED"].includes(submission.status),
      },
      { name: locale === "tr" ? "Onaylandı" : "Approved", done: submission.status === "APPROVED" },
    ],
    [locale, submission.status],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm">
          {locale === "tr" ? "Belgelendirme Durumu" : "Certification Status"}: <StatusBadge status={submission.status} />
        </p>
        <div className="space-y-1 text-sm">
          {steps.map((step) => (
            <p key={step.name}>
              {step.name}: {step.done ? (locale === "tr" ? "Tamam" : "Complete") : locale === "tr" ? "Beklemede" : "Pending"}
            </p>
          ))}
        </div>
      </div>

      <CommentThread
        comments={submission.comments.map((comment) => ({
          id: comment.id,
          author: comment.authorUser.name,
          comment: comment.comment,
          createdAt: format(new Date(comment.createdAt), "yyyy-MM-dd HH:mm"),
        }))}
      />

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={locale === "tr" ? "İnceleme yorumu ekleyin" : "Add review comment"} />
        <div className="flex gap-2">
          <Button onClick={sendComment}>{locale === "tr" ? "Yanıtla" : "Respond"}</Button>
          <Button variant="outline" onClick={submitAgain}>
            {locale === "tr" ? "Yeniden Gönder" : "Resubmit"}
          </Button>
        </div>
      </div>

      {isAuditor ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <Textarea value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} placeholder={locale === "tr" ? "Karar notları" : "Decision notes"} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => decide("CHANGES_REQUESTED")}>{locale === "tr" ? "Değişiklik İste" : "Request Changes"}</Button>
            <Button onClick={() => decide("APPROVED")}>{locale === "tr" ? "Onayla" : "Approve"}</Button>
            <Button variant="destructive" onClick={() => decide("REJECTED")}>{locale === "tr" ? "Reddet" : "Reject"}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
