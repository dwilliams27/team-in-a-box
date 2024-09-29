import { OutboundEventNames } from "@box/types";
import { BoxAgent } from "@brain/agents/agent";
import { ServiceLocator } from "@brain/services";
import { OUTBOUND_EVENT_SERVICE_NAME, OutboundEventService } from "@brain/services/outboundEventService";
import { BoxTool } from "@brain/tools/tool";
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

export class PostToSlackTool implements BoxTool<PostToSlackToolArgs> {
  schema = PostToSlackToolSchema;
  name = POST_SLACK_TOOL_NAME;
  description = "Posts a message to a specific Slack channel.";
  serviceLocator: ServiceLocator;

  constructor(serviceLocator: ServiceLocator) {
    this.serviceLocator = serviceLocator;
  }

  async invoke(toolArgs: PostToSlackToolArgs, agent: BoxAgent) {
    const outboundEventService: OutboundEventService = this.serviceLocator.getService(OUTBOUND_EVENT_SERVICE_NAME);
    outboundEventService.queueEvent({
      name: OutboundEventNames.SLACK_POST_MESSAGE,
      payload: {
        message: toolArgs.message,
        channel: toolArgs.channel,
        agentId: agent.personaFromDB?.id || null,
      }
    });
    return { sucess: true };
  }
}
