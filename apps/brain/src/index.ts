import { AGENT_SERVICE_NAME, AgentService } from '@brain/services/agents/agentService';
import { CodeAgent } from '@brain/services/agents/codeAgent';
import { SlackAgent } from '@brain/services/agents/slackAgent';
import { LLMService } from '@brain/services/llmService';
import { MongoService } from '@brain/services/dbService';
import { POLL_SERVICE_NAME, PollService } from '@brain/services/pollService';
import { ServiceLocator } from '@brain/services/serviceLocator';
import { ToolService } from '@brain/services/tools/toolService';
import chalk from 'chalk';
import dotenv from 'dotenv';
import process from "node:process";
import "reflect-metadata";

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
      new LLMService(this.rootServiceLocator);
    } else {
      console.error(chalk.red('Unable to find OPENAI_API_KEY'));
      process.exit(1);
    }

    this.registerRootAgents();
  }

  registerRootAgents() {
    const agentService = this.rootServiceLocator.getService<AgentService>(AGENT_SERVICE_NAME);
    agentService.registerNewAgent(new SlackAgent(this.rootServiceLocator));
    agentService.registerNewAgent(new CodeAgent(this.rootServiceLocator));
  }

  async mainInit() {
    const pollService = this.rootServiceLocator.getService<PollService>(POLL_SERVICE_NAME);
    await pollService.startPollingForBrainEvents();
  }
}

new App();
