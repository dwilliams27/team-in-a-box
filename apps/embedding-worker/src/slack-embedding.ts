import { BOX_DB_INBOUND_EVENT_STREAM_COLLECTION, BOX_DB_SLACK_DATA_COLLECTION, EventStreamStatus, InboundEventStreamDB, SLACK_DATA_ID_PREFIX, SlackEvent, SlackMessageDB } from "@box/types";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import { EmbeddingWorkerEnv } from ".";

export async function handleSlackEmbedding(event: InboundEventStreamDB, db: any, env: EmbeddingWorkerEnv) {
  if (!event.slack) {
    throw new Error("Slack event not found");
  }

  const slackEvent = event.slack;
  const embedding = await generateEmbedding(slackEvent.text, env);

  await insertSlackEmbedding(event.id, event.slack, embedding, db);
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
    throw new Error("Problem generating embedding");
  }

  console.log('Successfully generated embedding');

  return embedding.data[0].embedding;
}

async function insertSlackEmbedding(originalId: string, slackEvent: SlackEvent, embedding: number[], db: any) {
  console.log('Updating DB records...');
  await db.collection(BOX_DB_INBOUND_EVENT_STREAM_COLLECTION).updateOne(
    { id: originalId },
    {
      $set: {
        status: EventStreamStatus.PROCESSED,
      }
    }
  );
  
  const slackRecord: SlackMessageDB = {
    id: `${SLACK_DATA_ID_PREFIX}_${nanoid()}`,
    event: slackEvent,
    embedding,
    sourceEvent: originalId,
  }
  await db.collection(BOX_DB_SLACK_DATA_COLLECTION).insertOne(slackRecord);

  console.log('Done! Inserted new slack record with embedding');
}
