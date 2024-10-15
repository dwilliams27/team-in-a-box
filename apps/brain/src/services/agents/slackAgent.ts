import { BoxPrompt } from "@brain/prompts/prompt";
import { GPT_SERVICE_NAME, GPTService } from "@brain/services/gptService";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/mongoService";
import { SharedContext, StateMachine, StateMachineNode, StateTransitionResult } from "@brain/services/agents/stateMachine";
import { TOOL_SERVICE_NAME, ToolCallResult, ToolService } from "@brain/services/tools/toolService";
import chalk from "chalk";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BoxAgent } from "@brain/services/agents/agentService";
import { POST_SLACK_TOOL_NAME, PostToSlackTool } from "@brain/services/tools/slackTools";

export enum SlackSystemDecisionContextKeys {
  Persona = 'Persona',
  RelaventSlackMessages = 'RelaventSlackMessages',
  Goal = 'Goal',
}

export enum SlackUserDecisionContextKeys {}

export enum SlackSystemReflectionContextKeys {
  ActionContext = 'ActionContext',
  Goal = 'Goal',
}

export enum SlackUserReflectionContextKeys {}

export enum SlackStateMachineNodes {
  postToSlack = 'postToSlack'
}

class PostToSlackNode extends StateMachineNode<SlackStateMachineNodes> {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      possibleTransitions: [],
      nodeName: SlackStateMachineNodes.postToSlack,
      systemDecisionPrompt: BoxPrompt.fromTemplate(`
        You are a slack agent.
        You will be asked to reason about how to respond to messages, what messages to send, and whether you need additional context to properly respond.
        You are part of a team of agents trying to emulate a software engineer.
        {{${SlackSystemDecisionContextKeys.Persona}}}

        Here are some relavent past slack messages (list may be empty):
        {{${SlackSystemDecisionContextKeys.RelaventSlackMessages}}}
        By posting this message, you are trying to:
        {{${SlackSystemDecisionContextKeys.Goal}}}
      `),
      userDecisionPrompt: BoxPrompt.fromTemplate(``),
      systemReflectionPrompt: BoxPrompt.fromTemplate(`
        You are a slack agent.
        You will reflect on an action you just took and decide what to do next.
        You are part of a team of agents trying to emulate a software engineer.

        You were triyng to accomplish this goal: {{${SlackSystemReflectionContextKeys.Goal}}}
        Here is the context about the action you just took: {{${SlackSystemReflectionContextKeys.ActionContext}}}
      `),
      userReflectionPrompt: BoxPrompt.fromTemplate(``),
      context: {},
    });
  }

  async decide(sharedContext: SharedContext, nodeMap: Record<SlackStateMachineNodes, StateMachineNode<SlackStateMachineNodes>>) {
    this.log(`${chalk.yellow('Trying to accomplish goal')} ${chalk.blueBright(sharedContext.goalInformation)}`, [sharedContext.personaInformation?.name || 'unknown_persona']);
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

    // Populate prompts
    this.systemDecisionPrompt.setParam(
      SlackSystemDecisionContextKeys.Persona,
      sharedContext.personaInformation?.system_prompt || 'No personality.'
    );
    this.systemDecisionPrompt.setParam(
      SlackSystemDecisionContextKeys.RelaventSlackMessages,
      JSON.stringify(relatedMessages)
    );
    this.systemDecisionPrompt.setParam(
      SlackSystemDecisionContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );

    const { result, toolCalls } = await gptService.query(this.systemDecisionPrompt, this.userDecisionPrompt, [slackTool]);

    // TODO: clean up filter logic
    const slackToolCall = toolCalls?.find((toolCall) => toolCall.call.function.name === slackTool.name);
    if (sharedContext.personaInformation?.filter && slackToolCall) {
      Object.keys(sharedContext.personaInformation?.filter).forEach((filterKey) => {
        if (slackToolCall?.call.function.arguments) {
          const newArguments = slackToolCall.call.function.arguments.replace(new RegExp(filterKey, 'gi'), sharedContext.personaInformation?.filter?.[filterKey] || '') || '';
          slackToolCall.call.function.arguments = newArguments;
        }
      });
    }

    console.log(`${chalk.yellow(sharedContext.personaInformation?.name)}: ${chalk.blueBright(slackToolCall?.call.function.arguments)}`);

    return {
      result,
      toolCalls,
    };
  }

  async reflect(sharedContext: SharedContext, nodeMap: Record<SlackStateMachineNodes, StateMachineNode<SlackStateMachineNodes>>, toolCallResults: ToolCallResult[]) {
    return {
      output: null,
      status: StateTransitionResult.STOP,
      context: this.context,
      nextNode: null,
    };
  }
}

function generateSlackStateMachine(serviceLocator: ServiceLocator) {
  const entryNode: StateMachineNode<SlackStateMachineNodes> = new PostToSlackNode(serviceLocator);

  return new StateMachine(entryNode);
}

export const SLACK_AGENT_NAME = 'SLACK_AGENT';
export class SlackAgent extends BoxAgent {
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, generateSlackStateMachine(serviceLocator), SLACK_AGENT_NAME);
    const toolService = serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);
    toolService.registerTool(new PostToSlackTool(serviceLocator));

    this.sharedContext.goalInformation = 'Give an introduction to the team.';
  }
}
