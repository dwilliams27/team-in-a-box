import { BOX_DB_INBOUND_EVENT_STREAM_COLLECTION, BOX_DB_NAME, EventStreamStatus, EventType, InboundEventStreamDB } from '@box/types';
import * as Realm from 'realm-web';
import { handleSlackEmbedding } from './slack-embedding';

export interface EmbeddingWorkerEnv {
	ATLAS_APP_ID: string;
	ATLAS_CF_USERNAME: string;
	ATLAS_CF_PASSWORD: string;

	OPENAI_API_KEY: string;
}

const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

let App: Realm.App;

export default {
	async scheduled(
    controller: ScheduledController,
    env: EmbeddingWorkerEnv,
    ctx: ExecutionContext,
  ) {
		console.log("Embedding worker running...");
		App = App || new Realm.App(env.ATLAS_APP_ID);

		try {
			const credentials = Realm.Credentials.emailPassword(env.ATLAS_CF_USERNAME, env.ATLAS_CF_PASSWORD);
			const user = await App.logIn(credentials);
			const client = user.mongoClient('mongodb-atlas');

			const now = new Date();
			const timeoutThreshold = new Date(now.getTime() - PROCESSING_TIMEOUT);
			const boxDb = client.db(BOX_DB_NAME);

			const result: InboundEventStreamDB = await boxDb.collection(BOX_DB_INBOUND_EVENT_STREAM_COLLECTION).findOneAndUpdate(
				{
					$or: [
						{ status: EventStreamStatus.PENDING },
						{ status: EventStreamStatus.PROCESSING, processing_started_at: { $lt: timeoutThreshold } }
					]
				},
				{
					$set: {
						status: EventStreamStatus.PROCESSING,
						processing_started_at: now
					}
				},
				{ sort: { _id: 1 }, returnNewDocument: true }
			);

			console.log('Record from DB', result);

			if (result) {
				console.log(`Processing event ${result.id}...`);
				try {
					switch (result.type) {
						case EventType.SLACK: {
							await handleSlackEmbedding(result, boxDb, env);
						}
					}
				} catch (error) {
					console.log('Error when trying to generate embedding', error);
					await boxDb.collection(BOX_DB_INBOUND_EVENT_STREAM_COLLECTION).updateOne(
						{ id: result.id },
						{ $set: { status: EventStreamStatus.FAILED, processing_error: error } }
					);
				}
			}
		} catch (error: any) {
			console.error("Error processing event", error);
		}
	},
} satisfies ExportedHandler<EmbeddingWorkerEnv>;
