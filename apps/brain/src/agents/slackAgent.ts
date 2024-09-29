import { BoxAgent, BoxPipeline, BoxPipelineStage, BoxPipelineStageInput, BoxPipelineStageOutput, PipelineResult, SharedContextKeys } from "@brain/agents/agent";
import { BoxPrompt } from "@brain/prompts/prompt";
import { ServiceLocator } from "@brain/services";
import { GPT_SERVICE_NAME, GPTService } from "@brain/services/gptService";
import { TOOL_SERVICE_NAME, ToolService } from "@brain/services/toolService";
import { POST_SLACK_TOOL_NAME, PostToSlackTool } from "@brain/tools/slack";

class SlackHeadStage extends BoxPipelineStage {
  async run(sharedContext: Record<SharedContextKeys, any>) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    const toolService = this.serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);
    const slackTool = toolService.getTool<PostToSlackTool>(POST_SLACK_TOOL_NAME)
    const { result, toolCalls } = await gptService.query(this.input.context.systemPrompt, this.input.context.userPrompt, [slackTool]);
    if (toolCalls) {
      if (toolCalls[slackTool.name]) {
        const slackResult = await slackTool.invoke(JSON.parse(toolCalls[slackTool.name]?.function.arguments || '{}'), sharedContext[SharedContextKeys.AgentInformation]);
        if (!slackResult.sucess) {
          throw new Error('Failed to post to slack!');
        }
      }
    }
    return {
      output: result.choices[0]?.message,
      status: PipelineResult.STOP,
      context: this.input.context,
      contextSchema: this.input.contextSchema,
    };
  }
}

function generateSlackPipeline(serviceLocator: ServiceLocator) {
  const stageHeadInput: BoxPipelineStageInput = {
    context: {
      systemPrompt: BoxPrompt.fromTemplate(`
        You are a slack agent.
        You will be asked to reason about how to respond to messages, what messages to send, and whether you need additional context to properly respond.
        You are part of a team of agents trying to emulate a software engineer.
        {{persona}}
      `),
      userPrompt: BoxPrompt.fromTemplate(`
        Here are some relavent past slack messages:
        {{relevant_slack_messages}}
        By posting this message, you are trying to:
        {{goal}}
      `)
    },
    contextSchema: new Set(['systemPrompt', 'userPrompt'])
  };

  const stageHead = new SlackHeadStage({ serviceLocator, input: stageHeadInput });
  const pipeline = new BoxPipeline({ stageHead });

  return pipeline;
}

export class SlackAgent extends BoxAgent {
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, generateSlackPipeline(serviceLocator))
  }
}
