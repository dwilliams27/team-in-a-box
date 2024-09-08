import { BOX_DB_INBOUND_EVENT_STREAM_COLLECTION, BOX_DB_NAME, SlackEvent, INBOUND_EVENT_STREAM_ID_PREFIX, EventStreamStatus, EventType, InboundEventStreamDB } from "@box/types";
import { nanoid } from "nanoid";

export async function processSlackEvent(event: SlackEvent, dbClient: any) {
  if (event.subtype) {
    console.log('Ignoring message, subtype not supported');
    return;
  }
  const eventStreamCollection = dbClient.db(BOX_DB_NAME).collection(BOX_DB_INBOUND_EVENT_STREAM_COLLECTION);

  const item: InboundEventStreamDB = {
    id: `${INBOUND_EVENT_STREAM_ID_PREFIX}_${nanoid()}`,
    status: EventStreamStatus.PENDING,
    type: EventType.SLACK,
    slack: event,
    processing_error: null
  }

  await eventStreamCollection.insertOne(item);
}
