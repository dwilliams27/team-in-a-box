import { DataSource, EntityTarget, ObjectLiteral, Repository } from "typeorm";
import { ServiceLocator, LocatableService } from '@brain/services/serviceLocator';
import { BOX_DB_NAME, BOX_DB_SLACK_DATA_COLLECTION, SLACK_NUM_CONTEXT_EVENTS, SlackDataDB, SlackEvent } from '@box/types';
import { LLM_SERVICE_NAME, LLMService } from '@brain/services/llmService';
import { EInboundEvent } from "@brain/db/entities/inbound-event";
import { EPersona } from "@brain/db/entities/persona";
import { ESlackData } from "@brain/db/entities/slack-data";
import { BoxRepository } from "@brain/utils/dbHelper";

export const DB_SERVICE_NAME = 'DB_SERVICE';

export class DbService extends LocatableService {
  dataSource: DataSource;
  db: DataSource | null = null;

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, DB_SERVICE_NAME);
    this.dataSource = new DataSource({
      type: "postgres",
      host: process.env.NEON_DB_HOST,
      port: 5432,
      username: process.env.NEON_DB_USER,
      password: process.env.NEON_DB_PASS,
      database: process.env.NEON_DB_NAME,
      entities: [EInboundEvent, EPersona, ESlackData],
      synchronize: true,
      logging: false,
    });
  }

  async connect(): Promise<void> {
    try {
      this.db = await this.dataSource.initialize();
      this.log('Connected to DB');
    } catch (error) {
      console.error('Error connecting to DB:', error);
      process.exit(1);
    }
  }

  getDb(): DataSource {
    if (!this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.db;
  }

  getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): BoxRepository<T> {
    return this.getDb().getRepository(entity);
  }

  async querySlackVectorStore(query: string): Promise<SlackEvent[]> {
    const gptService = this.serviceLocator.getService<LLMService>(LLM_SERVICE_NAME);
    const embedding = await gptService.generateEmbedding(query);

    const slackRepository = this.getRepository(ESlackData);
    const results = await slackRepository
        .createQueryBuilder('doc')
        .select()
        .addSelect(`1 - (doc.embedding <=> :queryEmbedding) as similarity`)
        .setParameter('queryEmbedding', `[${embedding.join(",")}]`)
        .orderBy('similarity', 'DESC')
        .limit(SLACK_NUM_CONTEXT_EVENTS)
        .getRawMany();

    if (!results) {
      console.error('Slack vector query failed');
      return [];
    }
    return (results as SlackDataDB[]).map((slackDBItem) => slackDBItem.event);
  }
}
