import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BOX_DB_INBOUND_EVENT_STREAM_COLLECTION, BOX_DB_OUTBOUND_EVENT_STREAM_COLLECTION, BOX_DB_PERSONA_COLLECTION, BoxPersonaDB, EventStreamStatus, EventType, InboundEventStreamDB, OUTBOUND_EVENT_STREAM_ID_PREFIX, OutboundEvent } from "@box/types";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/mongoService";
import { nanoid } from "nanoid";

export const POLL_SERVICE_NAME = 'POLL_SERVICE';

export class PollService extends InjectableService {
  mongoService: MongoService;
  
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, POLL_SERVICE_NAME);
    this.mongoService = serviceLocator.getService(MONGO_SERVICE_NAME);
  }

  async startPollingForBrainEvents() {
    const inboundEventsCollection = this.mongoService.getCollection<InboundEventStreamDB>(BOX_DB_INBOUND_EVENT_STREAM_COLLECTION);
    const personasCollection = this.mongoService.getCollection<BoxPersonaDB>(BOX_DB_PERSONA_COLLECTION);

    let personas = await personasCollection.find({}).toArray();
    while (personas.length > 0) {
      const newEvent = await inboundEventsCollection.find({ type: EventType.BRAIN, status: EventStreamStatus.PENDING }).toArray();

      if (newEvent.length > 0) {
        // Process event
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`No personas found, exiting...`);
  }
}
