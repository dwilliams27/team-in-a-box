import { BoxPrompt } from "@brain/prompts/prompt";
import { GPT_SERVICE_NAME, GPTService } from "@brain/services/gptService";
import { SharedContext, StateMachineNode, StateTransitionResult } from "@brain/services/agents/stateMachine";
import { READ_FILE_TOOL_NAME, ReadFileTool, RUN_PROJECT_SCRIPT_TOOL_NAME, RunProjectScriptTool, WRITE_FILE_TOOL_NAME, WriteFileTool } from "@brain/services/tools/codeTools";
import { TOOL_SERVICE_NAME, ToolCallResult, ToolService } from "@brain/services/tools/toolService";
import chalk from "chalk";
import { ServiceLocator } from "@brain/services/serviceLocator";

export enum CodeSystemContextKeys {}

export enum CodeUserContextKeys {
  Goal = 'Goal'
}

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
      userPrompt: BoxPrompt.fromTemplate(`
        You are a code agent.
        You will be asked to reason about how to modify a project, what changes to make, and whether you need additional context to properly modify the project.
        You are part of a team of agents trying to emulate a software engineer.
      `),
      systemPrompt: BoxPrompt.fromTemplate(`
        By modifying this project, you are trying to:
        {{${CodeUserContextKeys.Goal}}}
      `),
      context: {},
    });
  }

  async decide(sharedContext: SharedContext, nodeMap: Record<CodeStateMachineNodes, StateMachineNode<CodeStateMachineNodes>>) {
    const gptService = this.serviceLocator.getService<GPTService>(GPT_SERVICE_NAME);
    const toolService = this.serviceLocator.getService<ToolService>(TOOL_SERVICE_NAME);
    // Static tools
    const writeFileTool = toolService.getTool<WriteFileTool>(WRITE_FILE_TOOL_NAME);

    // Dynamic tools
    const readFileTool = toolService.getTool<ReadFileTool>(READ_FILE_TOOL_NAME, sharedContext);
    const runProjectScriptTool = toolService.getTool<RunProjectScriptTool>(RUN_PROJECT_SCRIPT_TOOL_NAME, sharedContext);

    // Populate prompts
    this.userPrompt.setParam(
      CodeUserContextKeys.Goal,
      sharedContext.goalInformation || 'No goal.'
    );

    const { result, toolCalls } = await gptService.query(this.systemPrompt, this.userPrompt, [writeFileTool, readFileTool, runProjectScriptTool]);

    console.log(`${chalk.yellow(sharedContext.personaInformation?.name)}: ${chalk.blueBright(toolCalls)}`);

    return {
      result,
      toolCalls,
    };
  }

  async reflect(sharedContext: SharedContext, nodeMap: Record<CodeStateMachineNodes, StateMachineNode<CodeStateMachineNodes>>, toolCallResults: ToolCallResult[]) {
    // TODO actually reflect
    return {
      output: {},
      status: StateTransitionResult.CONTINUE,
      context: {},
      nextNode: null,
    };
  }
}

// TODO the rest
