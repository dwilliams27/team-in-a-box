import { BoxPrompt } from "@brain/prompts/prompt";
import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BoxTool } from "@brain/tools/tool";
import { zodFunction } from "openai/helpers/zod";
import OpenAI from "openai";
// Yikes?
import { ChatCompletionMessageToolCall } from "openai/resources/index.mjs";

export const GPT_SERVICE_NAME = 'GPT_SERVICE';

export class GPTService extends InjectableService {
  constructor(serviceLocator: ServiceLocator, apiKey: string) {
    super(serviceLocator, GPT_SERVICE_NAME);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
  
    if (!embedding.data[0]?.embedding) {
      throw new Error("Problem generating embedding");
    }
  
    return embedding.data[0].embedding;
  }

  async query(systemPrompt: BoxPrompt, userPrompt: BoxPrompt, tools: BoxTool<any>[]) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const parsedTools = tools.map((tool) => {
      return zodFunction({
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      });
    });

    const result = await openai.chat.completions.create({
      // TODO: Multiple models
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: 'system',
          content: systemPrompt.getPrompt()
        },
        {
          role: 'user',
          content: userPrompt.getPrompt()
        }
      ],
      tools: parsedTools,
    });

    const toolCalls = result.choices[0]?.message.tool_calls?.reduce((acc: Record<string, ChatCompletionMessageToolCall>, tool) => {
      acc[tool.function.name] = tool;
      return acc;
    }, {});

    return { result, toolCalls };
  }
}
