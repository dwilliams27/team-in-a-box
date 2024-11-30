import { ServiceLocator, LocatableService } from "@brain/services/serviceLocator";
import { BoxPersonaDB, BrainEventStreamDB, EventStatus } from "@box/types";
import { DB_SERVICE_NAME, DbService } from "@brain/services/dbService";
import { AGENT_SERVICE_NAME, AgentService } from "@brain/services/agents/agentService";
import chalk from "chalk";
import { EInboundEvent } from "@brain/db/entities/inbound-event";
import { EPersona } from "@brain/db/entities/persona";
import { Repository } from "typeorm";
import { BoxRepository, updateJsonbFieldShallow } from "@brain/utils/dbHelper";
import e from "express";

export const POLL_SERVICE_NAME = 'POLL_SERVICE';

export class PollService extends LocatableService {
  dbService: DbService;
  
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, POLL_SERVICE_NAME);
    this.dbService = serviceLocator.getService(DB_SERVICE_NAME);
  }

  async startPollingForBrainEvents() {
    console.log(chalk.yellow('Initializing brain event poll'));
    const inboundEventsRepository = this.dbService.getRepository(EInboundEvent);
    const personasRepository = this.dbService.getRepository(EPersona);
    const agentService = this.serviceLocator.getService<AgentService>(AGENT_SERVICE_NAME);

    let personas = await personasRepository.find();
    while (personas.length > 0) {
      console.log(chalk.blueBright('Polling'));
      const newEvents = await inboundEventsRepository
        .createQueryBuilder()
        .where("entity.pre_processing->'status' = :value", {
          value: EventStatus.PROCESSED
        })
        .andWhere("entity.processing->'other'->>'field' = :value", { 
          value: EventStatus.PENDING 
        })
        .getMany();
      if (newEvents.length > 0) {
        console.log(chalk.yellow('New events found'), newEvents);
        let processing_error: string | null = null;
        try {
          // Unnecessary unless we have multiple brains
          await this.getEventLocks(newEvents, inboundEventsRepository);
          // TODO: Generate brain events from collection of inbound events. Split out by persona
          
        } catch (e) {
          console.error('Error processing event:', e);
          // TODO: Bad
          processing_error = JSON.stringify(e);
        } finally {
          await this.releaseEventLocks(newEvents, inboundEventsRepository);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`No personas found, exiting...`);
  }

  async handleEvent(event: BrainEventStreamDB, agentService: AgentService, personas: BoxPersonaDB[]) {

    // switch (event.type) {
    //   case (EventType.SLACK): {
    //     const slackAgent = agentService.getAgent<SlackAgent>(SLACK_AGENT_NAME);
    //     const matchedPersona = personas.find(persona => persona.id === event?.brain?.forPersona?.id || persona.name === newEvent[0]?.brain?.forPersona?.name);
    //     await slackAgent.executeMachineForPersona({ persona: matchedPersona || personas[0], inputContext: {} });
    //   }
    // }
  }

  async getEventLocks(events: EInboundEvent[], eventRepository: Repository<EInboundEvent>) {
    await updateJsonbFieldShallow(eventRepository, 'processing', 'status', EventStatus.PROCESSING, events.map((event) => event.id));
  }

  async releaseEventLocks(events: EInboundEvent[], eventRepository: BoxRepository<EInboundEvent>, error?: string) {
    await updateJsonbFieldShallow(eventRepository, 'processing', 'status', EventStatus.PROCESSED, events.map((event) => event.id));
    await updateJsonbFieldShallow(eventRepository, 'processing', 'error', error || '', events.map((event) => event.id));
  }
}
