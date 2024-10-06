import { BoxPersonaDB } from "@box/types";
import { ServiceLocator, LocatableService } from "@brain/services/serviceLocator";
import { SharedContext, StateMachine } from "@brain/services/agents/stateMachine";

export class BoxAgent {
  name: string;
  serviceLocator: ServiceLocator;
  stateMachine: StateMachine<string>;
  sharedContext: SharedContext;

  constructor(serviceLocator: ServiceLocator, stateMachine: StateMachine<string>, name: string) {
    this.serviceLocator = serviceLocator;
    this.stateMachine = stateMachine;
    this.name = name;
    this.sharedContext = { agentInformation: this };
  }

  async executeMachineForPersona(opts: { persona: BoxPersonaDB, inputContext: Record<string, any> }) {
    this.stateMachine.entryNode.mergeContext(opts.inputContext);
    this.sharedContext = {
      ...this.sharedContext,
      personaInformation: opts.persona,
    };

    return this.stateMachine.execute(this.sharedContext);
  }
}

export const AGENT_SERVICE_NAME = 'AGENT_SERVICE';

export class AgentService extends LocatableService {
  agents: Record<string, BoxAgent> = {};

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, AGENT_SERVICE_NAME);
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
