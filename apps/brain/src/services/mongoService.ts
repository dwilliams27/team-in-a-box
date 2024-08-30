import { MongoClient, Db } from 'mongodb';
import { InjectableService } from '@brain/services/injectableService';
import { ServiceLocator } from '@brain/services/serviceLocator';

const DB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/BoxDB';
const MONGO_SERVICE_NAME = 'MONGO_SERVICE';

export class MongoService extends InjectableService {
  client: MongoClient;
  db: Db | null = null;

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, MONGO_SERVICE_NAME);
    this.client = new MongoClient(DB_URI);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      console.log('Connected to MongoDB');
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
}
