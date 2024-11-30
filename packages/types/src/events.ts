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

export const INBOUND_EVENT_STREAM_ID_PREFIX = 'ievent';
export const OUTBOUND_EVENT_STREAM_ID_PREFIX = 'oevent';

export enum EventStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED"
}

export interface EventProcessingMetadata {
  status: EventStatus;
  started_at: Date | null;
  error: string | null;
}

export interface EventDB {
  reference: string;
  processing: EventProcessingMetadata;
  pre_processing: EventProcessingMetadata;
}

export interface InboundEventDB extends EventDB {
  type: EventType;
  for_personas: string[];
  slack?: SlackEvent;
}

export interface OutboundEventDB extends EventDB  {
  slack?: SlackEvent;
}

