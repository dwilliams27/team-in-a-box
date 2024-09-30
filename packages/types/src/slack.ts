export const SLACK_DATA_ID_PREFIX = 'slack_data';

export interface SlackEvent {
  user: string;
  text: string;
  type: string;
  subtype?: string;
  client_msg_id: string;
  channel: string;
  event_ts: string;
  event_context: string;
}

export interface SlackMessageDB {
  id: string;
  event: SlackEvent;
  sourceEvent: string;
  embedding: number[];
}
