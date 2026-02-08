import { DurableObject } from "cloudflare:workers";
import type { TurnEvent } from "@/types/game/events";
import { convertRoomStateForClient, validateGameEvent } from "@/features/game/utils/room";
import { RoomLogic } from "@/services/game/RoomLogic";
import { convertMessageToJSON, makeWSServer, makeWSServerResponse } from "@/lib/durableObject";
import type { WebsocketMessageForRoom } from "@/types/game/room";
import { CardPackService } from "@/services/cardPack";
import { CardService } from "@/services/card";
import { GameProcessLogic } from "@/services/game/GameLogic";

export class CardGameRoom extends DurableObject {
	private wsPlayerBinderMap = new Map<string, WebSocket>(); // Map to bind playerId with their WebSocket connection 
	public roomLogic: RoomLogic;
	protected cardPackService= new CardPackService();
	protected cardService = new CardService();
	protected gameProcessLogic: GameProcessLogic;
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.roomLogic = new RoomLogic(this.ctx.storage);
		this.gameProcessLogic = new GameProcessLogic(this.ctx.storage);	
	} 

	async fetch(request: Request): Promise<Response> {
		// We need to check first if the request has player id to proceed with matchmaking
    const url = new URL(request.url);
		const requestType = url.searchParams.get("type");
		const roomId = url.searchParams.get("roomId");

		if(!requestType){
			return Response.json({ error: "type is required" }, { status: 400 });
		}
		if(!roomId){
			return Response.json({ error: "roomId is required" }, { status: 400 });
		}
		
		switch(requestType){
			case "PREPARE_ROOM_FOR_PRE_MADE_MATCH":{
				const { playerIds } = await request.json() as {playerIds: string[]};
				this.roomLogic.setPreMadeRoom(roomId, playerIds.map(id=>({id})));
				break;
			}
			case "JOIN_ROOM":{
				const playerData = await request.json() as {id: string, username: string};
				let result = await this.roomLogic.joinRoom(roomId, [playerData]);
				if(!result.ok){
					result = await this.roomLogic.reconnectToRoom(roomId, playerData);
				}
				if(!result.ok){
					return Response.json({error: result.message}, {status: 404});
				}

				// Make Websocket
				const {response, server} = makeWSServer(this.ctx);
				server.serializeAttachment({ playerId: playerData.id, roomId });
				this.wsPlayerBinderMap.set(playerData.id, server);

				return response;
			} 
		}

		return Response.json({message: "Invalid request"}, {status: 400});
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		const { playerId, roomId } = ws.deserializeAttachment() as { playerId: string, roomId: string };
		if(!playerId || !roomId){
			console.warn("WebSocket message received without proper attachment");
			return;
		}
		const jsonData = convertMessageToJSON(message) as WebsocketMessageForRoom<any>;
		switch(jsonData.type){
			case "PLAYER_IS_READY":{
				const result = await this.roomLogic.readyThePlayer(roomId, [playerId]);
				if(!result.ok){
					console.error("Error marking player as ready:", result.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: result.message,
					}));
				}
				// Check if everyone is ready and if yes start the game
				const isReadyReport = await this.roomLogic.isEveryoneReady(roomId);
				if(isReadyReport.ok){
					const allWS = Array.from(this.wsPlayerBinderMap.entries());
			
					await this.gameProcessLogic.createGame(roomId);
					await this.gameProcessLogic.addInitialPlayersFromServices({
						roomInfo: isReadyReport.roomInfo,
						cardPackService: this.cardPackService,
						cardService: this.cardService,
						env: this.env,
					});

					allWS.forEach(([, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "EVERYONE_READY",
							message: "All players are ready. Starting the game...",
						}));
					});
				}
				break;
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("WebSocket error:", error);
    ws.close(1011, "WebSocket error");
	}
}
