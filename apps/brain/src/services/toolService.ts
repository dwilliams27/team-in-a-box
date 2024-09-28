import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
import { Tool } from "@brain/tools/tool";

export const TOOL_SERVICE_NAME = 'TOOL_SERVICE';

export class ToolService extends InjectableService {
  tools: Record<string, Tool<any>> = {};

  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, TOOL_SERVICE_NAME);
  }

  registerTool(tool: Tool<any>) {
    this.tools[tool.name] = tool;
  }

  getTool(name: string) {
    return this.tools[name];
  }
}
