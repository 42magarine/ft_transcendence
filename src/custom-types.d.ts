// fastify-custom.d.ts
import { FastifyReply } from 'fastify';

declare module 'fastify' {
	interface FastifyReply {
		render(componentPath: string, props?: object): Promise<void>;
	}
}