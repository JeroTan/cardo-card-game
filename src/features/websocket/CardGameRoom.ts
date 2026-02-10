import { DurableObject } from "cloudflare:workers";
import type { GameCard, TurnEvent } from "@/types/game/events";
import { convertRoomStateForClient, validateGameEvent } from "@/services/game/General";
import { RoomLogic } from "@/services/game/RoomLogic";
import { cleanseDurableObjectStorage, convertMessageToJSON, makeWSServer } from "@/lib/durableObject";
import type { WebsocketStatusForRoom } from "@/types/game/events";
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
				await this.roomLogic.setPreMadeRoom(roomId, playerIds.map(id=>({id})));
				break;
			}
			case "JOIN_ROOM":{
				const playerData = await request.json() as {id: string, username: string};
				const isPlayerDisconnected = await this.roomLogic.isPlayerDisconnected(roomId, playerData.id);	
				let joinStatus:"JOINED"|"RECONNECTED" = "JOINED";
				if(isPlayerDisconnected.ok){
					const result = await this.roomLogic.reconnectToRoom(roomId, playerData);
					if(!result.ok){
						return Response.json({error: result.message}, {status: 404});
					}
					joinStatus = "RECONNECTED";
				}else{
					const result = await this.roomLogic.joinRoom(roomId, [playerData]);
					if(!result.ok){
						return Response.json({error: result.message}, {status: 404});
					}
					joinStatus = "JOINED";
				}

				// Make Websocket
				const {response, server} = makeWSServer(this.ctx);
				server.serializeAttachment({ playerId: playerData.id, roomId });
				this.wsPlayerBinderMap.set(playerData.id, server);
				
				// Send the current room state to the player who just joined or reconnected
				if(joinStatus === "RECONNECTED"){
					server.send(JSON.stringify({
						type: "RECONNECTED_TO_ROOM",
						message: "You have reconnected to the room",
					}));
				}else{
					server.send(JSON.stringify({
						type: "JOINED_ROOM",
						message: "You have joined the room",
					}));
				}


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
		const jsonData = convertMessageToJSON(message) as WebsocketStatusForRoom<any>;
		switch(jsonData.type){
			case "PLAYER_CONFIRM":{
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
					await this.gameProcessLogic.startTheGame(roomId);
					await this.gameProcessLogic.addInitialCardsForPlayers({roomId});

					allWS.forEach(([playerId, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "INITIAL_CARD_IS_READY",
							message: "All players' cards are ready. Starting, please confirm again...",
						}));
					});
				}
				break;
			}
			case "PLAYER_READY":{ // When player says this meaning turn 1 can be started

				break;
			}
			case "REQUEST_DRAW_CARD":{
				const { cardToDraw } = jsonData.data as { cardToDraw: number };
				if(!cardToDraw || typeof cardToDraw !== "number" || cardToDraw <= 0 || cardToDraw > 3){
					ws.send(JSON.stringify({
						type: "ERROR",
						message: "cardToDraw is required and should be a non-empty array",
					}));
					return;
				}
				const result = await this.gameProcessLogic.drawCards({roomId,playerId, cardsToDraw: cardToDraw});
				if(!result.ok){
					console.error("Error drawing cards:", result.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: result.message,
					}));
					return;
				}
				const nextEvent = result.nextEvent as TurnEvent;
				// Broadcast the state of how many card is drawn to opponents but send the actual drawn cards to the player himself
				const allWS = Array.from(this.wsPlayerBinderMap.entries());
				if(nextEvent.type === "DRAW_CARD"){
					allWS.forEach(([id, playerWS])=>{
						if(id === playerId){
							playerWS.send(JSON.stringify({
								type: "NEXT_EVENT",
								data: result.nextEvent,
							}));
						}
						else{
							playerWS.send(JSON.stringify({
								type: "NEXT_EVENT",
								data: {
									...result.nextEvent,
									drawn_cards: (nextEvent.drawn_cards as Array<GameCard>).length, // only send the number of drawn cards to opponents
								}
							}));
						}
					});
				}
				break;
			}
			case "REQUEST_ATTACK":{

				break;
			}
			case "REQUEST_END_TURN":{

				break;
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}, WasClean: ${wasClean}`);
		if(!ws.deserializeAttachment || !ws.deserializeAttachment().playerId || !ws.deserializeAttachment().roomId){
			console.warn("WebSocket closed without proper attachment");
			return;
		}
		const { playerId, roomId } = ws.deserializeAttachment() as { playerId: string, roomId: string };
		this.roomLogic.playerDisconnected(roomId, playerId);
		this.wsPlayerBinderMap.delete(playerId);
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("WebSocket error:", error);
    ws.close(1011, "WebSocket error");
	}

	async __getGameState(roomId: string){
		const gameState = await this.gameProcessLogic.getGameState(roomId);
		return gameState;
	}

	async __cleanupStorage(){
		cleanseDurableObjectStorage(this.ctx.storage);
	}

	async __roomExist(roomId: string){
		const roomResult = await this.roomLogic.isRoomExist(roomId);
		if(!roomResult.ok){
			return false;
		}
		const gameRoomResult = await this.gameProcessLogic.isGameExist(roomId);
		if(!gameRoomResult.ok){
			return false;
		}
		return true;
	}
}
