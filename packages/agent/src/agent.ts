import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import {
  searchCode,
  SearchCodeInput,
  getFile,
  GetFileInput,
  listFiles,
  ListFilesInput,
  summarizeFile,
  SummarizeFileInput,
} from "./tools";

export type AgentAnswer = {
  answer: string;
  citations: Array<{ path: string; snippet: string }>;
};

const systemPrompt = `
You are a codebase explainer. Always cite files using the tools.
If context is missing, call tools to fetch it.
Return a short answer and a list of citations with file paths and snippets.
`.trim();

function buildTool<T extends z.ZodTypeAny>(
  name: string,
  description: string,
  schema: T,
  handler: (args: z.infer<T>) => Promise<unknown>
) {
  return new DynamicStructuredTool({
    name,
    description,
    schema,
    func: async (args) => JSON.stringify(await handler(args)),
  });
}

export async function runAgent(question: string): Promise<AgentAnswer> {
  const model = new ChatOpenAI({
    modelName: "gpt-4.1",
    temperature: 0.2,
  });

  const tools = [
    buildTool(
      "search_code",
      "Search code by semantic + keyword retrieval",
      SearchCodeInput,
      searchCode
    ),
    buildTool(
      "get_file",
      "Get file contents by path with optional range",
      GetFileInput,
      getFile
    ),
    buildTool(
      "list_files",
      "List available files for a repo",
      ListFilesInput,
      listFiles
    ),
    buildTool(
      "summarize_file",
      "Summarize a file for quick understanding",
      SummarizeFileInput,
      summarizeFile
    ),
  ];

  const response = await model.invoke([
    ["system", systemPrompt],
    ["user", question],
  ], { tools });

  const text = typeof response.content === "string" ? response.content : "";

  return {
    answer: text,
    citations: [],
  };
}
