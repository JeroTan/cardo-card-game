import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { handle } from "@astrojs/cloudflare/handler";
import { CardGameRoom } from "@/features/websocket/CardGameRoom";
import { MatchmakingPlayer } from "@/features/websocket/MatchmakingPlayer";
import { cleanseDurableObjectStorage } from "@/lib/durableObject";
// export * from '@/features/websocket/ChatRoom';

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	return {
		default: {
			async fetch(request, env, ctx) {
				return handle(manifest, app, request as any, env as Cloudflare.Env as any, ctx);
			},
			async queue(batch, _env) {
				let messages = JSON.stringify(batch.messages);
				console.log(`consumed from our queue: ${messages}`);
			},
			async scheduled(event, env, ctx){
				// Reset All the rooms that goes past beyond 24 hours in timestamp
				const globalMatchMaking = env.MATCHMAKING_PLAYER.get(env.MATCHMAKING_PLAYER.idFromName("global-queue")) as DurableObjectStub<MatchmakingPlayer>;
				await globalMatchMaking.__cleanupStorage();
			}
		} satisfies ExportedHandler<Cloudflare.Env>,
		CardGameRoom: CardGameRoom,
		MatchmakingPlayer: MatchmakingPlayer
	};
}
