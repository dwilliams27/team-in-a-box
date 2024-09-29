import { ServiceLocator } from "@brain/services";
import { ZodType } from "zod";

export interface BoxTool<T> {
  schema: ZodType<T>;
  name: string;
  description: string;
  serviceLocator: ServiceLocator;
  invoke: (toolArgs: T, agentContext: any) => Promise<any>;
}
