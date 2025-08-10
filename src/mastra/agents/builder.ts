import { SYSTEM_MESSAGE } from "@/lib/system";
import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import { todoTool } from "@/tools/todo-tool";
import { morphTool } from "@/tools/morph-tool";
import { FreestyleDevServerFilesystem } from "freestyle-sandboxes";

export const memory = new Memory({
  options: {
    lastMessages: 1000,
    semanticRecall: false,
    threads: {
      generateTitle: true,
    },
  },
  vector: new PgVector({
    connectionString: process.env.DATABASE_URL!,
  }),
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL!,
  }),
  processors: [],
});

export const builderAgent = new Agent({
  name: "BuilderAgent",
  model: anthropic("claude-3-7-sonnet-20250219"),
  instructions: SYSTEM_MESSAGE,
  memory,
  tools: {
    update_todo_list: todoTool,
  },
});

// Attach Morph edit_file tool at runtime when MORPH_API_KEY is present.
// We pass the FreestyleDevServerFilesystem instance from the active dev server context.
export function registerMorphTool(fs: FreestyleDevServerFilesystem) {
  if (process.env.MORPH_API_KEY) {
    builderAgent.registerTools({
      morph: {
        edit_file: morphTool(fs),
      },
    });
  }
}
