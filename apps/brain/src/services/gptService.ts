import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import OpenAI from "openai";

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
}
