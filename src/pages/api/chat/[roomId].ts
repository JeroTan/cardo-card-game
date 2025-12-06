import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const { roomId } = context.params;

	if (!roomId) {
		return new Response("Room ID required", { status: 400 });
	}

	// Get the Durable Object binding
	const { CHAT_ROOM } = context.locals.runtime.env;

	// Create a unique ID for this room
	const id = CHAT_ROOM.idFromName(roomId);

	// Get the Durable Object stub
	const stub = CHAT_ROOM.get(id);

	// Forward the request to the Durable Object
	return stub.fetch(context.request);
}
