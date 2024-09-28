// TODO: Rethink where this fits in

// import { z } from "zod";

// export enum BaseActions {
//   POST_TO_SLACK = 'POST_TO_SLACK',
// }

// const decideNextActionSchema = z.object({
//   action: z
//     .nativeEnum(BaseActions)
//     .describe("Possible actions to think more about then take."),
//   goal: z.string().describe("The goal you hope to accomplish by taking this action."),
// });

// const decideNextActionTool = tool(
//   async ({ action, goal }) => {
//     // Just need args, noop for now
//   },
//   {
//     name: "decideNextAction",
//     description: "Select an action to take next.",
//     schema: decideNextActionSchema,
//   }
// );
