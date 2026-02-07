import OpenAI from "openai";

const MODEL = "text-embedding-3-large";

export type EmbeddingResult = {
  input: string;
  vector: number[];
};

export async function embedTexts(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return [];

  const client = new OpenAI({ apiKey: Bun.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({
    model: MODEL,
    input: texts,
  });

  return response.data.map((item, index) => ({
    input: texts[index],
    vector: item.embedding,
  }));
}
