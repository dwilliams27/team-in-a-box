import { BoxPrompt } from "@brain/prompts/prompt";
import { GPT_SERVICE_NAME, GPTService } from "@brain/services/gptService";
import { SharedContext, StateMachine, StateMachineNode, StateTransitionResult } from "@brain/services/agents/stateMachine";
import { GetFileNamesTool, READ_FILE_TOOL_NAME, ReadFileTool, RUN_PROJECT_SCRIPT_TOOL_NAME, RunProjectScriptTool, WRITE_FILE_TOOL_NAME, WriteFileTool } from "@brain/services/tools/codeTools";
import { TOOL_SERVICE_NAME, ToolCallResult, ToolService, TransitionTool, TransitionToolArgs } from "@brain/services/tools/toolService";
import chalk from "chalk";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BoxAgent } from "@brain/services/agents/agentService";

export enum CodeSystemDecisionContextKeys {
  Goal = 'Goal',
}

export enum CodeUserDecisionContextKeys {}

export enum CodeSystemReflectionContextKeys {
  Goal = 'Goal',
  ActionContext = 'ActionContext',
}

export enum CodeUserReflectionContextKeys {}

export enum CodeStateMachineNodes {
  modifyProject = 'modifyProject',
  testProject = 'testProject',
}

class TestProjectNode extends StateMachineNode<CodeStateMachineNodes> {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      possibleTransitions: [],
      nodeName: CodeStateMachineNodes.testProject,
      systemDecisionPrompt: BoxPrompt.fromTemplate(`
        You are an agent that is used for testing computer code.
        You are part of a team of agents trying to emulate a software engineer.
        You will be asked to verify that a project is working as expected and meets the desired goal.
        Your project is written entirely in javascript. It will all be in one file.

        <goal>
        {{${CodeSystemDecisionContextKeys.Goal}}}
        </goal>
      `),
      userDecisionPrompt: BoxPrompt.fromTemplate(``),
      systemReflectionPrompt: BoxPrompt.fromTemplate(`
        You are an agent that is used for testing computer code.
        You are part of a team of agents trying to emulate a software engineer.
        You will be asked to reflect on an action you have just taken.
        You will need to determine if you have accomplished your goal, or if you need to take additional steps.
        Your project is written entirely in javascript. It is all be in one file.

        <goal>
        {{${CodeSystemReflectionContextKeys.Goal}}}
        </goal>

        <recentActionContext>
        {{${CodeSystemReflectionContextKeys.ActionContext}}}
        </recentActionContext>
      `),
      userReflectionPrompt: BoxPrompt.fromTemplate(``),
      context: {},
    });
  }

  async decide(
    sharedContext: SharedContext,
    nodeMap: Record<CodeStateMachineNodes, StateMachineNode<CodeStateMachineNodes>>
  ) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    const toolService = this.serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);

    // Dynamic tools
    const readFileTool = toolService.getTool<ReadFileTool>(READ_FILE_TOOL_NAME, sharedContext);
    const runProjectScriptTool = toolService.getTool<RunProjectScriptTool>(RUN_PROJECT_SCRIPT_TOOL_NAME, sharedContext);

    // Populate prompts
    this.systemDecisionPrompt.setParam(
      CodeSystemDecisionContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );

    const { result, toolCalls } = await gptService.query(
      this.systemDecisionPrompt,
      this.userDecisionPrompt,
      [readFileTool, runProjectScriptTool]
    );

    console.log(`${chalk.yellow(sharedContext.personaInformation?.name)}: ${chalk.blueBright(toolCalls)}`);

    return {
      result,
      toolCalls,
    };
  }

  async reflect(
    sharedContext: SharedContext,
    nodeMap: Record<CodeStateMachineNodes, StateMachineNode<CodeStateMachineNodes>>,
    toolCallResults: ToolCallResult[],
    transitionTool: TransitionTool
  ) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    
    // Populate prompts
    this.systemReflectionPrompt.setParam(
      CodeSystemReflectionContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );
    this.systemReflectionPrompt.setParam(
      CodeSystemReflectionContextKeys.ActionContext,
      sharedContext.goalInformation || 'No recent action.'
    );

    const { result, toolCalls } = await gptService.query(
      this.systemReflectionPrompt,
      this.userReflectionPrompt,
      [transitionTool]
    );

    if (toolCalls && toolCalls.length > 0) {
      const nextNodeName = (JSON.parse(toolCalls[0].call.function.arguments) as TransitionToolArgs).nextDecision;
      const nextNode = this.possibleTransitions.find((node) => node.nodeName === nextNodeName);

      if (!nextNode) {
        throw new Error(`ModifyProjectNode: Unable to find nextNode ${nextNodeName}`);
      }

      return {
        // TODO: Decide output
        output: { result },
        status: StateTransitionResult.CONTINUE,
        context: this.context,
        nextNode,
      };
    }

    return {
      output: {},
      status: StateTransitionResult.STOP,
      context: this.context,
      nextNode: null,
    };
  }
}

class ModifyProjectNode extends StateMachineNode<CodeStateMachineNodes> {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      possibleTransitions: [],
      nodeName: CodeStateMachineNodes.modifyProject,
      systemDecisionPrompt: BoxPrompt.fromTemplate(`
        You are an agent that is used for writing and modifying computer code.
        You are part of a team of agents trying to emulate a software engineer.
        You will be asked to reason about how to modify a project, what changes to make, and whether you need additional context to properly modify the project.
        Your project is written entirely in javascript. It will all be in one file.

        <goal>
        {{${CodeSystemDecisionContextKeys.Goal}}}
        </goal>
      `),
      userDecisionPrompt: BoxPrompt.fromTemplate(``),
      systemReflectionPrompt: BoxPrompt.fromTemplate(`
        You are an agent that is used for writing and modifying computer code.
        You are part of a team of agents trying to emulate a software engineer.
        You will be asked to reflect on an action you have just taken.
        You will need to determine if you have accomplished your goal, or if you need to take additional steps.
        Your project is written entirely in javascript. It is all be in one file.

        <goal>
        {{${CodeSystemDecisionContextKeys.Goal}}}
        </goal>

        <recentActionContext>
        {{${CodeSystemReflectionContextKeys.ActionContext}}}
        </recentActionContext>
      `),
      userReflectionPrompt: BoxPrompt.fromTemplate(``),
      context: {},
    });
  }

  async decide(
    sharedContext: SharedContext,
    nodeMap: Record<CodeStateMachineNodes, StateMachineNode<CodeStateMachineNodes>>
  ) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    const toolService = this.serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);

    // Static tools
    const writeFileTool = toolService.getTool<WriteFileTool>(WRITE_FILE_TOOL_NAME);
    // Dynamic tools
    const readFileTool = toolService.getTool<ReadFileTool>(READ_FILE_TOOL_NAME, sharedContext);
    const runProjectScriptTool = toolService.getTool<RunProjectScriptTool>(RUN_PROJECT_SCRIPT_TOOL_NAME, sharedContext);

    // Populate prompts
    this.systemDecisionPrompt.setParam(
      CodeSystemDecisionContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );

    const { result, toolCalls } = await gptService.query(
      this.systemDecisionPrompt,
      this.userDecisionPrompt,
      [writeFileTool, readFileTool, runProjectScriptTool]
    );

    console.log(`${chalk.yellow(sharedContext.personaInformation?.name)}: ${chalk.blueBright(toolCalls)}`);

    return {
      result,
      toolCalls,
    };
  }

  async reflect(
    sharedContext: SharedContext,
    nodeMap: Record<CodeStateMachineNodes, StateMachineNode<CodeStateMachineNodes>>,
    toolCallResults: ToolCallResult[],
    transitionTool: TransitionTool
  ) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    
    // Populate prompts
    this.systemReflectionPrompt.setParam(
      CodeSystemReflectionContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );
    this.systemReflectionPrompt.setParam(
      CodeSystemReflectionContextKeys.ActionContext,
      sharedContext.goalInformation || 'No recent action.'
    );

    const { result, toolCalls } = await gptService.query(
      this.systemReflectionPrompt,
      this.userReflectionPrompt,
      [transitionTool]
    );

    if (toolCalls && toolCalls.length > 0) {
      const nextNodeName = (JSON.parse(toolCalls[0].call.function.arguments) as TransitionToolArgs).nextDecision;
      const nextNode = this.possibleTransitions.find((node) => node.nodeName === nextNodeName);

      if (!nextNode) {
        throw new Error(`ModifyProjectNode: Unable to find nextNode ${nextNodeName}`);
      }

      return {
        // TODO: Decide output
        output: { result },
        status: StateTransitionResult.CONTINUE,
        context: this.context,
        nextNode,
      };
    }

    return {
      output: {},
      status: StateTransitionResult.STOP,
      context: this.context,
      nextNode: null,
    };
  }
}

function generateCodeStateMachine(serviceLocator: ServiceLocator) {
  const modifyProjectNode: StateMachineNode<CodeStateMachineNodes> = new ModifyProjectNode(serviceLocator);
  const testProjectNode: StateMachineNode<CodeStateMachineNodes> = new TestProjectNode(serviceLocator);

  modifyProjectNode.possibleTransitions = [testProjectNode];
  testProjectNode.possibleTransitions = [modifyProjectNode];

  return new StateMachine(modifyProjectNode);
}

export const CODE_AGENT_NAME = 'CODE_AGENT';
export class CodeAgent extends BoxAgent {
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, generateCodeStateMachine(serviceLocator), CODE_AGENT_NAME);
  }

  registerTools(): void {
    const toolService = this.serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);
    // wrtiefile, readfile, getfilenames, runScript, 
    toolService.registerTool(new WriteFileTool(this.serviceLocator), this.sharedContext.personaInformation);
    toolService.registerTool(new ReadFileTool(this.serviceLocator), this.sharedContext.personaInformation);
    toolService.registerTool(new GetFileNamesTool(this.serviceLocator), this.sharedContext.personaInformation);
    toolService.registerTool(new RunProjectScriptTool(this.serviceLocator), this.sharedContext.personaInformation);
  }
}
