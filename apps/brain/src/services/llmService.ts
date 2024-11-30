import { BoxPrompt } from "@brain/prompts/prompt";
import { ServiceLocator, LocatableService } from "@brain/services/serviceLocator";
import { zodFunction } from "openai/helpers/zod";
import OpenAI from "openai";
// Yikes?
import { ChatCompletionMessageToolCall } from "openai/resources/index.mjs";
import { BoxTool } from "@brain/services/tools/toolService";
import { ShellSession } from "@brain/utils/shellSession";

export interface BoxToolCall {
  tool: BoxTool;
  call: ChatCompletionMessageToolCall;
}

export interface CompletionResult {
  result: any;
  toolCalls: BoxToolCall[] | null;
}

export const LLM_SERVICE_NAME = 'LLM_SERVICE';

export class LLMService extends LocatableService {
  shellSession: ShellSession | null = null;
  totalTokens = 0;

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, LLM_SERVICE_NAME);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
  
    if (!embedding.data[0]?.embedding) {
      throw new Error('Problem generating embedding');
    }
  
    return embedding.data[0].embedding;
  }

  async query(systemPrompt: BoxPrompt, userPrompt: BoxPrompt, tools: BoxTool[]): Promise<CompletionResult> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const parsedTools = tools.map((tool) => {
      if (!tool.schema) {
        throw new Error('Tool schema must be initialized');
      }
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

    const toolCalls = result.choices[0]?.message.tool_calls?.reduce((acc: BoxToolCall[], call) => {
      const tool = tools.find((tool) => tool.name === call.function.name);
      if (!tool) {
        console.error(`??? Tool not found: ${call.function.name}`);
        return acc;
      }
      acc.push({ call, tool });
      return acc;
    }, []) || null;

    this.log([JSON.stringify(result || '')]);

    this.totalTokens += result.usage?.total_tokens || 0;
    this.log(
      [
        'LLM query result',
        'Tool calls',
        'Tokens used'
      ],
      [
        result.choices[0]?.message.content || 'null',
        result.choices[0]?.message.tool_calls?.map((toolCall) => `${toolCall.function.name}: ${toolCall.function.arguments.concat('|')}`).join(', '),
        `${result.usage?.total_tokens || 0} (${this.totalTokens} total)`
      ]
    );

    return { result, toolCalls };
  }
}
