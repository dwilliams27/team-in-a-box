import { LocatableService, ServiceLocator } from "@brain/services/serviceLocator";

export const BRAIN_EVENT_SERVICE_NAME = 'BRAIN_EVENT_SERVICE';

export class BrainEventService extends LocatableService {
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, BRAIN_EVENT_SERVICE_NAME);
  }

  processRecentEvents() {

  }
}
