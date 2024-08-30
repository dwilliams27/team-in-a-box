import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";

export const AGENT_SERVICE_NAME = 'AGENT_SERVICE';

export class AgentService extends InjectableService {
  constructor(serviceLocator: ServiceLocator, agentId: string) {
    super(serviceLocator, AGENT_SERVICE_NAME);
  }
}
