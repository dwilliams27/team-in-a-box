import { BoxPersonaDB } from "@box/types";
import { LocatableService } from "@brain/services/locatableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { SharedContext } from "@brain/services/stateMachines";
import { ZodType } from "zod";

export interface ToolCallResult {
  success: boolean;
  result: Record<string, any>;
}

export abstract class BoxTool {
  schema: ZodType<any> | null = null;
  name: string;
  description: string;
  serviceLocator: ServiceLocator;
  singleton: boolean;

  constructor(opts: { serviceLocator: ServiceLocator, name: string, description: string, singleton: boolean, schema: ZodType<any> | null }) {
    this.serviceLocator = opts.serviceLocator;
    this.name = opts.name;
    this.description = opts.description;
    this.singleton = opts.singleton;
    this.schema = opts.schema;
  }

  abstract invoke(toolArgs: any, agentContext: any): Promise<ToolCallResult>;

  async populateDynamicSchema(sharedContext: SharedContext): Promise<void> {
    throw new Error('Dynamic schema not implemented');
  }
}

export const TOOL_SERVICE_NAME = 'TOOL_SERVICE';

export class ToolService extends LocatableService {
  tools: Record<string, BoxTool> = {};
  // Dynamic tools need an instance per persona and shouldnt be shared
  dynamicTools: Record<string, Record<string, BoxTool>> = {};

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, TOOL_SERVICE_NAME);
  }

  registerTool(tool: BoxTool, persona?: BoxPersonaDB) {
    // One instance for everybody
    if (tool.singleton) {
      if (this.tools[tool.name]) {
        console.error(`Tool already exists ${tool.name}`);
        return;
      }
      this.tools[tool.name] = tool;
      return;
    }

    // Else one instance per persona (due to dynamic schema)
    if (!persona) {
      throw new Error('Dynamic tool must be scoped to a persona!');
    }
    if (!this.dynamicTools[persona.id]) {
      this.dynamicTools[persona.id] = {};
    }
    if (this.dynamicTools[persona.id][tool.name]) {
      throw new Error('Tool already exists for persona!');
    }
    this.dynamicTools[persona.id][tool.name] = tool;
  }

  getTool<T>(toolName: string, sharedContext?: SharedContext) {
    // TODO make it more clear, for now just assume dynamic tool if persona passed
    if (sharedContext?.personaInformation) {
      if (!this.dynamicTools[sharedContext.personaInformation.id]) {
        throw new Error('No dynamic tools registered for persona!');
      }
      if (!this.dynamicTools[sharedContext.personaInformation.id][toolName]) {
        throw new Error('Dynamic tool not found for persona!');
      }
      this.dynamicTools[sharedContext.personaInformation.id][toolName].populateDynamicSchema?.(sharedContext);
      return this.dynamicTools[sharedContext.personaInformation.id][toolName] as T;
    }
    if (!this.tools[toolName]) {
      throw new Error('Could not find tool!');
    }
    return this.tools[toolName] as T;
  }
}
