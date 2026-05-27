import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER", "DATA_CONTRIBUTOR", "FINANCE_REVIEWER", "AUDITOR", "HORIZON_CONSULTANT"]);
    const settings = await prisma.aiSettings.findUnique({
      where: { organizationId: user.organizationId },
    });
    if (!settings) return apiOk(null);

    // Mask API keys — only return whether they're set
    return apiOk({
      ...settings,
      openaiApiKey: settings.openaiApiKey ? "***" : null,
      anthropicApiKey: settings.anthropicApiKey ? "***" : null,
      googleApiKey: settings.googleApiKey ? "***" : null,
      hasOpenaiKey: !!settings.openaiApiKey,
      hasAnthropicKey: !!settings.anthropicApiKey,
      hasGoogleKey: !!settings.googleApiKey,
    });
  } catch (error) {
    return apiError(error, 401);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "SUSTAINABILITY_MANAGER"]);
    const body = (await request.json()) as {
      llmProvider?: string;
      llmModel?: string;
      openaiApiKey?: string;
      anthropicApiKey?: string;
      googleApiKey?: string;
    };

    const existing = await prisma.aiSettings.findUnique({
      where: { organizationId: user.organizationId },
    });

    const data = {
      llmProvider: body.llmProvider ?? existing?.llmProvider ?? "openai",
      llmModel: body.llmModel ?? existing?.llmModel ?? "gpt-4o-mini",
      // Only update key if non-empty string provided; "***" means no change
      openaiApiKey: body.openaiApiKey && body.openaiApiKey !== "***"
        ? body.openaiApiKey
        : existing?.openaiApiKey ?? null,
      anthropicApiKey: body.anthropicApiKey && body.anthropicApiKey !== "***"
        ? body.anthropicApiKey
        : existing?.anthropicApiKey ?? null,
      googleApiKey: body.googleApiKey && body.googleApiKey !== "***"
        ? body.googleApiKey
        : existing?.googleApiKey ?? null,
    };

    const settings = await prisma.aiSettings.upsert({
      where: { organizationId: user.organizationId },
      create: { organizationId: user.organizationId, ...data },
      update: data,
    });

    return apiOk({
      ...settings,
      openaiApiKey: settings.openaiApiKey ? "***" : null,
      anthropicApiKey: settings.anthropicApiKey ? "***" : null,
      googleApiKey: settings.googleApiKey ? "***" : null,
      hasOpenaiKey: !!settings.openaiApiKey,
      hasAnthropicKey: !!settings.anthropicApiKey,
      hasGoogleKey: !!settings.googleApiKey,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
