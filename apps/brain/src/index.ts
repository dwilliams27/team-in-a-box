import { AgentService, ServiceLocator } from '@brain/services';
import { GPTService } from '@brain/services/gptService';
import { MongoService } from '@brain/services/mongoService';
import { POLL_SERVICE_NAME, PollService } from '@brain/services/pollService';
import { ToolService } from '@brain/services/tools/toolService';
import chalk from 'chalk';
import dotenv from 'dotenv';
import process from "node:process";

dotenv.config();

class App {
  db: MongoService;
  rootServiceLocator: ServiceLocator;

  constructor() {
    console.log(`🧠 ${chalk.green('started')}`);
    this.rootServiceLocator = new ServiceLocator();
    this.db = new MongoService(this.rootServiceLocator);

    this.db.connect().then(() => {
      this.registerRootServices();
      this.mainInit();
    }).catch(error => {
      console.error('Error during initialization:', error);
      process.exit(1);
    });
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log(chalk.red('Shutting down...'));
      await this.db.client.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log(chalk.red('Shutting down...'));
      await this.db.client.close();
      process.exit(0);
    });
  }

  registerRootServices() {
    // Services auto-register themselves with the root service locator
    // so dont need to save refs
    // Order matters :yikes:
    new ToolService(this.rootServiceLocator);
    new AgentService(this.rootServiceLocator);
    new PollService(this.rootServiceLocator);
    if (process.env.OPENAI_API_KEY) {
      new GPTService(this.rootServiceLocator, process.env.OPENAI_API_KEY);
    } else {
      console.error('Unable to create GPT service, missing OPENAI_API_KEY');
      process.exit(1);
    }
  }

  async mainInit() {
    const pollService = this.rootServiceLocator.getService<PollService>(POLL_SERVICE_NAME);
    await pollService.startPollingForBrainEvents();
  }
}

new App();
