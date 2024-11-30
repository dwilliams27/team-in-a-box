import { ServiceLocator, LocatableService } from "@brain/services/serviceLocator";
import { BOX_DB_OUTBOUND_EVENT_STREAM_COLLECTION, EventStreamStatus, OUTBOUND_EVENT_STREAM_ID_PREFIX, OutboundEvent, OutboundEventNames, OutboundEventStreamDB, SlackEvent } from "@box/types";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/dbService";
import { genUid } from "@brain/utils/ids";

export const OUTBOUND_EVENT_SERVICE_NAME = 'OUTBOUND_EVENT_SERVICE';

export class OutboundEventService extends LocatableService {
  mongoService: MongoService;
  
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, OUTBOUND_EVENT_SERVICE_NAME);
    this.mongoService = serviceLocator.getService(MONGO_SERVICE_NAME);
  }

  async queueEvent(event: OutboundEvent) {
    const eventStreamCollection = this.mongoService.getCollection<OutboundEventStreamDB>(BOX_DB_OUTBOUND_EVENT_STREAM_COLLECTION);

    switch (event.name) {
      case (OutboundEventNames.SLACK_POST_MESSAGE): {
        await eventStreamCollection.insertOne({
          id: `${OUTBOUND_EVENT_STREAM_ID_PREFIX}_${genUid()}`,
          pre_processing: {
            status: EventStreamStatus.PROCESSED,
            started_at: null,
            error: null
          },
          processing: {
            status: EventStreamStatus.PENDING,
            started_at: null,
            error: null,
          },
          slack: event as unknown as SlackEvent,
        });
        break;
      }
    }
  }
}
