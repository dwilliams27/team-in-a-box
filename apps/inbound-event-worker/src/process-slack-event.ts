import { BOX_DB_EVENT_STREAM_COLLECTION, BOX_DB_NAME, EventStreamDB, SlackEvent, EVENT_STREAM_ID_PREFIX } from "@box/types";
import { nanoid } from "nanoid";

export async function processSlackEvent(event: SlackEvent, dbClient: any) {
  const eventStreamCollection = dbClient.db(BOX_DB_NAME).collection(BOX_DB_EVENT_STREAM_COLLECTION);
  console.log(await eventStreamCollection.find());

  await eventStreamCollection.insertOne({
    id: `${EVENT_STREAM_ID_PREFIX}_${nanoid()}`,
    slack: event
  });
}
