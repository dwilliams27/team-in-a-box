export const SLACK_DATA_ID_PREFIX = 'slack_data_';

export interface SlackEvent {
  user: string;
  text: string;
  client_msg_id: string;
  channel: string;
  event_ts: string;
  event_context: string;
}

export interface SlackMessageDB {
  id: string;
  event: SlackEvent;
  embedding: number[];
}
