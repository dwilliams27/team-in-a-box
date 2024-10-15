import { BoxPrompt } from "@brain/prompts/prompt";
import { GPT_SERVICE_NAME, GPTService } from "@brain/services/gptService";
import { SharedContext, StateMachineNode, StateTransitionResult } from "@brain/services/agents/stateMachine";
import { READ_FILE_TOOL_NAME, ReadFileTool, RUN_PROJECT_SCRIPT_TOOL_NAME, RunProjectScriptTool, WRITE_FILE_TOOL_NAME, WriteFileTool } from "@brain/services/tools/codeTools";
import { TOOL_SERVICE_NAME, ToolCallResult, ToolService, TransitionTool } from "@brain/services/tools/toolService";
import chalk from "chalk";
import { ServiceLocator } from "@brain/services/serviceLocator";

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
  reflect = 'reflect',
  modifyProject = 'modifyProject',
  testProject = 'testProject',
  acceptChanges = 'acceptChanges',
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

        By modifying this project, you are trying to:
        {{${CodeSystemDecisionContextKeys.Goal}}}
      `),
      userDecisionPrompt: BoxPrompt.fromTemplate(``),
      systemReflectionPrompt: BoxPrompt.fromTemplate(`
        You are an agent that is used for writing and modifying computer code.
        You are part of a team of agents trying to emulate a software engineer.
        You will be asked to reflect on an action you have just taken.
        You will need to determine if you have accomplished your goal, or if you need to take additional steps.
        Your project is written entirely in javascript. It is all be in one file.

        By modifying this project, you are trying to:
        {{${CodeSystemReflectionContextKeys.Goal}}}

        Here is information about the action you just took:
        {{${CodeSystemReflectionContextKeys.ActionContext}}}
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

    return {
      output: {},
      status: StateTransitionResult.CONTINUE,
      context: {},
      nextNode: null,
    };
  }
}

// TODO the rest
