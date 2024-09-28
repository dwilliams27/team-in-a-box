import { BoxPrompt } from "@brain/prompts/prompt";

/*
- Thought:
  - System information
  - Project information
  - Task information (Ticket level?)
  - Event information (Optional? Maybe this is where triggering event goes)
  - Context (related slack messages, etc)
  - TOOL: Decide next action
- Action:
  - *
  - Action information (Action name, goal)
  - TOOLS: Many options depending on action type
*/

export const PROMPT_BASE_INFORMATION = BoxPrompt.fromTemplate(`
  {system_information}
  {project_information}
  {task_information}
  {event_information}
  {context}
`);

export const PROMPT_THOUGHT_SYSTEM_INFO = BoxPrompt.fromTemplate(`
  You are a {job_title} on a high-performing development team.
`);

export const PROMPT_THOUGHT_PROJECT_INFO = BoxPrompt.fromTemplate(`
  Your team is tasked with {project}.
`);

export const PROMPT_THOUGHT_TASK_INFO = BoxPrompt.fromTemplate(`
  You are currently working on {task}.
`);

export const PROMPT_THOUGHT_EVENT_INFO = BoxPrompt.fromTemplate(`
  You recently received this event: {event}.
`);
