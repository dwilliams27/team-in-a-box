import { EventStatus, ID_ALPHABET, ID_LENGTH, InboundEventDB, SLACK_DATA_ID_PREFIX, SlackDataDB, SlackEvent } from "@box/types";
import OpenAI from "openai";
import { EmbeddingWorkerEnv } from ".";
import { customAlphabet } from "nanoid";
import { PrismaClient } from "@box/db-edge";

export async function handleSlackEmbedding(event: InboundEventDB, dbClient: PrismaClient, env: EmbeddingWorkerEnv) {
  if (!event.slack) {
    throw new Error('Slack event not found');
  }

  const slackEvent = event.slack;
  const embedding = await generateEmbedding(slackEvent.text, env);

  await insertSlackEmbedding(event.reference, event.slack, embedding, dbClient);
}

async function generateEmbedding(text: string, env: EmbeddingWorkerEnv): Promise<number[]> {
  console.log('Generating embedding...');
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  if (!embedding.data[0]?.embedding) {
    throw new Error('Problem generating embedding');
  }

  console.log('Successfully generated embedding');

  return embedding.data[0].embedding;
}

async function insertSlackEmbedding(originalReference: string, slackEvent: SlackEvent, embedding: number[], dbClient: PrismaClient) {
  console.log('Updating DB records...');
  const updatedDoc = await dbClient.inboundEvent.update({
    where: {
      reference: originalReference
    },
    data: {
      pre_processing: {
        status: EventStatus.PROCESSED
      }
    }
  });
  
  const slackRecord: SlackDataDB = {
    reference: `${SLACK_DATA_ID_PREFIX}_${customAlphabet(ID_ALPHABET, ID_LENGTH)()}`,
    event: slackEvent,
    embedding,
    sourceEventReference: originalReference,
  }
  // @ts-expect-error
  await dbClient.slackData.create({ data: slackRecord });

  console.log('Done! Inserted new slack record with embedding');
}
