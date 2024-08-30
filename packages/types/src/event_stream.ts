import { SlackEvent } from "./slack";

export const EVENT_STREAM_ID_PREFIX = 'event_';

export interface EventStreamDB {
  _id: string;
  id: string;
  slack: SlackEvent;
}
