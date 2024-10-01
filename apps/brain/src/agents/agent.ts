import { BOX_DB_PERSONA_COLLECTION, BoxPersonaDB } from "@box/types";
import { BoxPrompt } from "@brain/prompts/prompt";
import { ServiceLocator } from "@brain/services";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/mongoService";

export const enum PipelineResult {
  STOP = 'STOP', // Got what we wanted
  CONTINUE = 'CONTINUE', // Continue in normal flow
  NEW_STAGE = 'NEW_STAGE', // Go into new branch
}

export interface BoxPipelineStageInput {
  context: Record<string, any>;
  contextSchema: Set<string>;
}

export interface BoxPipelineStageOutput {
  output: any;
  status: PipelineResult;
  context: Record<string, any>;
  contextSchema: Set<string>;
}

export interface SharedContext {
  agentInformation?: BoxAgent,
  personaInformation?: BoxPersonaDB,
  ticketInformation?: string,
  goalInformation?: string,
} 

export class BoxPipelineStage {
  serviceLocator: ServiceLocator;
  previousStage: BoxPipelineStage | null;
  nextStage: BoxPipelineStage | null;
  input: BoxPipelineStageInput;
  
  constructor(opts: {
    serviceLocator: ServiceLocator,
    previousStage?: BoxPipelineStage | null,
    nextStage?: BoxPipelineStage | null,
    input?: BoxPipelineStageInput
  }) {
    this.previousStage = opts.previousStage || null;
    this.nextStage = opts.nextStage || null;
    this.input = opts.input || { context: {}, contextSchema: new Set() };
    this.serviceLocator = opts.serviceLocator;
  }
  
  run(sharedContext: SharedContext): Promise<BoxPipelineStageOutput> {
    throw new Error('Must implement run');
  }

  parsePreviousStage(output: BoxPipelineStageOutput) {
    output.contextSchema.forEach((outputContextName) => {
      if (this.input.contextSchema.has(outputContextName)) {
        this.input.context[outputContextName] = output.context[outputContextName];
      }
    })
  };

  mergeNewInput(input: BoxPipelineStageInput) {
    input.contextSchema.forEach((contextName) => {
      this.input.context[contextName] = input.context[contextName];
      this.input.contextSchema.add(contextName);
    });
  }
}

export class BoxPipeline {
  stageHead: BoxPipelineStage;
  currentStage: BoxPipelineStage | null;
  stageStack: BoxPipelineStage[];

  constructor(opts: { stageHead: BoxPipelineStage }) {
    this.stageHead = opts.stageHead;
    this.currentStage = opts.stageHead;
    this.stageStack = [];
  }

  async execute(sharedContext: SharedContext) {
    while (this.currentStage) {
      const executionResult = await this.currentStage.run(sharedContext);
      switch (executionResult.status) {
        case (PipelineResult.CONTINUE): {
          if (!this.currentStage.nextStage) {
            throw new Error('No further stage in pipeline, cannot continue.');
          }
          this.currentStage.nextStage.parsePreviousStage(executionResult);
          this.currentStage = this.currentStage.nextStage;
          continue;
        }
        case (PipelineResult.STOP): {
          const next = this.stageStack.pop();
          if (next) {
            next.parsePreviousStage(executionResult);
            this.currentStage = next;
            continue;
          }
          return executionResult.output;
        }
        case (PipelineResult.NEW_STAGE): {
          // Push what would have been next onto stack
          if (this.currentStage.nextStage) {
            this.stageStack.push(this.currentStage.nextStage);
          }
          const newStage = executionResult.output as BoxPipelineStage;
          newStage.parsePreviousStage(executionResult);
          this.currentStage = newStage;
          continue;
        }
      }
    }
  }
}

export class BoxAgent {
  name: string;
  serviceLocator: ServiceLocator;
  pipeline: BoxPipeline;
  sharedContext: SharedContext;

  constructor(serviceLocator: ServiceLocator, pipeline: BoxPipeline, name: string) {
    this.serviceLocator = serviceLocator;
    this.pipeline = pipeline;
    this.name = name;
    this.sharedContext = { agentInformation: this };
  }

  async executePipelineForPersona(opts: { persona?: BoxPersonaDB, input?: BoxPipelineStageInput }) {
    if (opts.input) this.pipeline.stageHead.mergeNewInput(opts.input);
    this.sharedContext = {
      ...this.sharedContext,
      personaInformation: opts.persona,
    };

    return this.pipeline.execute(this.sharedContext);
  }

  setInputContextPromptProperty(contextKey: string, promptVariableKey: string, promptVariableValue: string) {
    if (contextKey in this.pipeline.stageHead.input.contextSchema) {
      const prompt = this.pipeline.stageHead.input.context[contextKey] as BoxPrompt;
      (this.pipeline.stageHead.input.context[contextKey] as BoxPrompt).setParam(promptVariableKey, promptVariableValue);
    } else {
      throw new Error(`Context property does not exist on ${this.name}`)
    }
  }
}
