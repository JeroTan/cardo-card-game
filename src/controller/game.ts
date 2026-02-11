import type { CardGameRoom } from "@/features/websocket/CardGameRoom";
import type { MatchmakingPlayer } from "@/features/websocket/MatchmakingPlayer";
import { makeWSResponse, stabRequest, stabRequestBody } from "@/lib/durableObject";
import type { CardService } from "@/services/card";
import type { CardPackService } from "@/services/cardPack";
import { convertRoomStateForClient } from "@/services/game/General";



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

	async checkRoom({roomId, env}: {roomId: string, env: Env}){
		if (!roomId) {
			return Response.json({ message: "Room ID is required" }, { status: 400 });
		}
		// Get the Durable Object binding
		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;
		try{
			const ok = await stub.__roomExist(roomId);
			if(ok){
				return Response.json({message: "Room is available"}, {status: 200});
			}
			return Response.json({message: "Room not found"}, {status: 404});
		}catch(error){
			console.error("Error checking room:", error);
			return Response.json({message: "Failed to check room"}, {status: 500});
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

	async getGameState({roomId, playerId, env}: {roomId: string, playerId:string, env: Env}){
		if (!roomId) {
			return Response.json({ message: "Room ID is required" }, { status: 400 });
		}
		// Get the Durable Object binding
		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;
		try{
			const gameState = await stub.__getGameState(roomId);
			if(!gameState){
				return Response.json({message: "Game state not found"}, {status: 404});
			}

			//Sanitize game state before sending to client
			const sanitizedGameState = convertRoomStateForClient(gameState, playerId);
			return Response.json({data: sanitizedGameState}, {status: 200});
		}catch(error){
			console.error("Error getting game state:", error);
			return Response.json({message: "Failed to get game state"}, {status: 500});	
		}

	}
}