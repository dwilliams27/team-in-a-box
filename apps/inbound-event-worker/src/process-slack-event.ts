import { SlackEvent, INBOUND_EVENT_STREAM_ID_PREFIX, EventType, ID_ALPHABET, ID_LENGTH, InboundEventDB, EventStatus } from "@box/types";
import { customAlphabet } from "nanoid";
import { PrismaClient, Prisma } from '@repo/db';

export async function processSlackEvent(event: SlackEvent, dbClient: PrismaClient) {
  if (event.subtype) {
    console.log('Ignoring message, subtype not supported');
    return;
  }
  // For now, everyone hears everything
  const for_personas = ['*'];
  const usersTagged = Array.from(event.text.matchAll(/<@([A-Z0-9]+)>/g)).map(match => match[0]);
  if (usersTagged) {
    for_personas.push(...usersTagged);
  }
  
  // Replace user ids with Persona names
  // Maybe move to some "translateToLLMFriendlyText" function or smth
  const personas = await dbClient.persona.findMany({ where: { slack_user_id: { in: usersTagged } } });
  personas.forEach((persona) => {
    event.text = event.text.replaceAll(`<@${persona.slack_user_id}>`, persona.name);
  });

  const item: InboundEventDB = {
    reference: `${INBOUND_EVENT_STREAM_ID_PREFIX}_${customAlphabet(ID_ALPHABET, ID_LENGTH)()}`,
    processing: {
      status: EventStatus.PENDING,
      started_at: null,
      error: null,
    },
    pre_processing: {
      status: EventStatus.PENDING,
      started_at: null,
      error: null,
    },
    type: EventType.SLACK,
    slack: event,
    for_personas,
  }

  // @ts-expect-error
  await dbClient.inboundEvent.create({ data: item });
}
