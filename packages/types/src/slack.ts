export interface SlackEvent {
  user: string;
  text: string;
  client_msg_id: string;
  channel: string;
  event_ts: string;
  event_context: string;
}
