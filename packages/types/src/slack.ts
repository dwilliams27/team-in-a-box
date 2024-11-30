export const SLACK_DATA_ID_PREFIX = 'slack_data';

export interface SlackEvent {
  user: string;
  text: string;
  team: string;
  type: string;
  blocks: any[];
  client_msg_id: string;
  channel: string;
  event_ts: string;
  event_context: string;
  subtype?: string;
}

export interface SlackDataDB {
  reference: string;
  event: SlackEvent;
  embedding: number[];
  sourceEventReference: string;
}
