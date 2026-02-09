import type { MatchmakingPlayer } from "@/features/websocket/MatchmakingPlayer";
import { makeWSResponse, stabRequest, stabRequestBody } from "@/lib/durableObject";
import type { CardService } from "@/services/card";
import type { CardPackService } from "@/services/cardPack";



export class CardGameController {
  constructor(
		public cardPackService: CardPackService,
		public cardService: CardService,
	){}

	async findMatch({playerId, env, request}:{playerId: string, env: Env, request: Request}){
		if(!playerId){
			return Response.json({message: "Player ID is required"}, {status: 400});
		}

		// Get the Durable Object binding
		const {MATCHMAKING_PLAYER} = env;
		// Create a unique ID for the global matchmaking queue
		const stub = MATCHMAKING_PLAYER.get(MATCHMAKING_PLAYER.idFromName("global-queue"));

		// Check if it is a websocket request
		const upgradeHeader = request.headers.get("Upgrade");
		if(!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket"){
			return Response.json({message: "This endpoint only accepts websocket requests"}, {status: 400});
		}

		// Send join matchmaking event
		try{
			const [url, constructRequest] = stabRequest(request);
			url.searchParams.set("playerId", playerId);
			return makeWSResponse(await stub.fetch(...constructRequest()));
		}catch(error){
			console.error("Error joining matchmaking:", error);
			return Response.json({message: "Failed to join matchmaking"}, {status: 500});
		}
	}
 
  async joinRoom({roomId, playerId, playerUsername, env, request}: {roomId: string, playerId?: string, playerUsername?: string, env: Env, request: Request}){
		if(!playerId || !playerUsername){
			return Response.json({message: "Player ID and username are required"}, {status: 400});
		}
		if (!roomId) {
			return Response.json({ message: "Room ID is required" }, { status: 400 });
		}

		// Get the Durable Object binding
		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId));

		// Check if it is a websocket request
		const upgradeHeader = request.headers.get("Upgrade");
		if(!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket"){
			return Response.json({message: "This endpoint only accepts websocket requests"}, {status: 400});
		}

		// Send join room event
		try{
			const [url, body, constructRequest] = stabRequestBody(request);
			url.searchParams.set("roomId", roomId);
			body({
				id: playerId,
				username: playerUsername,
			});
			return makeWSResponse(await stub.fetch(...constructRequest()));
		}catch(error){
			console.error("Error preparing room:", error);
			return Response.json({message: "Failed to prepare room"}, {status: 500});
		}
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
		return await stub.fetch("https://internal/event", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "DRAW_CARD",
				playerId,
				cardIds: cardToDraw,
			}),
		});
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
		return await stub.fetch("https://internal/event", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "ATTACKING",
				playerId,
				cardIds: attackingCard,
			}),
		});
	}
}