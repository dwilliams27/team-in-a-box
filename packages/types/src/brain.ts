import { SlackEvent } from "./slack";

export interface Context {
  agentMentalNotes: Record<string, string>;
  metadata: Record<string, string>;
}

export interface SlackContext extends Context {
  slackEvent: SlackEvent;
}

export interface Thought {
  originContext: Context;
  slackContext: SlackContext;
}

export interface BrainEvent {
  prompt: string;
  forPersona?: { name?: string, id?: string };
}
