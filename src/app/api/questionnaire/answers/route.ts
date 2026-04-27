import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { questionnaireAnswerSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const questionnaireId = searchParams.get("questionnaireId") || undefined;
    const reportingPeriodId = searchParams.get("reportingPeriodId") || undefined;

    const answers = await prisma.questionnaireAnswer.findMany({
      where: {
        organizationId: user.organizationId,
        deleted_timestamp: null,
        ...(questionnaireId ? { questionnaireId } : {}),
        ...(reportingPeriodId ? { reportingPeriodId } : {}),
      },
      include: {
        questionnaireQuestion: true,
        answeringUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiOk(answers);
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const payload = questionnaireAnswerSchema.parse(await request.json());

    const existing = await prisma.questionnaireAnswer.findUnique({
      where: {
        questionnaireQuestionId_reportingPeriodId: {
          questionnaireQuestionId: payload.questionnaireQuestionId,
          reportingPeriodId: payload.reportingPeriodId,
        },
      },
    });

    if (!existing) {
      const row = await prisma.questionnaireAnswer.create({
        data: {
          organizationId: user.organizationId,
          questionnaireId: payload.questionnaireId,
          questionnaireQuestionId: payload.questionnaireQuestionId,
          reportingPeriodId: payload.reportingPeriodId,
          answer_text: payload.answer_text,
          answer_number: payload.answer_number === null || payload.answer_number === undefined ? null : new Prisma.Decimal(payload.answer_number),
          answering_user_id: user.id,
          answering_timestamp: new Date(),
        },
      });
      await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_ANSWER_CREATED", entityType: "QuestionnaireAnswer", entityId: row.id, afterValueJson: row });
      return apiOk(row, 201);
    }

    const row = await prisma.questionnaireAnswer.update({
      where: { id: existing.id },
      data: {
        answer_text: payload.answer_text,
        answer_number: payload.answer_number === null || payload.answer_number === undefined ? null : new Prisma.Decimal(payload.answer_number),
        updated_by_id: user.id,
        updated_timestamp: new Date(),
        deleted_timestamp: null,
        deleted_by_id: null,
      },
    });

    await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_ANSWER_UPDATED", entityType: "QuestionnaireAnswer", entityId: row.id, beforeValueJson: existing, afterValueJson: row });
    return apiOk(row);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const { id } = (await request.json()) as { id: string };
    const existing = await prisma.questionnaireAnswer.findFirstOrThrow({ where: { id, organizationId: user.organizationId } });

    const row = await prisma.questionnaireAnswer.update({
      where: { id },
      data: {
        deleted_by_id: user.id,
        deleted_timestamp: new Date(),
      },
    });

    await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_ANSWER_DELETED", entityType: "QuestionnaireAnswer", entityId: row.id, beforeValueJson: existing, afterValueJson: row });
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
