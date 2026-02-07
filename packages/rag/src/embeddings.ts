import OpenAI from "openai";

const MODEL = "text-embedding-3-large";
const TOKEN_BUDGET = 250_000;
const MAX_INPUTS_PER_BATCH = 128;

export type EmbeddingResult = {
  input: string;
  vector: number[] | null;
};

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function buildBatches(texts: string[]) {
  const batches: string[][] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const text of texts) {
    let next = text;
    const estimated = estimateTokens(next);
    if (estimated > TOKEN_BUDGET) {
      const maxChars = TOKEN_BUDGET * 4;
      next = next.slice(0, maxChars);
      console.warn("[embeddings] truncating long chunk for embedding");
    }

    const nextTokens = estimateTokens(next);
    const exceedsBudget =
      currentTokens + nextTokens > TOKEN_BUDGET ||
      current.length >= MAX_INPUTS_PER_BATCH;

    if (exceedsBudget && current.length > 0) {
      batches.push(current);
      current = [];
      currentTokens = 0;
    }

    current.push(next);
    currentTokens += nextTokens;
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

export async function embedTexts(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return [];

  if (!Bun.env.OPENAI_API_KEY || Bun.env.DISABLE_EMBEDDINGS === "true") {
    return texts.map((input) => ({ input, vector: null }));
  }

  try {
    const client = new OpenAI({ apiKey: Bun.env.OPENAI_API_KEY });
    const batches = buildBatches(texts);
    const results: EmbeddingResult[] = [];

    for (const batch of batches) {
      const response = await client.embeddings.create({
        model: MODEL,
        input: batch,
      });
      response.data.forEach((item, index) => {
        results.push({
          input: batch[index],
          vector: item.embedding,
        });
      });
    }

    return results;
  } catch (error: any) {
    const message = String(error?.message ?? error);
    if (message.includes("429")) {
      console.warn("[embeddings] quota exceeded, falling back to keyword-only");
      return texts.map((input) => ({ input, vector: null }));
    }
    throw error;
  }
}
