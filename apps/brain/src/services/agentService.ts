import { BoxPersonaDB } from "@box/types";
import { BoxAgent } from "@brain/agents/agent";
import { SlackAgent } from "@brain/agents/slackAgent";
import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";

export const AGENT_SERVICE_NAME = 'AGENT_SERVICE';

export class AgentService extends InjectableService {
  agents: Record<string, BoxAgent> = {};

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, AGENT_SERVICE_NAME);

    this.registerNewAgent(new SlackAgent(serviceLocator));
  }

  async registerNewAgent(agent: BoxAgent) {
    if (this.agents[agent.name]) {
      throw new Error('Agent already exists!');
    }

    this.agents[agent.name] = agent;
  }

  getAgent<T>(name: string) {
    if (!this.agents[name]) {
      throw new Error('Could not find agent!');
    }
    return this.agents[name] as T;
  }
}
