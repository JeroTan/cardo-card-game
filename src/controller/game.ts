import type { CardGameRoom } from "@/features/websocket/CardGameRoom";
import type { MatchmakingPlayer } from "@/features/websocket/MatchmakingPlayer";
import { makeWSResponse, stabRequest } from "@/lib/durableObject";
import type { CardService } from "@/services/card";
import type { CardPackService } from "@/services/cardPack";
import { convertRoomStateForClient, generateRoomId } from "@/services/game/General";



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
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;

		// Check if it is a websocket request
		const upgradeHeader = request.headers.get("Upgrade");
		if(!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket"){
			return Response.json({message: "This endpoint only accepts websocket requests"}, {status: 400});
		}

		// Send join room event
		try{
			const [url,constructRequest] = stabRequest(request);
			url.searchParams.set("type", "JOIN_ROOM");	
			url.searchParams.set("roomId", roomId);
			url.searchParams.set("playerId", playerId);
			url.searchParams.set("playerUsername", playerUsername);
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

	// Custom room lobby methods
	async createCustomRoom({roomName, type = "OPEN", userId, username, env}: {roomName:string, type?: "OPEN"|"INVITE_ONLY", userId: string, username: string, env: Env}){
		if(!userId || !username){
			return Response.json({message: "User ID and username are required"}, {status: 400});
		}

		const { CARD_GAME_ROOM } = env;
		const roomId = generateRoomId();
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;
		
		try{
			await stub.__createCustomRoom(roomId, roomName, type);
			await stub.__inviteAPlayer(roomId, [{id: userId, username}]);
			await stub.__setRoomOwner(roomId, userId);
			return Response.json({roomId, message: "Room created successfully"}, {status: 200});
		}catch(error){
			console.error("Error creating custom room:", error);
			return Response.json({message: "Failed to create room"}, {status: 500});
		}
	}

	async updateCustomRoom({roomId, roomName, inviteType, env}: {roomId: string, roomName?: string, inviteType?: "INVITE_ONLY" | "OPEN", env: Env}){
		if(!roomId){
			return Response.json({message: "Room ID is required"}, {status: 400});
		}
		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;
		try{
			await stub.__updateCustomRoom({roomId, roomName, inviteType});
			return Response.json({message: "Room updated successfully"}, {status: 200});
		}
		catch(error){
			console.error("Error updating custom room:", error);
			return Response.json({message: "Failed to update room"}, {status: 500});
		}
	}

	async joinCustomRoom({roomId, userId, username, env, request}: {roomId: string, userId: string, username: string, env: Env, request: Request}){
		if(!roomId || !userId || !username){
			return Response.json({message: "Room ID, user ID and username are required"}, {status: 400});
		}
		const { CARD_GAME_ROOM } = env;
		// Use roomId as the identifier to find the room
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(`${roomId}`)) as DurableObjectStub<CardGameRoom>;

		// Check if it is a websocket request
		const upgradeHeader = request.headers.get("Upgrade");
		if(!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket"){
			return Response.json({message: "This endpoint only accepts websocket requests"}, {status: 400});
		}

		try{
			console.log(`Found stub for room ID ${roomId}, sending join request...`);
			const [url, constructRequest] = stabRequest(request);
			url.searchParams.set("type", "JOIN_CUSTOM_PRE_ROOM");
			url.searchParams.set("roomId", roomId);
			url.searchParams.set("playerId", userId);
			url.searchParams.set("playerUsername", username);
			const rawResponse = await stub.fetch(...constructRequest());
			const response = makeWSResponse(rawResponse);
			return response;
		}catch(error){
			console.error("Error joining room by ID:", error);
			return Response.json({message: "Failed to join room"}, {status: 500});
		}
	}

	async removePlayerFromRoom({roomId, targetPlayerId, env}: {roomId: string, targetPlayerId: string, env: Env}){
		if(!roomId || !targetPlayerId){
			return Response.json({message: "Room ID and target player ID are required"}, {status: 400});
		}

		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;

		try{
			await stub.__removePlayerFromRoom(roomId, targetPlayerId);
			return Response.json({message: "Player removed successfully"}, {status: 200});
		}catch(error){
			console.error("Error removing player:", error);
			return Response.json({message: "Failed to remove player"}, {status: 500});
		}
	}

	async toggleReadyState({roomId, userId, env, ready=false}: {roomId: string, userId: string, env: Env, ready?: boolean}){
		if(!roomId || !userId){
			return Response.json({message: "Room ID and user ID are required"}, {status: 400});
		}

		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;

		try{
			if(ready){
				await stub.__setPlayerReadyOnCustom(roomId, userId);
			}else{
				await stub.__setPlayerNotReadyOnCustom(roomId, userId);
			}
			return Response.json({message: "Player ready state toggled successfully"}, {status: 200});
		}catch(error){
			console.error("Error toggling ready state:", error);
			return Response.json({message: "Failed to toggle ready state"}, {status: 500});
		}
	}

	async addBotPlayer({roomId, difficulty, env}: {roomId: string, difficulty: string, env: Env}){
		if(!roomId){
			return Response.json({message: "Room ID is required"}, {status: 400});
		}

		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;

		try{
			const [url, constructRequest] = stabRequest();
			url.searchParams.set("type", "ADD_BOT_PLAYER");
			url.searchParams.set("roomId", roomId);
			url.searchParams.set("difficulty", difficulty || "MEDIUM");
			
			const response = await stub.fetch(...constructRequest());
			return response;
		}catch(error){
			console.error("Error adding bot:", error);
			return Response.json({message: "Failed to add bot"}, {status: 500});
		}
	}

	async getRoomState({roomId, env}: {roomId: string, env: Env}){
		if (!roomId) {
			return Response.json({ message: "Room ID is required" }, { status: 400 });
		}
		const { CARD_GAME_ROOM } = env;
		const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;
		try{
			const roomState = await stub.__getRoomState(roomId);
			if(!roomState){
				return Response.json({message: "Room state not found"}, {status: 404});
			}
			return Response.json({data: roomState}, {status: 200});
		}catch(error){
			console.error("Error getting room state:", error);
			return Response.json({message: "Failed to get room state"}, {status: 500});	
		}
	}
}
