import { notFound } from "next/navigation";
import { PageHeader } from "@/components/domain/PageHeader";
import { CertificationDetailClient } from "@/components/domain/CertificationDetailClient";
import { getWorkspaceContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";

export default async function CertificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization, user } = await getWorkspaceContext();
  const { id } = await params;

  const submission = await prisma.certificationSubmission.findFirst({
    where: { id, organizationId: organization.id },
    include: { comments: { include: { authorUser: { select: { name: true } } }, orderBy: { createdAt: "asc" } }, report: true },
  });

  if (!submission) notFound();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Certification Submission"
        titleTr="Belgelendirme Başvurusu"
        titleEn="Certification Submission"
        description={`Linked report: ${submission.report.framework}`}
        descriptionTr={`Bağlı rapor: ${submission.report.framework}`}
        descriptionEn={`Linked report: ${submission.report.framework}`}
      />
      <CertificationDetailClient
        userRole={user.role}
        submission={{
          id: submission.id,
          status: submission.status,
          decisionNotes: submission.decisionNotes,
          comments: submission.comments.map((c) => ({
            id: c.id,
            comment: c.comment,
            createdAt: c.createdAt.toISOString(),
            authorUser: c.authorUser,
          })),
        }}
      />
    </div>
  );
}
