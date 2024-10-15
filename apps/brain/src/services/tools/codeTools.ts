import { SharedContext } from "@brain/services/agents/stateMachine";
import { REPO_SERVICE_NAME, RepoService } from "@brain/services/repoService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BoxTool } from "@brain/services/tools/toolService";
import { z, ZodType } from "zod";

export const WRITE_FILE_TOOL_NAME = 'writeFile';
const WriteFileToolSchema = z.object({
  fileContents: z.string().describe("The contents of the file."),
  fileName: z
    .string()
    .describe("The name of the file to write to."),
});
type WriteFileToolArgs = z.infer<typeof WriteFileToolSchema>;

export class WriteFileTool extends BoxTool {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      name: WRITE_FILE_TOOL_NAME,
      description: 'Write to a file in your local workspace.',
      singleton: true,
      schema: WriteFileToolSchema
    });
  }

  async invoke(toolArgs: WriteFileToolArgs, sharedContext: SharedContext) {
    if (!sharedContext.personaInformation) {
      throw new Error('No persona information found in shared context');
    }
    const repoService = this.serviceLocator.getService<RepoService>(REPO_SERVICE_NAME);
    const myWorkspace = repoService.getWorkspaceForPersona(sharedContext.personaInformation);
    await myWorkspace.writeFile(toolArgs.fileName, toolArgs.fileContents);
    return {
      success: true,
      result: {},
      gptFriendlyDescription: `You just wrote to a file named ${toolArgs.fileName}. You wrote: <fileContents>${toolArgs.fileContents}</fileContents>`
    };
  }
}

export const READ_FILE_TOOL_NAME = 'readFile';
const ReadFileToolSchema = z.object({
  fileName: z.any(),
});
type ReadFileToolArgs = z.infer<typeof ReadFileToolSchema>;

export class ReadFileTool extends BoxTool {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      name: READ_FILE_TOOL_NAME,
      description: 'Read the contents of a file.',
      singleton: false,
      schema: null
    });
  }

  async populateDynamicSchema(sharedContext: SharedContext) {
    if (!sharedContext.personaInformation) {
      throw new Error('No persona information found in shared context');
    }
    const repoService = this.serviceLocator.getService<RepoService>(REPO_SERVICE_NAME);
    const myWorkspace = repoService.getWorkspaceForPersona(sharedContext.personaInformation);
    const files = await myWorkspace.getFilenames() as [string, ...string[]];
    if (files.length === 0) {
      throw new Error('No files found in workspace');
    }

    this.schema = z.object({
      fileName: z.enum(files).describe("The name of the script to run."),
    });
  }

  async invoke(toolArgs: ReadFileToolArgs, sharedContext: SharedContext) {
    if (!this.schema) {
      throw new Error('Dynamic schema not populated');
    }
    if (!sharedContext.personaInformation) {
      throw new Error('No persona information found in shared context');
    }
    const repoService = this.serviceLocator.getService<RepoService>(REPO_SERVICE_NAME);
    const myWorkspace = repoService.getWorkspaceForPersona(sharedContext.personaInformation);
    const fileContent = await myWorkspace.readFile(toolArgs.fileName);
    return {
      success: true,
      result: { fileContent },
      gptFriendlyDescription: `You just read the contents of a file named ${toolArgs.fileName}. The file contents are: <fileContents>${fileContent}</fileContents>`
    };
  }
}

export const GET_FILE_NAMES_TOOL_NAME = 'getFileNames';
const GetFileNamesToolSchema = z.object({});
type GetFileNamesToolArgs = z.infer<typeof GetFileNamesToolSchema>;

export class GetFileNamesTool extends BoxTool {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      name: GET_FILE_NAMES_TOOL_NAME,
      description: 'Get a list of all files in the current workspace.',
      singleton: true,
      schema: GetFileNamesToolSchema
    });
  }

  async invoke(toolArgs: GetFileNamesToolArgs, sharedContext: SharedContext) {
    if (!sharedContext.personaInformation) {
      throw new Error('No persona information found in shared context');
    }
    const repoService = this.serviceLocator.getService<RepoService>(REPO_SERVICE_NAME);
    const myWorkspace = repoService.getWorkspaceForPersona(sharedContext.personaInformation);
    const filenames = await myWorkspace.getFilenames();
    return {
      success: true,
      result: { filenames },
      gptFriendlyDescription: `You just requested the names of all the files in the workspace. They are: ${filenames.join(',')}`
    };
  }
}

export const RUN_PROJECT_SCRIPT_TOOL_NAME = 'runProjectScript';
const RunProjectScriptToolSchema = z.object({
  scriptName: z.any()
});
type RunProjectScriptToolArgs = z.infer<typeof RunProjectScriptToolSchema>;

export class RunProjectScriptTool extends BoxTool {
  constructor(serviceLocator: ServiceLocator) {
    super({
      serviceLocator,
      name: RUN_PROJECT_SCRIPT_TOOL_NAME,
      description: 'Run a script defined in the package.json file.',
      singleton: false,
      schema: null
    });
  }

  async populateDynamicSchema(sharedContext: SharedContext) {
    if (!sharedContext.personaInformation) {
      throw new Error('No persona information found in shared context');
    }
    const repoService = this.serviceLocator.getService<RepoService>(REPO_SERVICE_NAME);
    const myWorkspace = repoService.getWorkspaceForPersona(sharedContext.personaInformation);
    const packageJsonRaw = await myWorkspace.readFile('package.json');
    const packageJson = JSON.parse(packageJsonRaw);
    const scripts: [string, ...string[]] = Object.keys(packageJson.scripts) as [string, ...string[]];
    if (scripts.length === 0) {
      throw new Error('No scripts found in package.json');
    }

    this.schema = z.object({
      scriptName: z.enum(scripts).describe("The name of the script to run."),
    });
  }

  async invoke(toolArgs: RunProjectScriptToolArgs, sharedContext: SharedContext) {
    if (!this.schema) {
      throw new Error('Dynamic schema not populated');
    }
    if (!sharedContext.personaInformation) {
      throw new Error('No persona information found in shared context');
    }
    const repoService = this.serviceLocator.getService<RepoService>(REPO_SERVICE_NAME);
    const myWorkspace = repoService.getWorkspaceForPersona(sharedContext.personaInformation);
    const { stdout, stderr } = await myWorkspace.runProjectScript(toolArgs.scriptName);
    return {
      success: true,
      result: { stdout, stderr },
      gptFriendlyDescription: `You just ran the script ${toolArgs.scriptName}. The results were: <stdout>${stdout}</stdout> <stderr>${stderr}</stderr>`
    };
  }
}
