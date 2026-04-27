"use client";

import { useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentThread } from "@/components/domain/CommentThread";
import { StatusBadge } from "@/components/domain/StatusBadge";

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
    setMessage(res.ok ? "Comment added. Refresh to see latest thread." : "Failed to add comment");
    if (res.ok) setComment("");
  }

  async function submitAgain() {
    const res = await fetch("/api/certification/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id }),
    });
    setMessage(res.ok ? "Submission sent" : "Submission failed");
  }

  async function decide(status: "CHANGES_REQUESTED" | "APPROVED" | "REJECTED") {
    const res = await fetch("/api/certification/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id, status, decisionNotes }),
    });
    setMessage(res.ok ? `Decision updated: ${status}` : "Decision update failed");
  }

  const steps = useMemo(
    () => [
      { name: "Prepared", done: true },
      { name: "Submitted", done: ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "APPROVED"].includes(submission.status) },
      { name: "Auditor Review", done: ["UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED"].includes(submission.status) },
      { name: "Approved", done: submission.status === "APPROVED" },
    ],
    [submission.status],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm">
          Certification Status: <StatusBadge status={submission.status} />
        </p>
        <div className="space-y-1 text-sm">
          {steps.map((step) => (
            <p key={step.name}>
              {step.name}: {step.done ? "Complete" : "Pending"}
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
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add review comment" />
        <div className="flex gap-2">
          <Button onClick={sendComment}>Respond</Button>
          <Button variant="outline" onClick={submitAgain}>
            Resubmit
          </Button>
        </div>
      </div>

      {isAuditor ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <Textarea value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} placeholder="Decision notes" />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => decide("CHANGES_REQUESTED")}>Request Changes</Button>
            <Button onClick={() => decide("APPROVED")}>Approve</Button>
            <Button variant="destructive" onClick={() => decide("REJECTED")}>Reject</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
