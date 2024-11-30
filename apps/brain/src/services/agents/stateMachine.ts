import { BoxPersonaDB } from "@box/types";
import { BoxPrompt } from "@brain/prompts/prompt";
import { BoxAgent } from "@brain/services/agents/agentService";
import { CompletionResult } from "@brain/services/llmService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BoxTool, ToolCallResult, TransitionTool } from "@brain/services/tools/toolService";
import chalk from "chalk";

export const enum StateTransitionResult {
  STOP = 'STOP', // Goal accomplished
  CONTINUE = 'CONTINUE', // Continue in normal flow
}

export interface StateTransitionInput {
  userPrompt: BoxPrompt;
  systemPrompt: BoxPrompt;
  context: Record<string, any>;
}

export interface StateTransitionOutput<T extends string> {
  output: any;
  status: StateTransitionResult;
  context: Record<string, any>;
  nextNode: StateMachineNode<T> | null;
}

export interface SharedContext {
  agentInformation?: BoxAgent,
  personaInformation?: BoxPersonaDB,
  ticketInformation?: string,
  goalInformation?: string,
}

export abstract class StateMachineNode<T extends string> {
  serviceLocator: ServiceLocator;
  possibleTransitions: StateMachineNode<T>[];
  context: Record<string, any>;
  systemDecisionPrompt: BoxPrompt;
  userDecisionPrompt: BoxPrompt;
  systemReflectionPrompt: BoxPrompt;
  userReflectionPrompt: BoxPrompt;
  nodeName: T;

  _transitionResult?: StateTransitionResult;
  _transitionTool?: BoxTool;
  
  constructor(opts: {
    serviceLocator: ServiceLocator,
    possibleTransitions: StateMachineNode<T>[],
    context: Record<string, any>,
    nodeName: T,
    systemDecisionPrompt: BoxPrompt,
    userDecisionPrompt: BoxPrompt,
    systemReflectionPrompt: BoxPrompt,
    userReflectionPrompt: BoxPrompt,
  }) {
    this.serviceLocator = opts.serviceLocator;
    this.possibleTransitions = opts.possibleTransitions;
    this.context = opts.context;
    this.nodeName = opts.nodeName;
    this.systemDecisionPrompt = opts.systemDecisionPrompt;
    this.userDecisionPrompt = opts.userDecisionPrompt;
    this.systemReflectionPrompt = opts.systemReflectionPrompt;
    this.userReflectionPrompt = opts.userReflectionPrompt;
  }

  abstract decide(sharedContext: SharedContext, nodeMap: Record<T, StateMachineNode<T>>): Promise<CompletionResult>;
  abstract reflect(sharedContext: SharedContext, nodeMap: Record<T, StateMachineNode<T>>, toolCallResults: ToolCallResult[], transitionTool: TransitionTool): Promise<StateTransitionOutput<T>>;
  
  async transition(sharedContext: SharedContext, nodeMap: Record<T, StateMachineNode<T>>): Promise<StateTransitionOutput<T>> {
    console.log(`${chalk.yellow('Executing transition for node:')} ${chalk.blueBright(this.nodeName)} ${chalk.yellow('for persona')} ${chalk.blueBright(sharedContext.personaInformation?.name)}`);
    let toolCallResults: ToolCallResult[] = [];

    // Decide
    const decision = await this.decide(sharedContext, nodeMap);

    // Execute tool calls
    if (decision.toolCalls) {
      const toolPromises = decision.toolCalls.map(async (toolCall) => {
        return toolCall.tool.invoke(JSON.parse(toolCall.call.function.arguments || '{}'), sharedContext);
      });
      toolCallResults = await Promise.all(toolPromises);
      // TODO How to handle errors :thunk:
      toolCallResults.forEach((toolCallResult) => {
        if (!toolCallResult.success) {
          throw new Error('Failed to execute tool!');
        }
      });
    }

    // Construct tool with possible transition options
    const transitionTool: TransitionTool | null = new TransitionTool(this.serviceLocator);
    await transitionTool.populateDynamicSchema(sharedContext);

    // If possible next states, reflect on where to go
    if (transitionTool.schema) {
      const stateTransition = await this.reflect(sharedContext, nodeMap, toolCallResults, transitionTool);
      if (stateTransition.nextNode) {
        stateTransition.nextNode.mergeContext(stateTransition.context);
      }
      return stateTransition;
    }

    return {
      output: {},
      status: StateTransitionResult.STOP,
      context: this.context,
      nextNode: null,
    }
  }

  mergeContext(context: Record<string, any>) {
    Object.keys(context).forEach((outputContextKey) => {
      if (outputContextKey in Object.keys(this.context)) {
        this.context[outputContextKey] = context[outputContextKey];
      }
    })
  };

  log(message: string, contextInfo: string[]) {
    console.log(`${chalk.green(`${this.nodeName}:${contextInfo.join(':')}`)}: ${message}`);
  }
}

export class StateMachine<T extends string> {
  entryNode: StateMachineNode<T>;
  currentNode: StateMachineNode<T> | null;
  // @ts-ignore bruh this is fine
  nodeMap: Record<T, StateMachineNode<T>> = {};

  constructor(entryNode: StateMachineNode<T>) {
    this.entryNode = entryNode;
    this.currentNode = entryNode;
    this.generateNodeMap(entryNode);
  }

  // dfs
  generateNodeMap(node: StateMachineNode<T>) {
    if (this.nodeMap[node.nodeName]) {
      return;
    }
    this.nodeMap[node.nodeName] = node;
    node.possibleTransitions.forEach((transition) => {
      this.generateNodeMap(transition);
    });
  }

  async execute(sharedContext: SharedContext) {
    console.log(`${chalk.yellow('Executing state machine with nodes:')} ${chalk.blueBright(Object.keys(this.nodeMap).join(', '))}`);
    while (this.currentNode) {
      const result = await this.currentNode.transition(sharedContext, this.nodeMap);
      switch (result.status) {
        case (StateTransitionResult.CONTINUE): {
          this.currentNode = result.nextNode;
          continue;
        }
        case (StateTransitionResult.STOP): {
          return result;
        }
      }
    }
  }
}
