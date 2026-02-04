

export class CardGameController {
  constructor(){

  }

	async createRoom({playerId, env}:{playerId: string, env: Env}){
		if(!playerId){
			return Response.json({message: "Player ID is required"}, {status: 400});
		}

		// Get the Durable Object binding
		const { MATCHMAKING_PLAYER } = env;

		// Create a unique ID for the global matchmaking queue
		const id = MATCHMAKING_PLAYER.idFromName("global-queue");

		// Get the Durable Object stub
		const stub = MATCHMAKING_PLAYER.get(id);

		// Send join matchmaking event
		return stub.fetch(new Request("https://internal/join", {
			method: "POST",
			body: JSON.stringify({
				type: "JOIN_QUEUE",
				playerId,
			}),
		}));
	}

  async prepareRoom({roomId, playerId, env}: {roomId: string, playerId?: string, env: Env}){
		if (!roomId) {
			return Response.json({ message: "Room ID is required" }, { status: 400 });
		}

		// Get the Durable Object binding
		const { CARD_GAME_ROOM } = env;

		// Create a unique ID for this room
		const id = CARD_GAME_ROOM.idFromName(roomId);

		// Get the Durable Object stub
		const stub = CARD_GAME_ROOM.get(id);

		// Send join room event
		return stub.fetch(new Request("https://internal/join", {
			method: "POST",
			body: JSON.stringify({
				roomId,
				playerId,
				type: "JOIN_ROOM",
			}),
		}));
  }

	async drawCard({roomId, playerId, cardToDraw, env}: {roomId: string, playerId: string, cardToDraw: string[], env: Env}){
		if (!roomId || !playerId || !cardToDraw || cardToDraw.length === 0) {
			return Response.json({ message: "roomId, playerId, and cardToDraw are required" }, { status: 400 });
		}

		if (cardToDraw.length > 3) {
			return Response.json({ message: "Cannot draw more than 3 cards" }, { status: 400 });
		}

		// Get the Durable Object binding
		const { CARD_GAME_ROOM } = env;

		// Create a unique ID for this room
		const id = CARD_GAME_ROOM.idFromName(roomId);

		// Get the Durable Object stub
		const stub = CARD_GAME_ROOM.get(id);

		// Send draw card event to the room
		return stub.fetch(new Request("https://internal/event", {
			method: "POST",
			body: JSON.stringify({
				type: "DRAW_CARD",
				playerId,
				cardIds: cardToDraw,
			}),
		}));
	}

	async attackSentinel({roomId, playerId, attackingCard, env}: {roomId: string, playerId: string, attackingCard: string[], env: Env}){
		if (!roomId || !playerId || !attackingCard || attackingCard.length === 0) {
			return Response.json({ message: "roomId, playerId, and attackingCard are required" }, { status: 400 });
		}

		if (attackingCard.length > 3) {
			return Response.json({ message: "Cannot attack with more than 3 cards" }, { status: 400 });
		}

		// Get the Durable Object binding
		const { CARD_GAME_ROOM } = env;

		// Create a unique ID for this room
		const id = CARD_GAME_ROOM.idFromName(roomId);

		// Get the Durable Object stub
		const stub = CARD_GAME_ROOM.get(id);

		// Send attack event to the room
		return stub.fetch(new Request("https://internal/event", {
			method: "POST",
			body: JSON.stringify({
				type: "ATTACKING",
				playerId,
				cardIds: attackingCard,
			}),
		}));
	}
}