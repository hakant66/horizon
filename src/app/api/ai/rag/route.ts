import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { ragQuery, ragQueryMateriality, ragQueryMetrics, ragQueryQuestionnaire } from "@/lib/rag";

type RagSettings = {
  llmProvider: string;
  llmModel: string;
  openaiApiKey?: string | null;
  anthropicApiKey?: string | null;
  googleApiKey?: string | null;
  indexedChunks?: number | null;
};

async function getSettings(organizationId: string): Promise<RagSettings> {
  const settings = await prisma.aiSettings.findUnique({ where: { organizationId } });
  if (!settings) throw new Error("AI ayarları bulunamadı. Lütfen Bilgi Bankası sayfasında AI ayarlarını yapılandırın.");
  if (!settings.openaiApiKey) throw new Error("OpenAI API anahtarı gerekli (gömülü vektör arama için).");
  return settings;
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER"]);
    const body = (await request.json()) as {
      target: string;
      metrics?: Array<{ id: string; name: string; unit: string }>;
      questions?: Array<{ id: string; code: string | null; title: string; question_text: string }>;
    };
    const { target } = body;

    const settings = await getSettings(user.organizationId);

    // ── setup / esg ───────────────────────────────────────────────────────────
    if (target === "setup" || target === "esg") {
      const fields = await ragQuery(target, user.organizationId, settings);
      return apiOk({ fields, chunkCount: settings.indexedChunks });
    }

    // ── materiality ──────────────────────────────────────────────────────────
    if (target === "materiality") {
      const topics = await ragQueryMateriality(user.organizationId, settings);
      return apiOk({ topics });
    }

    // ── metrics (data collection) ────────────────────────────────────────────
    if (target === "metrics") {
      const metrics = body.metrics ?? [];
      if (metrics.length === 0) return apiError("metrics list required", 400);
      const values = await ragQueryMetrics(user.organizationId, metrics, settings);
      return apiOk({ values });
    }

    // ── questionnaire answers ────────────────────────────────────────────────
    if (target === "questionnaire") {
      const questions = body.questions ?? [];
      if (questions.length === 0) return apiError("questions list required", 400);
      const answers = await ragQueryQuestionnaire(user.organizationId, questions, settings);
      return apiOk({ answers });
    }

    return apiError("target must be 'setup', 'esg', 'materiality', 'metrics', or 'questionnaire'", 400);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("No indexed content")) return apiError(msg, 400);
    return apiError(error, 500);
  }
}
