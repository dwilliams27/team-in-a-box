import { MongoClient, Db } from 'mongodb';
import { LocatableService } from '@brain/services/locatableService';
import { ServiceLocator } from '@brain/services/serviceLocator';
import { BOX_DB_NAME, BOX_DB_SLACK_DATA_COLLECTION, SLACK_NUM_CONTEXT_EVENTS, SlackEvent, SlackMessageDB } from '@box/types';
import { GPT_SERVICE_NAME, GPTService } from '@brain/services/gptService';

const DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/BoxDB';
export const MONGO_SERVICE_NAME = 'MONGO_SERVICE';

export class MongoService extends LocatableService {
  client: MongoClient;
  db: Db | null = null;

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, MONGO_SERVICE_NAME);
    this.client = new MongoClient(DB_URI);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(BOX_DB_NAME);
      this.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1);
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.db;
  }

  getCollection<T extends Document>(collectionName: string) {
    return this.getDb().collection<T>(collectionName);
  }

  async querySlackVectorStore(query: string): Promise<SlackEvent[]> {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    const embedding = await gptService.generateEmbedding(query);

    const collection = this.getCollection(BOX_DB_SLACK_DATA_COLLECTION);
    const documents = await collection.aggregate([
      {
        "$vectorSearch": {
          "queryVector": embedding,
          "path": "plot_embedding",
          "numCandidates": 100,
          "limit": SLACK_NUM_CONTEXT_EVENTS,
          // TODO
          // "index",
        }
      }
    ]).toArray();

    if (!documents) {
      console.error('Slack vector query failed');
      return [];
    }
    return (documents as unknown as SlackMessageDB[]).map((slackDBItem) => slackDBItem.event);
  }
}
