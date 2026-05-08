/**
 * Ollama AI client — targets self-hosted Ollama with QWEN2.5 (32B or smaller).
 * Falls back gracefully when Ollama is unavailable so the rest of the app keeps working.
 */

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:32b";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiChatOptions {
  messages: OllamaMessage[];
  /** Max tokens to generate. Default 1024. */
  maxTokens?: number;
  /** Temperature 0–1. Default 0.3 (factual, structured output). */
  temperature?: number;
}

export interface AiChatResult {
  content: string;
  model: string;
  durationMs: number;
}

/**
 * Send a chat request to Ollama and return the assistant message.
 * Throws with a descriptive message when Ollama is unreachable.
 */
export async function ollamaChat(options: AiChatOptions): Promise<AiChatResult> {
  const { messages, maxTokens = 1024, temperature = 0.3 } = options;
  const start = Date.now();

  const body = {
    model: OLLAMA_MODEL,
    messages,
    stream: false,
    options: {
      temperature,
      num_predict: maxTokens,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // 120 second timeout — LLM inference can be slow
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Ollama unreachable at ${OLLAMA_BASE}: ${msg}. Ensure Ollama is running and the model "${OLLAMA_MODEL}" is pulled.`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    message?: { content: string };
    model?: string;
  };

  return {
    content: data.message?.content ?? "",
    model: data.model ?? OLLAMA_MODEL,
    durationMs: Date.now() - start,
  };
}

/**
 * List models available on the Ollama server.
 * Returns an empty array when Ollama is unreachable.
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    return data.models?.map((m) => m.name) ?? [];
  } catch {
    return [];
  }
}
