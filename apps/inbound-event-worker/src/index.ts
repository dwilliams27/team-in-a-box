import * as Realm from 'realm-web';
import { nanoid } from 'nanoid';
import { BOX_DB_EVENT_STREAM_COLLECTION, BOX_DB_NAME, SlackEvent, EventStreamDB } from '@box/types';
import { processSlackEvent } from './process-slack-event';

export interface InboundEventWorkerEnv {
	ATLAS_APP_ID: string;
	ATLAS_CF_USERNAME: string;
	ATLAS_CF_PASSWORD: string;
}

let App: Realm.App;

export default {
	async fetch(request: Request, env: InboundEventWorkerEnv, ctx: ExecutionContext): Promise<Response> {
		const body: any = await request.json();
		
		// Slack challenge
		if (body.challenge) {
			return new Response(JSON.stringify(body.challenge), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		App = App || new Realm.App(env.ATLAS_APP_ID);

		try {
			const credentials = Realm.Credentials.emailPassword(env.ATLAS_CF_USERNAME, env.ATLAS_CF_PASSWORD);
			const user = await App.logIn(credentials);
			const client = user.mongoClient('mongodb-atlas');

			// Slack message event
			if (body.type === 'event_callback' && body.event.type === 'message') {
				await processSlackEvent(body.event, client);
			}
		} catch (error: any) {
			console.error(error);
			return new Response(error.message, { status: 500 });
		}

		return new Response('OK', { status: 200 });
	},
} satisfies ExportedHandler<InboundEventWorkerEnv>;
