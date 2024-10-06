import { ServiceLocator, LocatableService } from "@brain/services/serviceLocator";
import { BOX_DB_INBOUND_EVENT_STREAM_COLLECTION, BOX_DB_PERSONA_COLLECTION, BoxPersonaDB, EventStreamStatus, EventType, InboundEventStreamDB } from "@box/types";
import { MONGO_SERVICE_NAME, MongoService } from "@brain/services/mongoService";
import { Collection } from "mongodb";
import { AGENT_SERVICE_NAME, AgentService } from "@brain/services/agents/agentService";
import { SLACK_AGENT_NAME, SlackAgent } from "@brain/services/agents/slackAgent";
import chalk from "chalk";

export const POLL_SERVICE_NAME = 'POLL_SERVICE';

export class PollService extends LocatableService {
  mongoService: MongoService;
  
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, POLL_SERVICE_NAME);
    this.mongoService = serviceLocator.getService(MONGO_SERVICE_NAME);
  }

  async startPollingForBrainEvents() {
    console.log(chalk.yellow('Initializing brain event poll'));
    const inboundEventsCollection = this.mongoService.getCollection<InboundEventStreamDB>(BOX_DB_INBOUND_EVENT_STREAM_COLLECTION);
    const personasCollection = this.mongoService.getCollection<BoxPersonaDB>(BOX_DB_PERSONA_COLLECTION);
    const agentService = this.serviceLocator.getService<AgentService>(AGENT_SERVICE_NAME);

    let personas = await personasCollection.find({}).toArray();
    while (personas.length > 0) {
      console.log(chalk.blueBright('Polling'));
      const newEvent = await inboundEventsCollection.find({ type: EventType.BRAIN, status: EventStreamStatus.PENDING }).toArray();
      if (newEvent.length > 0 && newEvent[0] && personas[0]) {
        console.log(chalk.yellow('New event found'), newEvent[0]);
        let processing_error = null;
        try {
          await this.getEventLock(newEvent[0], inboundEventsCollection);
          const slackAgent = agentService.getAgent<SlackAgent>(SLACK_AGENT_NAME);
          const matchedPersona = personas.find(persona => persona.id === newEvent[0]?.brain?.forPersona?.id || persona.name === newEvent[0]?.brain?.forPersona?.name);
          await slackAgent.executeMachineForPersona({ persona: matchedPersona || personas[0], inputContext: {} });
        } catch (e) {
          console.error('Error processing event:', e);
          // TODO: Bad
          processing_error = JSON.stringify(e);
        } finally {
          await inboundEventsCollection.updateOne({ id: newEvent[0].id }, { $set: { status: EventStreamStatus.PROCESSED, processing_error } });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`No personas found, exiting...`);
  }

  async getEventLock(event: InboundEventStreamDB, eventCollection: Collection<InboundEventStreamDB>) {
    await eventCollection.updateOne({ id: event.id }, { $set: { status: EventStreamStatus.PROCESSING } });
  }
}
