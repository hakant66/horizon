import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { similaritySearch } from "./vector-store";

export const LLM_PROVIDERS = {
  openai: {
    label: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT-4o (En Güçlü)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Hızlı)" },
    ],
  },
  anthropic: {
    label: "Anthropic",
    models: [
      { id: "claude-opus-4-7", label: "Claude Opus 4.7 (En Güçlü)" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Dengeli)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Hızlı)" },
    ],
  },
  google: {
    label: "Google",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (En Güçlü)" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Hızlı)" },
    ],
  },
} as const;

export type LlmProvider = keyof typeof LLM_PROVIDERS;

export async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  const client = new OpenAI({ apiKey: openaiApiKey });
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

async function callLLM(
  provider: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (provider === "openai") {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });
    return res.choices[0].message.content ?? "{}";
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = res.content[0];
    return block.type === "text" ? block.text : "{}";
  }

  if (provider === "google") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({ model });
    const res = await gemini.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    return res.response.text();
  }

  throw new Error(`Unknown LLM provider: ${provider}`);
}

function resolveApiKey(provider: string, settings: { openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null }): string {
  if (provider === "openai") return settings.openaiApiKey ?? "";
  if (provider === "anthropic") return settings.anthropicApiKey ?? "";
  if (provider === "google") return settings.googleApiKey ?? "";
  return "";
}

const SETUP_SYSTEM = `You are a sustainability data extraction assistant. Given context from company documents, extract organization setup information and return ONLY a valid JSON object. Use null for fields not found in the context. Never invent data.`;

const SETUP_SCHEMA = `{
  "name": "string | null — official company name",
  "taxId": "string | null — tax/VKN number",
  "sector": "string | null — industry sector",
  "naceCode": "string | null — NACE code e.g. C26.2",
  "naceDescription": "string | null — NACE description",
  "employeeCount": "number | null — total employees",
  "headquartersCountry": "string | null — 2-letter country code e.g. TR",
  "reportingCurrency": "string | null — currency code e.g. TRY"
}`;

const ESG_SYSTEM = `You are a sustainability data extraction assistant. Given context from sustainability documents, extract ESG metrics and return ONLY a valid JSON object. Use null for fields not found. Never invent data. Numbers must be numeric (no units in value).`;

const ESG_SCHEMA = `{
  "legalName": "string|null",
  "brandPortfolio": "string|null — brands/subsidiaries",
  "naceCode": "string|null",
  "sectorDescription": "string|null",
  "operatingCountries": "string|null — comma-separated",
  "reportBoundaryNote": "string|null",
  "totalEmployees": "number|null",
  "employeeBlueCollar": "number|null",
  "employeeWhiteCollar": "number|null",
  "employeeMale": "number|null",
  "employeeFemale": "number|null",
  "employeePermanent": "number|null",
  "employeeTemporary": "number|null",
  "femaleManagerPercent": "number|null — %",
  "employeeTurnoverRate": "number|null — %",
  "avgTrainingHoursPerEmployee": "number|null",
  "lostTimeInjuryRate": "number|null",
  "supplierSocialAuditConducted": "boolean|null",
  "annualRevenue": "number|null — in reporting currency",
  "ebitda": "number|null",
  "netProfit": "number|null",
  "totalAssets": "number|null",
  "totalEquity": "number|null",
  "rdExpenditure": "number|null",
  "sustainabilityCapexForecast": "number|null",
  "scope1Emissions": "number|null — tCO2e",
  "scope2Emissions": "number|null — tCO2e",
  "scope3Emissions": "number|null — tCO2e",
  "annualElectricityConsumption": "number|null — kWh or MWh",
  "annualNaturalGasConsumption": "number|null",
  "annualFuelConsumption": "number|null",
  "renewableEnergyPercent": "number|null — %",
  "annualWaterWithdrawal": "number|null — m3",
  "wasteRecyclingRate": "number|null — %",
  "sustainabilityGovernanceBody": "string|null",
  "businessResilienceAssessment": "string|null",
  "antiBriberyPolicyUpdated": "boolean|null",
  "gdprKvkkPolicyUpdated": "boolean|null",
  "climateRiskInRiskRegister": "boolean|null"
}`;

// ─── Materiality ────────────────────────────────────────────────────────────
const MATERIALITY_SYSTEM = `You are a sustainability materiality expert. Given context from company documents, identify ESG topics and assess their materiality scores. Return ONLY a valid JSON object. Never invent scores — base them on evidence in the text. Use 1-5 integer scale.`;

const MATERIALITY_SCHEMA = `{
  "topics": [
    {
      "name": "string — ESG topic name in Turkish (e.g. İklim Değişikliği, Su Yönetimi)",
      "financialImpactScore": "integer 1-5 — financial impact on the company",
      "impactSeverityScore": "integer 1-5 — severity of company impact on environment/society",
      "likelihoodScore": "integer 1-5 — likelihood of the topic materializing",
      "stakeholderConcernScore": "integer 1-5 — stakeholder concern level"
    }
  ]
}`;

// ─── Metrics ─────────────────────────────────────────────────────────────────
const METRICS_SYSTEM = `You are a sustainability data extraction expert. Given context from company documents and a list of metric definitions, extract numeric values for each metric. Return ONLY a valid JSON object. Use null for metrics not found. Never invent values.`;

// ─── Questionnaire ────────────────────────────────────────────────────────────
const QUESTIONNAIRE_SYSTEM = `You are a sustainability reporting expert. Given context from company documents and a list of questionnaire questions, provide concise, factual answers based only on the document content. Return ONLY a valid JSON object. Use null for questions not answerable from the documents. Answers should be in Turkish.`;

export type MaterialityTopic = {
  name: string;
  financialImpactScore: number;
  impactSeverityScore: number;
  likelihoodScore: number;
  stakeholderConcernScore: number;
};

export async function ragQueryMateriality(
  organizationId: string,
  settings: { llmProvider: string; llmModel: string; openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null },
): Promise<MaterialityTopic[]> {
  const openaiKey = settings.openaiApiKey;
  if (!openaiKey) throw new Error("OpenAI API key required for embeddings");
  const genKey = resolveApiKey(settings.llmProvider, settings);
  if (!genKey) throw new Error(`${settings.llmProvider} API key required`);

  const queryEmbedding = await generateEmbedding(
    "materiality ESG topics importance risks opportunities sustainability issues stakeholder concern climate energy waste water governance",
    openaiKey,
  );
  const chunks = await similaritySearch(organizationId, queryEmbedding, 20);
  if (chunks.length === 0) throw new Error("No indexed content found. Please run 'Yapay Zeka Kullan' first.");

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n---\n\n");
  const userPrompt = `Identify ESG materiality topics for this company from the documents. Score each 1-5. Return JSON matching this schema:\n${MATERIALITY_SCHEMA}\n\nContext:\n${context}`;

  const raw = await callLLM(settings.llmProvider, settings.llmModel, genKey, MATERIALITY_SYSTEM, userPrompt);
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : raw) as { topics?: unknown[] };
  if (!Array.isArray(parsed.topics)) return [];

  return (parsed.topics as MaterialityTopic[]).filter(
    (t) => t.name && typeof t.financialImpactScore === "number",
  );
}

export async function ragQueryMetrics(
  organizationId: string,
  metrics: Array<{ id: string; name: string; unit: string }>,
  settings: { llmProvider: string; llmModel: string; openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null },
): Promise<Record<string, number>> {
  const openaiKey = settings.openaiApiKey;
  if (!openaiKey) throw new Error("OpenAI API key required for embeddings");
  const genKey = resolveApiKey(settings.llmProvider, settings);
  if (!genKey) throw new Error(`${settings.llmProvider} API key required`);

  const queryEmbedding = await generateEmbedding(
    "metrics data emissions energy water waste employees revenue assets turnover financial performance",
    openaiKey,
  );
  const chunks = await similaritySearch(organizationId, queryEmbedding, 20);
  if (chunks.length === 0) throw new Error("No indexed content found.");

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n---\n\n");
  const metricList = metrics.map((m) => `"${m.id}": "${m.name} (${m.unit})"`).join(",\n  ");
  const schema = `{\n  ${metricList}\n}\n// Values must be numbers or null`;

  const userPrompt = `Extract numeric values for these metrics from the documents. Return JSON where keys are metric IDs and values are numbers (or null if not found):\n${schema}\n\nContext:\n${context}`;

  const raw = await callLLM(settings.llmProvider, settings.llmModel, genKey, METRICS_SYSTEM, userPrompt);
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : raw) as Record<string, unknown>;

  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === "number" && !Number.isNaN(v)) result[k] = v;
  }
  return result;
}

export async function ragQueryQuestionnaire(
  organizationId: string,
  questions: Array<{ id: string; code: string | null; title: string; question_text: string }>,
  settings: { llmProvider: string; llmModel: string; openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null },
): Promise<Record<string, string>> {
  const openaiKey = settings.openaiApiKey;
  if (!openaiKey) throw new Error("OpenAI API key required for embeddings");
  const genKey = resolveApiKey(settings.llmProvider, settings);
  if (!genKey) throw new Error(`${settings.llmProvider} API key required`);

  const queryEmbedding = await generateEmbedding(
    "sustainability governance policy ESG questionnaire answers corporate reporting practices",
    openaiKey,
  );
  const chunks = await similaritySearch(organizationId, queryEmbedding, 20);
  if (chunks.length === 0) throw new Error("No indexed content found.");

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n---\n\n");
  // Batch to max 30 questions to avoid token overflow
  const batch = questions.slice(0, 30);
  const questionList = batch
    .map((q) => `"${q.id}": "${q.code ? `[${q.code}] ` : ""}${q.title}: ${q.question_text}"`)
    .join(",\n  ");
  const schema = `{\n  ${questionList}\n}\n// Values must be answer strings (Turkish) or null`;

  const userPrompt = `Answer these sustainability questionnaire questions based on the documents. Return JSON where keys are question IDs and values are answer strings in Turkish (or null if not found):\n${schema}\n\nContext:\n${context}`;

  const raw = await callLLM(settings.llmProvider, settings.llmModel, genKey, QUESTIONNAIRE_SYSTEM, userPrompt);
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : raw) as Record<string, unknown>;

  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === "string" && v.trim()) result[k] = v.trim();
  }
  return result;
}

export async function ragQuery(
  target: "setup" | "esg",
  organizationId: string,
  settings: { llmProvider: string; llmModel: string; openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null },
): Promise<Record<string, unknown>> {
  const openaiKey = settings.openaiApiKey;
  if (!openaiKey) throw new Error("OpenAI API key required for embeddings");

  const genKey = resolveApiKey(settings.llmProvider, settings);
  if (!genKey) throw new Error(`${settings.llmProvider} API key required`);

  const query = target === "setup"
    ? "company name tax ID sector NACE code employees headquarters currency"
    : "ESG emissions employees revenue assets scope 1 2 3 sustainability governance water waste recycling";

  const queryEmbedding = await generateEmbedding(query, openaiKey);
  const chunks = await similaritySearch(organizationId, queryEmbedding, 15);

  if (chunks.length === 0) throw new Error("No indexed content found. Please run 'Yapay Zeka Kullan' first.");

  const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n---\n\n");

  const systemPrompt = target === "setup" ? SETUP_SYSTEM : ESG_SYSTEM;
  const schema = target === "setup" ? SETUP_SCHEMA : ESG_SCHEMA;
  const userPrompt = `Extract the requested information from the following document context. Return JSON matching this schema:\n${schema}\n\nContext:\n${context}`;

  const raw = await callLLM(settings.llmProvider, settings.llmModel, genKey, systemPrompt, userPrompt);

  // Extract JSON from response (handle markdown fences)
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  // Remove null values to avoid overwriting existing data with null
  return Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined));
}
