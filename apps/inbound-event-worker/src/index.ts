import { PrismaClient } from '@box/db';
import { processSlackEvent } from './process-slack-event';
import { Pool, PrismaNeon } from '@box/db-edge';

export interface InboundEventWorkerEnv {
	DATABASE_URL: string;
}

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

		const pool = new Pool({ connectionString: env.DATABASE_URL });
		const adapter = new PrismaNeon(pool);
		const client = new PrismaClient({ adapter });

		try {
			// Slack message event
			if (body.type === 'event_callback' && body.event.type === 'message') {
				await processSlackEvent(body.event, client);
			}
		} catch (error: any) {
			console.error(error);
			await client.$disconnect();
			return new Response(error.message, { status: 500 });
		}

		await client.$disconnect();
		return new Response('OK', { status: 200 });
	},
} satisfies ExportedHandler<InboundEventWorkerEnv>;
