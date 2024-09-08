import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BOX_DB_OUTBOUND_EVENT_STREAM_COLLECTION, EventStreamStatus, OUTBOUND_EVENT_STREAM_ID_PREFIX, OutboundEvent } from "@box/types";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/mongoService";
import { nanoid } from "nanoid";

export const OUTBOUND_EVENT_SERVICE_NAME = 'OUTBOUND_EVENT_SERVICE';

export class OutboundEventService extends InjectableService {
  mongoService: MongoService;
  
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, OUTBOUND_EVENT_SERVICE_NAME);
    this.mongoService = serviceLocator.getService(MONGO_SERVICE_NAME);
  }

  async queueEvent(event: OutboundEvent) {
    const eventStreamCollection = this.mongoService.getDb().collection(BOX_DB_OUTBOUND_EVENT_STREAM_COLLECTION);
    console.log(await eventStreamCollection.find());

    await eventStreamCollection.insertOne({
      id: `${OUTBOUND_EVENT_STREAM_ID_PREFIX}_${nanoid()}`,
      status: EventStreamStatus.PENDING,
      slack: event
    });
  }
}
