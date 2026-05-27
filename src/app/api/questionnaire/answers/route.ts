import { Prisma, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { questionnaireAnswerSchema, approvalStageTransitionSchema } from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { validateTransition } from "@/lib/approval";
import { createNotification } from "@/lib/notifications";
import { transitionRequiresEvidence, hasEvidence } from "@/lib/evidence-gate";
import { assertPeriodOpen } from "@/lib/period-guard";

export async function GET(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT",
    ]);
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

    await assertPeriodOpen(payload.reportingPeriodId, user.organizationId);

    // Numeric range validation.
    if (payload.answer_number !== null && payload.answer_number !== undefined) {
      const question = await prisma.questionnaireQuestion.findUnique({
        where: { id: payload.questionnaireQuestionId },
        select: { minValue: true, maxValue: true, errorWarning: true },
      });
      const hint = question?.errorWarning ? ` ${question.errorWarning}` : "";
      if (question?.minValue !== null && question?.minValue !== undefined) {
        if (new Prisma.Decimal(payload.answer_number).lessThan(question.minValue)) {
          return apiError(new Error(`Value must be ≥ ${question.minValue}.${hint}`), 422);
        }
      }
      if (question?.maxValue !== null && question?.maxValue !== undefined) {
        if (new Prisma.Decimal(payload.answer_number).greaterThan(question.maxValue)) {
          return apiError(new Error(`Value must be ≤ ${question.maxValue}.${hint}`), 422);
        }
      }
    }

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
          answer_number:
            payload.answer_number === null || payload.answer_number === undefined
              ? null
              : new Prisma.Decimal(payload.answer_number),
          answering_user_id: user.id,
          answering_timestamp: new Date(),
        },
      });
      await createAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: "QUESTIONNAIRE_ANSWER_CREATED",
        entityType: "QuestionnaireAnswer",
        entityId: row.id,
        afterValueJson: row,
      });
      return apiOk(row, 201);
    }

    const row = await prisma.questionnaireAnswer.update({
      where: { id: existing.id },
      data: {
        answer_text: payload.answer_text,
        answer_number:
          payload.answer_number === null || payload.answer_number === undefined
            ? null
            : new Prisma.Decimal(payload.answer_number),
        updated_by_id: user.id,
        updated_timestamp: new Date(),
        deleted_timestamp: null,
        deleted_by_id: null,
        // Reset to DATA_ENTRY on re-submission of content so it flows back through review.
        approvalStage: "DATA_ENTRY",
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "QUESTIONNAIRE_ANSWER_UPDATED",
      entityType: "QuestionnaireAnswer",
      entityId: row.id,
      beforeValueJson: existing,
      afterValueJson: row,
    });
    return apiOk(row);
  } catch (error) {
    return apiError(error, 400);
  }
}

// PATCH — approval stage transitions only (data updates go through POST).
export async function PATCH(request: Request) {
  try {
    const user = await requireRole([
      "ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR",
      "FINANCE_REVIEWER", "HORIZON_CONSULTANT",
    ]);
    const payload = approvalStageTransitionSchema.parse(await request.json());

    const answer = await prisma.questionnaireAnswer.findFirstOrThrow({
      where: { id: payload.id, organizationId: user.organizationId, deleted_timestamp: null },
      include: { answeringUser: { select: { id: true } } },
    });

    const error = validateTransition(
      answer.approvalStage,
      payload.approvalStage,
      user.role as UserRole,
    );
    if (error) {
      return apiError(new Error(error.message), error.code === "FORBIDDEN" ? 403 : 400);
    }

    if (transitionRequiresEvidence(answer.approvalStage, payload.approvalStage)) {
      const evidenced = await hasEvidence("QUESTIONNAIRE_ANSWER", payload.id, user.organizationId);
      if (!evidenced) {
        return apiError(
          new Error("Evidence is required before moving to this stage. Please upload at least one supporting document."),
          422,
        );
      }
    }

    const updated = await prisma.questionnaireAnswer.update({
      where: { id: payload.id },
      data: { approvalStage: payload.approvalStage },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "ANSWER_STAGE_TRANSITIONED",
      entityType: "QuestionnaireAnswer",
      entityId: updated.id,
      beforeValueJson: { approvalStage: answer.approvalStage },
      afterValueJson: { approvalStage: updated.approvalStage, comment: payload.comment },
    });

    const answerOwnerId = answer.answeringUser.id;
    if (answerOwnerId !== user.id) {
      await createNotification({
        organizationId: user.organizationId,
        userId: answerOwnerId,
        type: payload.approvalStage === "APPROVED" ? "ANSWER_APPROVED" : "REVISION_REQUESTED",
        title:
          payload.approvalStage === "APPROVED"
            ? "Your answer has been approved"
            : `Your answer requires revision`,
        body: payload.comment ?? undefined,
        entityType: "QUESTIONNAIRE_ANSWER",
        entityId: updated.id,
      });
    }

    return apiOk(updated);
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR"]);
    const { id } = (await request.json()) as { id: string };
    const existing = await prisma.questionnaireAnswer.findFirstOrThrow({
      where: { id, organizationId: user.organizationId },
    });

    const row = await prisma.questionnaireAnswer.update({
      where: { id },
      data: { deleted_by_id: user.id, deleted_timestamp: new Date() },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "QUESTIONNAIRE_ANSWER_DELETED",
      entityType: "QuestionnaireAnswer",
      entityId: row.id,
      beforeValueJson: existing,
      afterValueJson: row,
    });
    return apiOk({ success: true });
  } catch (error) {
    return apiError(error, 400);
  }
}
