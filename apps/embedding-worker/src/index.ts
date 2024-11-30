import { EventStatus, EventType } from '@box/types';
import { handleSlackEmbedding } from './slack-embedding';
import { Pool, PrismaClient, PrismaNeon } from '@box/db-edge';

export interface EmbeddingWorkerEnv {
	DATABASE_URL: string;

	OPENAI_API_KEY: string;
}

const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default {
	async scheduled(
    controller: ScheduledController,
    env: EmbeddingWorkerEnv,
    ctx: ExecutionContext,
  ) {
		console.log("Embedding worker running...");

		try {
			const pool = new Pool({ connectionString: env.DATABASE_URL });
			const adapter = new PrismaNeon(pool);
			const client = new PrismaClient({ adapter });

			const now = new Date();
			const timeoutThreshold = new Date(now.getTime() - PROCESSING_TIMEOUT);

			const result = await client.inboundEvent.findFirst({
				where: {
					OR: [
						{
							pre_processing: {
								path: ['status'],
								equals: EventStatus.PENDING
							}
						},
						{
							AND: [
								{
									pre_processing: {
										path: ['status'],
										equals: EventStatus.PROCESSING
									}
								},
								{
									pre_processing: {
										path: ['started_at'],
										lt: timeoutThreshold
									}
								}
							]
						}
					]
				},
				orderBy: {
					id: 'asc'
				}
			});

			console.log('Record from DB', result);

			if (result) {
				console.log(`Processing event ${result.reference}...`);
				try {
					switch (result.type) {
						case EventType.SLACK: {
							// @ts-expect-error
							await handleSlackEmbedding(result, client, env);
						}
					}
				} catch (error) {
					console.log('Error when trying to generate embedding', error);
					const updatedDoc = await client.inboundEvent.update({
						where: {
							id: result.id
						},
						data: {
							pre_processing: {
								status: EventStatus.FAILED,
								processing_error: error as string
							}
						}
					});
				}
			}
		} catch (error: any) {
			console.error("Error processing event", error);
		}
	},
} satisfies ExportedHandler<EmbeddingWorkerEnv>;
