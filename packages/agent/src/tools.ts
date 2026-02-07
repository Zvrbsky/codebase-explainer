import { z } from "zod";
import { retrieveChunks } from "@codebase-explainer/rag";

export const SearchCodeInput = z.object({
  query: z.string().min(1),
  repoId: z.string().min(1),
  topK: z.number().int().min(1).max(20).optional(),
});

export type SearchCodeArgs = z.infer<typeof SearchCodeInput>;

export async function searchCode(args: SearchCodeArgs) {
  const parsed = SearchCodeInput.parse(args);
  return retrieveChunks({
    query: parsed.query,
    repoId: parsed.repoId,
    topK: parsed.topK,
  });
}

export const SummarizeFileInput = z.object({
  path: z.string().min(1),
});

export async function summarizeFile(_args: z.infer<typeof SummarizeFileInput>) {
  // TODO: wire file fetch + LLM summarization.
  return "Not implemented.";
}

export const ListFilesInput = z.object({
  repoId: z.string().min(1),
});

export async function listFiles(_args: z.infer<typeof ListFilesInput>) {
  // TODO: implement file list from storage layer.
  return [];
}

export const GetFileInput = z.object({
  path: z.string().min(1),
  start: z.number().int().min(1).optional(),
  end: z.number().int().min(1).optional(),
});

export async function getFile(_args: z.infer<typeof GetFileInput>) {
  // TODO: implement file fetch with optional range.
  return "";
}
