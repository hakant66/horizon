import { PageHeader } from "@/components/domain/PageHeader";
import { KnowledgeBaseClient } from "@/components/domain/KnowledgeBaseClient";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/context";

export default async function KnowledgeBasePage() {
  const { organization } = await getWorkspaceContext();

  const docs = await prisma.knowledgeBaseDocument.findMany({
    where: { organizationId: organization.id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      description: true,
      uploadedAt: true,
      uploadedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bilgi Bankası"
        titleTr="Bilgi Bankası"
        titleEn="Knowledge Base"
        description="Organizasyona ait belgeler şifreli olarak saklanır."
        descriptionTr="Organizasyona ait belgeler AES-256-GCM ile şifreli olarak saklanır."
        descriptionEn="Organization documents are stored with AES-256-GCM encryption."
      />
      <KnowledgeBaseClient initialDocs={docs.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() }))} />
    </div>
  );
}
