import { BrainEvent } from "./brain";
import { SlackEvent } from "./slack";

export const InboundEventNames = {
  // Slack
  SLACK_MESSAGE_POSTED: 'SLACK_MESSAGE_POSTED',
  SLACK_MESSAGE_REACTION: 'SLACK_MESSAGE_REACTION',

  // Github
  GH_PR_POSTED: 'GH_PR_POSTED',
  GH_PR_COMMENT: 'GH_PR_COMMENT',
} as const;
export type TInboundEventNames = keyof typeof InboundEventNames;

export const OutboundEventNames = {
  // Slack
  SLACK_POST_MESSAGE: 'SLACK_POST_MESSAGE',
  SLACK_REACT: 'SLACK_REACT',

  // Github
  GH_POST_PR_COMMENT: 'GH_POST_PR_COMMENT',
  GH_READ_PR_STATUS: 'GH_READ_PR_STATUS',

  // Tickets
  TICKET_POST_COMMENT: 'TICKET_POST_COMMENT',
} as const;
export type TOutboundEventNames = keyof typeof OutboundEventNames;

export enum EventType {
  GITHUB = 'GITHUB',
  SLACK = 'SLACK',
  TICKET = 'TICKET',
  BRAIN = 'BRAIN',
}
export type TEventType = keyof typeof EventType;

export interface InboundEvent {
  name: TInboundEventNames;
  agentFriendlyDescription: string;
  payload: any;
}

export interface OutboundEvent {
  name: TOutboundEventNames;
  payload: any;
}

export interface SlackMessagePayload {
  user: string;
  text: string;
  client_msg_id: string;
  channel: string;
  event_ts: string;
  event_context: string;
}

export class InboundSlackMessagePostedEvent implements InboundEvent {
  name = InboundEventNames.SLACK_MESSAGE_POSTED;
  agentFriendlyDescription = 'test';
  payload: SlackMessagePayload;

  constructor(payload: SlackMessagePayload) {
    this.payload = payload;
  }
}

export const INBOUND_EVENT_STREAM_ID_PREFIX = 'inbound_event';
export const OUTBOUND_EVENT_STREAM_ID_PREFIX = 'outbound_event';

export enum EventStreamStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED"
}

export interface InboundEventStreamDB {
  id: string;
  status: EventStreamStatus;
  processing_started_at?: Date;
  processing_error: string | null;
  type: EventType;
  slack?: SlackEvent;
  brain?: BrainEvent;
}

export interface OutboundEventStreamDB {
  id: string;
  status: EventStreamStatus;
  slack?: SlackEvent;
}

