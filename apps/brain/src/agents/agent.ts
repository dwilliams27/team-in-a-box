import { BOX_DB_PERSONA_COLLECTION, BoxPersonaDB } from "@box/types";
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

export enum SharedContextKeys {
  AgentInformation = 'AgentInformation'
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
  
  run(sharedContext: Record<SharedContextKeys, any>): Promise<BoxPipelineStageOutput> {
    throw new Error('Must implement run');
  }

  parsePreviousStage(output: BoxPipelineStageOutput) {
    output.contextSchema.forEach((outputContextName) => {
      if (this.input.contextSchema.has(outputContextName)) {
        this.input.context[outputContextName] = output.context[outputContextName];
      }
    })
  };
}

export class BoxPipeline {
  sharedContext: Record<string, any>;
  stageHead: BoxPipelineStage;
  currentStage: BoxPipelineStage | null;
  stageStack: BoxPipelineStage[];

  constructor(opts: { stageHead: BoxPipelineStage, sharedContext?: Record<SharedContextKeys, any> }) {
    this.sharedContext = opts.sharedContext || {};
    this.stageHead = opts.stageHead;
    this.currentStage = opts.stageHead;
    this.stageStack = [];
  }

  async execute() {
    while (this.currentStage) {
      const executionResult = await this.currentStage.run(this.sharedContext);
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
  serviceLocator: ServiceLocator;
  personaFromDB: BoxPersonaDB | null;
  pipeline: BoxPipeline;

  constructor(serviceLocator: ServiceLocator, pipeline: BoxPipeline) {
    this.serviceLocator = serviceLocator;
    this.pipeline = pipeline;
    this.personaFromDB = null;
  }

  async loadPersonaInfoFromDB(id: string) {
    const dbService = this.serviceLocator.getService<MongoService>(MONGO_SERVICE_NAME);
    const personasCollection = dbService.getCollection(BOX_DB_PERSONA_COLLECTION);
    this.personaFromDB = (await personasCollection.find({ id })) as unknown as BoxPersonaDB;
  }
}
