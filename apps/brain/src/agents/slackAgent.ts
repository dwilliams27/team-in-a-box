import { BoxAgent, BoxPipeline, BoxPipelineStage, BoxPipelineStageInput, PipelineResult, SharedContext } from "@brain/agents/agent";
import { BoxPrompt } from "@brain/prompts/prompt";
import { ServiceLocator } from "@brain/services";
import { GPT_SERVICE_NAME, GPTService } from "@brain/services/gptService";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/mongoService";
import { TOOL_SERVICE_NAME, ToolService } from "@brain/services/toolService";
import { POST_SLACK_TOOL_NAME, PostToSlackTool } from "@brain/tools/slack";
import chalk from "chalk";

export enum SlackPipelineContextKeys {
  UserPrompt = 'UserPrompt',
  SystemPrompt = 'SystemPrompt'
}

export enum SlackPipelineSystemContextKeys {
  Persona = 'Persona'
}

export enum SlackPipelineUserContextKeys {
  RelaventSlackMessages = 'RelaventSlackMessages',
  Goal = 'Goal'
}

class SlackHeadStage extends BoxPipelineStage {
  async run(sharedContext: SharedContext) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    const mongoService = this.serviceLocator.getService<MongoService>(MONGO_SERVICE_NAME);
    const toolService = this.serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);
    const slackTool = toolService.getTool<PostToSlackTool>(POST_SLACK_TOOL_NAME);

    // Get related slack messages
    const relatedMessages = await mongoService.querySlackVectorStore(BoxPrompt.fromTemplate(`
      Current ticket: {{ticket_information}}
      Goal: {{goal_information}}
    `, {
      ticket_information: sharedContext.ticketInformation || 'No ticket.',
      goal_information: sharedContext.goalInformation || 'No goal.'
    }).getPrompt());

    // Populate context templates
    (this.input.context[SlackPipelineContextKeys.UserPrompt] as BoxPrompt).setParam(
      SlackPipelineUserContextKeys.RelaventSlackMessages,
      JSON.stringify(relatedMessages)
    );
    (this.input.context[SlackPipelineContextKeys.UserPrompt] as BoxPrompt).setParam(
      SlackPipelineUserContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );

    (this.input.context[SlackPipelineContextKeys.SystemPrompt] as BoxPrompt).setParam(
      SlackPipelineSystemContextKeys.Persona,
      sharedContext.personaInformation?.systemPrompt || 'No personality.'
    );

    const { result, toolCalls } = await gptService.query(this.input.context[SlackPipelineContextKeys.SystemPrompt], this.input.context[SlackPipelineContextKeys.UserPrompt], [slackTool]);

    // TODO: clean up filter logic
    if (sharedContext.personaInformation?.filter && toolCalls && toolCalls[slackTool.name]) {
      Object.keys(sharedContext.personaInformation?.filter).forEach((filterKey) => {
        let slackToolCall = toolCalls[slackTool.name];
        if (slackToolCall?.function.arguments) {
          const newArguments = slackToolCall.function.arguments.replace(new RegExp(filterKey, 'gi'), sharedContext.personaInformation?.filter?.[filterKey] || '') || '';
          slackToolCall.function.arguments = newArguments;
        }
      });
    }

    console.log(`${chalk.yellow(sharedContext.personaInformation?.name)}: ${chalk.blueBright(toolCalls?.[slackTool.name]?.function.arguments)}`);

    if (toolCalls) {
      if (toolCalls[slackTool.name]) {
        const slackResult = await slackTool.invoke(JSON.parse(toolCalls[slackTool.name]?.function.arguments || '{}'), sharedContext);
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
      [SlackPipelineContextKeys.SystemPrompt]: BoxPrompt.fromTemplate(`
        You are a slack agent.
        You will be asked to reason about how to respond to messages, what messages to send, and whether you need additional context to properly respond.
        You are part of a team of agents trying to emulate a software engineer.
        {{${SlackPipelineSystemContextKeys.Persona}}}
      `),
      [SlackPipelineContextKeys.UserPrompt]: BoxPrompt.fromTemplate(`
        Here are some relavent past slack messages (list may be empty):
        {{${SlackPipelineUserContextKeys.RelaventSlackMessages}}}
        By posting this message, you are trying to:
        {{${SlackPipelineUserContextKeys.Goal}}}
      `)
    },
    contextSchema: new Set(Object.values(SlackPipelineContextKeys)),
  };

  const stageHead = new SlackHeadStage({ serviceLocator, input: stageHeadInput });
  const pipeline = new BoxPipeline({ stageHead });

  return pipeline;
}

export const SLACK_AGENT_NAME = 'SLACK_AGENT';
export class SlackAgent extends BoxAgent {
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, generateSlackPipeline(serviceLocator), SLACK_AGENT_NAME);
    const toolService = serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);
    toolService.registerTool(new PostToSlackTool(serviceLocator));

    this.sharedContext.goalInformation = 'Give an introduction to the team.';
  }
}
