import { BoxAgentDB } from "@box/types";

const enum PipelineResult {
  STOP = 'STOP', // Got what we wanted
  CONTINUE = 'CONTINUE', // Continue in normal flow
  NEW_STAGE = 'NEW_STAGE', // Go into new branch
}

export interface BoxPipelineStage {
  previousStage: BoxPipelineStage | null;
  nextStage: BoxPipelineStage | null;
  inputs: Record<string, any>;
  run: () => Promise<{ result: PipelineResult }>;
}

export class BoxPipeline {
  sharedContext: Record<string, any>;

  constructor(sharedContext: Record<string, any>) {
    this.sharedContext = sharedContext;
  }
}

export class BoxAgent {
  dbInfo: BoxAgentDB;
  pipeline: BoxPipeline;

  constructor(dbInfo: BoxAgentDB, pipeline: BoxPipeline) {
    this.dbInfo = dbInfo;
    this.pipeline = pipeline;
  }
}
