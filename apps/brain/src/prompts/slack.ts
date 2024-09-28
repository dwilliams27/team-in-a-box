import { BoxPrompt } from "@brain/prompts/prompt";

export const PROMPT_ACTION_POST_SLACK = BoxPrompt.fromTemplate(`
  You have decided to post a message to Slack, with the goal of {goal}.
`);

