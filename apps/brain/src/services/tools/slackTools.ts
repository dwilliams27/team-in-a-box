import { OutboundEventNames } from "@box/types";
import { ServiceLocator } from "@brain/services";
import { OUTBOUND_EVENT_SERVICE_NAME, OutboundEventService } from "@brain/services/outboundEventService";
import { SharedContext } from "@brain/services/agents/stateMachine";
import { BoxTool } from "@brain/services/tools/toolService";
import { z } from "zod";

export enum SlackChannel {
  general = 'general'
}

export const POST_SLACK_TOOL_NAME = 'postToSlack';
const PostToSlackToolSchema = z.object({
  message: z.string().describe("The message you would like to post."),
  channel: z
    .nativeEnum(SlackChannel)
    .describe("The channel to post your message to."),
});
type PostToSlackToolArgs = z.infer<typeof PostToSlackToolSchema>;

export class PostToSlackTool extends BoxTool {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      name: POST_SLACK_TOOL_NAME,
      description: "Posts a message to a specific Slack channel.",
      singleton: true,
      schema: PostToSlackToolSchema
    });
  }

  async invoke(toolArgs: PostToSlackToolArgs, sharedContext: SharedContext) {
    const outboundEventService: OutboundEventService = this.serviceLocator.getService(OUTBOUND_EVENT_SERVICE_NAME);
    outboundEventService.queueEvent({
      name: OutboundEventNames.SLACK_POST_MESSAGE,
      payload: {
        message: toolArgs.message,
        channel: toolArgs.channel,
        agentId: sharedContext.personaInformation?.id || null,
      }
    });
    return { success: true, result: {} };
  }
}
