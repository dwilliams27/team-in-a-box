import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { BoxTool } from "@brain/tools/tool";

export const TOOL_SERVICE_NAME = 'TOOL_SERVICE';

export class ToolService extends InjectableService {
  tools: Record<string, BoxTool<any>> = {};

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, TOOL_SERVICE_NAME);
  }

  registerTool(tool: BoxTool<any>) {
    if (this.tools[tool.name]) {
      throw new Error('Tool already exists!');
    }
    this.tools[tool.name] = tool;
  }

  getTool<T>(name: string) {
    if (!this.tools[name]) {
      throw new Error('Could not find tool!');
    }
    return this.tools[name] as T;
  }
}
