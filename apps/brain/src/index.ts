import { AgentService, ServiceLocator } from '@brain/services';
import { MongoService } from '@brain/services/mongoService';
import { POLL_SERVICE_NAME, PollService } from '@brain/services/pollService';
import dotenv from 'dotenv';
import process from "node:process";

dotenv.config();

class App {
  db: MongoService;
  rootServiceLocator: ServiceLocator;

  constructor() {
    console.log('🧠 started');
    this.rootServiceLocator = new ServiceLocator();
    this.db = new MongoService(this.rootServiceLocator);

    this.db.connect().then(() => {
      this.mainInit();
    }).catch(error => {
      console.error('Failed to connect to the database:', error);
      process.exit(1);
    });

    this.registerCoreServices();
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await this.db.client.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Shutting down...');
      await this.db.client.close();
      process.exit(0);
    });
  }

  registerCoreServices() {
    // Services auto-register themselves with the root service locator
    // so dont need to save refs
    new AgentService(this.rootServiceLocator);
    new PollService(this.rootServiceLocator);
  }

  async mainInit() {
    const pollService = this.rootServiceLocator.getService<PollService>(POLL_SERVICE_NAME);
    await pollService.startPollingForBrainEvents();
  }
}

new App();
