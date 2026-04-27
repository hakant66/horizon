import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  questionnaireQuestionSchema,
  questionnaireSchema,
  questionnaireSectionSchema,
  questionnaireSubsectionSchema,
  questionnaireTopicSchema,
} from "@/lib/validation";
import { apiError, apiOk } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "FINANCE_REVIEWER", "DATA_CONTRIBUTOR", "AUDITOR"]);
    const { searchParams } = new URL(request.url);
    const questionnaireId = searchParams.get("questionnaireId") || undefined;

    const [topics, questionnaires] = await Promise.all([
      prisma.questionnaireTopic.findMany({ where: { organizationId: user.organizationId }, orderBy: { name_tr: "asc" } }),
      prisma.questionnaire.findMany({
        where: { organizationId: user.organizationId, ...(questionnaireId ? { id: questionnaireId } : {}) },
        include: {
          sections: {
            include: {
              subsections: {
                include: {
                  questions: {
                    include: {
                      questionnaireTopic: true,
                    },
                    orderBy: { created_datetime: "asc" },
                  },
                },
                orderBy: { orderIndex: "asc" },
              },
              questions: {
                include: {
                  questionnaireTopic: true,
                },
                orderBy: { created_datetime: "asc" },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
          questions: true,
          answers: {
            where: { deleted_timestamp: null },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return apiOk({ topics, questionnaires });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = (await request.json()) as { entityType: string; payload: unknown };

    switch (body.entityType) {
      case "topic": {
        const payload = questionnaireTopicSchema.parse(body.payload);
        const row = await prisma.questionnaireTopic.create({
          data: {
            organizationId: user.organizationId,
            name_tr: payload.name_tr,
            name_en: payload.name_en,
          },
        });
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: "QUESTIONNAIRE_TOPIC_CREATED",
          entityType: "QuestionnaireTopic",
          entityId: row.id,
          afterValueJson: row,
        });
        return apiOk(row, 201);
      }
      case "questionnaire": {
        const payload = questionnaireSchema.parse(body.payload);
        const row = await prisma.questionnaire.create({
          data: {
            organizationId: user.organizationId,
            name_tr: payload.name_tr,
            name_en: payload.name_en,
            type: payload.type,
            description: payload.description,
          },
        });
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: "QUESTIONNAIRE_CREATED",
          entityType: "Questionnaire",
          entityId: row.id,
          afterValueJson: row,
        });
        return apiOk(row, 201);
      }
      case "section": {
        const payload = questionnaireSectionSchema.parse(body.payload);
        const row = await prisma.questionnaireSection.create({
          data: {
            organizationId: user.organizationId,
            questionnaireId: payload.questionnaireId,
            name: payload.name,
            orderIndex: payload.orderIndex || 0,
          },
        });
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: "QUESTIONNAIRE_SECTION_CREATED",
          entityType: "QuestionnaireSection",
          entityId: row.id,
          afterValueJson: row,
        });
        return apiOk(row, 201);
      }
      case "subsection": {
        const payload = questionnaireSubsectionSchema.parse(body.payload);
        const row = await prisma.questionnaireSubsection.create({
          data: {
            organizationId: user.organizationId,
            questionnaireSectionId: payload.questionnaireSectionId,
            name: payload.name,
            orderIndex: payload.orderIndex || 0,
          },
        });
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: "QUESTIONNAIRE_SUBSECTION_CREATED",
          entityType: "QuestionnaireSubsection",
          entityId: row.id,
          afterValueJson: row,
        });
        return apiOk(row, 201);
      }
      case "question": {
        const payload = questionnaireQuestionSchema.parse(body.payload);
        const row = await prisma.questionnaireQuestion.create({
          data: {
            organizationId: user.organizationId,
            questionnaireId: payload.questionnaireId,
            questionnaireSectionId: payload.questionnaireSectionId || null,
            questionnaireSubsectionId: payload.questionnaireSubsectionId || null,
            questionnaireTopicId: payload.questionnaireTopicId || null,
            section: payload.section,
            code: payload.code,
            title: payload.title,
            question_text: payload.question_text,
            unit: payload.unit,
            owner_name: payload.owner_name,
            owner_department: payload.owner_department,
            owner_email: payload.owner_email,
            helper: payload.helper,
            example: payload.example,
            reminder: payload.reminder,
            video_link: payload.video_link,
          },
        });
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: "QUESTIONNAIRE_QUESTION_CREATED",
          entityType: "QuestionnaireQuestion",
          entityId: row.id,
          afterValueJson: row,
        });
        return apiOk(row, 201);
      }
      default:
        throw new Error("Unsupported entityType");
    }
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = (await request.json()) as { entityType: string; payload: unknown };

    switch (body.entityType) {
      case "topic": {
        const payload = questionnaireTopicSchema.parse(body.payload);
        if (!payload.id) throw new Error("id is required");
        const before = await prisma.questionnaireTopic.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
        const row = await prisma.questionnaireTopic.update({
          where: { id: payload.id },
          data: { name_tr: payload.name_tr, name_en: payload.name_en },
        });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_TOPIC_UPDATED", entityType: "QuestionnaireTopic", entityId: row.id, beforeValueJson: before, afterValueJson: row });
        return apiOk(row);
      }
      case "questionnaire": {
        const payload = questionnaireSchema.parse(body.payload);
        if (!payload.id) throw new Error("id is required");
        const before = await prisma.questionnaire.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
        const row = await prisma.questionnaire.update({
          where: { id: payload.id },
          data: { name_tr: payload.name_tr, name_en: payload.name_en, type: payload.type, description: payload.description },
        });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_UPDATED", entityType: "Questionnaire", entityId: row.id, beforeValueJson: before, afterValueJson: row });
        return apiOk(row);
      }
      case "section": {
        const payload = questionnaireSectionSchema.parse(body.payload);
        if (!payload.id) throw new Error("id is required");
        const before = await prisma.questionnaireSection.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
        const row = await prisma.questionnaireSection.update({
          where: { id: payload.id },
          data: { name: payload.name, orderIndex: payload.orderIndex || 0 },
        });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_SECTION_UPDATED", entityType: "QuestionnaireSection", entityId: row.id, beforeValueJson: before, afterValueJson: row });
        return apiOk(row);
      }
      case "subsection": {
        const payload = questionnaireSubsectionSchema.parse(body.payload);
        if (!payload.id) throw new Error("id is required");
        const before = await prisma.questionnaireSubsection.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
        const row = await prisma.questionnaireSubsection.update({
          where: { id: payload.id },
          data: { name: payload.name, orderIndex: payload.orderIndex || 0 },
        });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_SUBSECTION_UPDATED", entityType: "QuestionnaireSubsection", entityId: row.id, beforeValueJson: before, afterValueJson: row });
        return apiOk(row);
      }
      case "question": {
        const payload = questionnaireQuestionSchema.parse(body.payload);
        if (!payload.id) throw new Error("id is required");
        const before = await prisma.questionnaireQuestion.findFirstOrThrow({ where: { id: payload.id, organizationId: user.organizationId } });
        const row = await prisma.questionnaireQuestion.update({
          where: { id: payload.id },
          data: {
            questionnaireId: payload.questionnaireId,
            questionnaireSectionId: payload.questionnaireSectionId || null,
            questionnaireSubsectionId: payload.questionnaireSubsectionId || null,
            questionnaireTopicId: payload.questionnaireTopicId || null,
            section: payload.section,
            code: payload.code,
            title: payload.title,
            question_text: payload.question_text,
            unit: payload.unit,
            owner_name: payload.owner_name,
            owner_department: payload.owner_department,
            owner_email: payload.owner_email,
            helper: payload.helper,
            example: payload.example,
            reminder: payload.reminder,
            video_link: payload.video_link,
          },
        });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_QUESTION_UPDATED", entityType: "QuestionnaireQuestion", entityId: row.id, beforeValueJson: before, afterValueJson: row });
        return apiOk(row);
      }
      default:
        throw new Error("Unsupported entityType");
    }
  } catch (error) {
    return apiError(error, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = (await request.json()) as { entityType: string; id: string };

    switch (body.entityType) {
      case "topic": {
        const before = await prisma.questionnaireTopic.findFirstOrThrow({ where: { id: body.id, organizationId: user.organizationId } });
        await prisma.questionnaireTopic.delete({ where: { id: body.id } });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_TOPIC_DELETED", entityType: "QuestionnaireTopic", entityId: body.id, beforeValueJson: before });
        return apiOk({ success: true });
      }
      case "questionnaire": {
        const before = await prisma.questionnaire.findFirstOrThrow({ where: { id: body.id, organizationId: user.organizationId } });
        await prisma.questionnaire.delete({ where: { id: body.id } });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_DELETED", entityType: "Questionnaire", entityId: body.id, beforeValueJson: before });
        return apiOk({ success: true });
      }
      case "section": {
        const before = await prisma.questionnaireSection.findFirstOrThrow({ where: { id: body.id, organizationId: user.organizationId } });
        await prisma.questionnaireSection.delete({ where: { id: body.id } });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_SECTION_DELETED", entityType: "QuestionnaireSection", entityId: body.id, beforeValueJson: before });
        return apiOk({ success: true });
      }
      case "subsection": {
        const before = await prisma.questionnaireSubsection.findFirstOrThrow({ where: { id: body.id, organizationId: user.organizationId } });
        await prisma.questionnaireSubsection.delete({ where: { id: body.id } });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_SUBSECTION_DELETED", entityType: "QuestionnaireSubsection", entityId: body.id, beforeValueJson: before });
        return apiOk({ success: true });
      }
      case "question": {
        const before = await prisma.questionnaireQuestion.findFirstOrThrow({ where: { id: body.id, organizationId: user.organizationId } });
        await prisma.questionnaireQuestion.delete({ where: { id: body.id } });
        await createAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTIONNAIRE_QUESTION_DELETED", entityType: "QuestionnaireQuestion", entityId: body.id, beforeValueJson: before });
        return apiOk({ success: true });
      }
      default:
        throw new Error("Unsupported entityType");
    }
  } catch (error) {
    return apiError(error, 400);
  }
}
