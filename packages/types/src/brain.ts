import { SlackEvent } from "./slack";

export interface Context {
  agentMentalNotes: Record<string, string>;
  metadata: Record<string, string>;
}

export interface SlackContext extends Context {
  slackEvent: SlackEvent;
}

export interface GithubContext extends Context {
  // TODO
}

export interface Thought {
  originContext: Context;
  slackContext: SlackContext;
  githubContext: GithubContext;
}

export interface BrainEvent {
  prompt: string;
}
