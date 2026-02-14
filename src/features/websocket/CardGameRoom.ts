import { DurableObject } from "cloudflare:workers";
import type { GameCard, TurnEvent } from "@/types/game/events";
import { cardsToRemoveFromOverflowHand, checkIfFirstTurnAndNoSentinelYet, getCurrentPlayer, isCurrentASentinel, isNotSentinelOwnerAllowedToEnd, validateGameEvent } from "@/services/game/General";
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
		console.log(`CardGameRoom received request for roomId: ${roomId} with type: ${requestType} from durable id: ${this.ctx.id.toString()}`);

		if(!requestType){
			return Response.json({ error: "type is required" }, { status: 400 });
		}
		if(!roomId){
			return Response.json({ error: "roomId is required" }, { status: 400 });
		}
		
		switch(requestType){
			case "PREPARE_ROOM_FOR_PRE_MADE_MATCH":{
				const { playerIds } = await request.json() as {playerIds: string[]};
				this.__premadeRoom(roomId, playerIds);
				break;
			}
			case "JOIN_ROOM":{
				const playerId = url.searchParams.get("playerId");
				const playerUsername = url.searchParams.get("playerUsername");
				if(!playerId || !playerUsername){
					console.warn("JOIN_ROOM request missing playerId or playerUsername");
					return Response.json({ error: "playerId and playerUsername are required" }, { status: 400 });
				}
				const isPlayerDisconnected = await this.roomLogic.isPlayerDisconnected(roomId, playerId);	
				let joinStatus:"JOINED"|"RECONNECTED" = "JOINED";
				if(isPlayerDisconnected.ok){
					const result = await this.ctx.blockConcurrencyWhile(async()=>{
						return await this.roomLogic.reconnectToRoom(roomId, {id: playerId, username: playerUsername});
					});
					if(!result.ok){
						console.error("Error reconnecting to room:", result.message);
						return Response.json({error: result.message}, {status: 404});
					}
					joinStatus = "RECONNECTED";
				}else{
					const result = await this.ctx.blockConcurrencyWhile(async()=>{
						return await this.roomLogic.joinRoom(roomId, [{id: playerId, username: playerUsername}]);
					});
					if(!result.ok){
						console.error("Error joining the room:", result.message);
						return Response.json({error: result.message}, {status: 404});
					}
					joinStatus = "JOINED";
				}

				// Make Websocket
				const {response, server} = makeWSServer(this.ctx);
				server.serializeAttachment({ playerId, roomId });
				this.wsPlayerBinderMap.set(playerId, server);
				
				// Send the current room state to the player who just joined or reconnected
				if(joinStatus === "RECONNECTED"){
					server.send(JSON.stringify({
						type: "RECONNECTED_TO_ROOM",
						message: "You have reconnected to the room",
					}));
					this.__signalGameStatusToReconnectedPlayer(server, roomId);

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
			case "PLAYER_CONFIRM":{ // Player confirms meaning that concensus of players maybe on premade or custom room are connected
				const result = await this.ctx.blockConcurrencyWhile(async()=>{
					return await this.roomLogic.readyTheConnection(roomId, [playerId]);
				});
				if(!result.ok){
					console.error("Error marking player connected:", result.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: result.message,
					}));
				}

				// Check if everyone is ready and if yes start the game
				const isReadyReport = await this.roomLogic.isEveryoneConnectionConfirm(roomId);
				if(isReadyReport.ok){
					const allWS = Array.from(this.wsPlayerBinderMap.entries());
			
					await this.ctx.blockConcurrencyWhile(async()=>{
						await this.gameProcessLogic.createGame(roomId);
						await this.gameProcessLogic.addInitialPlayersFromServices({
							roomInfo: isReadyReport.roomInfo,
							cardPackService: this.cardPackService,
							env: this.env,
						});
						await this.gameProcessLogic.startTheGame(roomId);
						await this.gameProcessLogic.addInitialCardsForPlayers({roomId});
						return await this.gameProcessLogic.setGamePreparationReady(roomId);
					});

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
				// We can ensure that everyone receive data to start the game and once all is ready then we can continue
				const result = await this.roomLogic.readyThePlayer(roomId, [playerId]);
				if(!result.ok){
					console.error("Error marking player ready:", result.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: result.message,
					}));
				}

				// Check if everyone is ready and if yes start the game
				const isReadyReport = await this.roomLogic.isEveryoneReadyToPlay(roomId);
				if(!isReadyReport.ok){
					console.log("Player status: ", isReadyReport.message);
					return;
				}

				const allWS = Array.from(this.wsPlayerBinderMap.entries());

				allWS.forEach(([playerId, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "EVERYONE_READY",
						message: "Everyone is ready. Starting the game...",
					}));
				});
				
				const startTurnResult = await this.gameProcessLogic.startTurn(roomId);
				if(!startTurnResult.ok){
					console.error("Error starting the turn:", startTurnResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: startTurnResult.message,
					}));
					return;
				}
		
				allWS.forEach(([playerId, playerWS])=>{
					// Also Broadcast the starting event to all players to start the game
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: startTurnResult.nextEvent,
					}));
				});
				this.__endTurnTimer();
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
				const { attackingCards } = jsonData.data as { attackingCards: string[] };
				if(!attackingCards || !Array.isArray(attackingCards) || attackingCards.length === 0 || attackingCards.length > 3){
					ws.send(JSON.stringify({
						type: "ERROR",
						message: "attackingCards is required and should be a non-empty array with maximum length of 3",
					}));
					return;
				}	
				const attackResult = await this.gameProcessLogic.attackWithCards({roomId, playerId, attackingCardIds: attackingCards});
				if(!attackResult.ok){
					console.error("Error attacking with cards:", attackResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: attackResult.message,
					}));
					return;
				}
				// Broadcast the attack event to all players
				const allWS = Array.from(this.wsPlayerBinderMap.entries());
				allWS.forEach(([, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: attackResult.nextEvent,
					}));
				});

				// Change the sentinel if the attack is successful
				const changeSentinelResult = await this.gameProcessLogic.changeSentinel({roomId});
				if(!changeSentinelResult.ok){
					console.error("Error changing sentinel after attack:", changeSentinelResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: changeSentinelResult.message,
					}));
					return;
				}

				const allWSAfterSentinelChange = Array.from(this.wsPlayerBinderMap.entries());
				allWSAfterSentinelChange.forEach(([, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: changeSentinelResult.nextEvent,
					}));
				});

				// Jail the card if the attack is not successful
				const jailCardResult = await this.gameProcessLogic.jailSentinelCards({roomId});

				if(!jailCardResult.ok){
					console.error("Error jailing cards after attack:", jailCardResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: jailCardResult.message,
					}));
					return;
				}

				const allWSAfterJail = Array.from(this.wsPlayerBinderMap.entries());
				allWSAfterJail.forEach(([, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: jailCardResult.nextEvent,
					}));
				});
				break;
			}
			case "REQUEST_END_TURN":{
				const result = await this.gameProcessLogic.startTurn(roomId);
				if(!result.ok){
					console.error("Error starting the turn:", result.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: result.message,
					}));
					return;
				}
				const allWS = Array.from(this.wsPlayerBinderMap.entries());
				allWS.forEach(([playerId, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: result.nextEvent,
					}));
				});
				this.__endTurnTimer();
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
		const wsAll = Array.from(this.wsPlayerBinderMap.entries());
		wsAll.forEach(([, playerWS])=>{
			playerWS.send(JSON.stringify({
				type: "DISCONNECTED",
				message: `Player ${playerId} has been disconnected`,
			}));
		});
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("WebSocket error:", error);
    ws.close(1011, "WebSocket error");
	}

	async __endTurnTimer(){
		this.ctx.storage.setAlarm(Date.now() + 60000);
	}

	async alarm(){
		const allWS = this.ctx.getWebSockets()[0];
		const {roomId} = allWS.deserializeAttachment() as {roomId: string, playerId: string};	
		if(!roomId ){
			console.warn("Alarm triggered without proper WebSocket attachment");
			return;
		}
		// Check the gameState
		const gameState = await this.gameProcessLogic.getGameState(roomId);
		if(!gameState){
			console.error("Game state not found for roomId:", roomId);
			return;
		}

		// get the player who is the latest START_TURN event
		const latestTurnEvent = [...gameState.events].reverse().find(event=>event.type === "START_TURN");
		if(!latestTurnEvent){
			console.error("No START_TURN event found in game state for roomId:", roomId);
			return;
		}

		const firstTurn = checkIfFirstTurnAndNoSentinelYet(gameState);
		if( firstTurn ){
			const playerInfo = getCurrentPlayer(gameState);
			const attackResult = await this.gameProcessLogic.attackWithCards({
				roomId,
				playerId: playerInfo.id,
				attackingCardIds: [playerInfo.cardsInHand[0].id], 
				forceOutOfTime: true,
			})
			if(!attackResult.ok){
				console.error("Error forcing attack for first turn:", attackResult.message);
				return;
			}
			const allWS = this.ctx.getWebSockets().map((ws)=>{
				return [ws.deserializeAttachment().playerId, ws];
			});
			allWS.forEach(([, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: attackResult.nextEvent,
				}));
			});

			const changeSentinelResult = await this.gameProcessLogic.changeSentinel({roomId});
			if(!changeSentinelResult.ok){
				console.error("Error changing sentinel after forcing attack for first turn:", changeSentinelResult.message);
				return;
			}
			allWS.forEach(([, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: changeSentinelResult.nextEvent,
				}));
			});

			const newTurnResult = await this.gameProcessLogic.startTurn(roomId);
			if(!newTurnResult.ok){
				console.error("Error starting new turn after forcing attack for first turn:", newTurnResult.message);
				return;
			}
			allWS.forEach(([, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: newTurnResult.nextEvent,
				}));
			});

			this.__endTurnTimer();
			return;
		}

		// Since his turn is over then we are the one who should end his turn but let's check also if he is a sentinel or not 
		const isCurrentPlayerIsSentinel = isCurrentASentinel(gameState);

		if(isCurrentPlayerIsSentinel){
			const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
			if(!endTurnResult.ok){
				console.error("Error starting the turn after timer ended:", endTurnResult.message);
				return;
			}

			const allWS = Array.from(this.wsPlayerBinderMap.entries());
			allWS.forEach(([, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: endTurnResult.nextEvent,
				}));
			});
		}else{
			const isAllowedToEnd = isNotSentinelOwnerAllowedToEnd(gameState);
			if(isAllowedToEnd.ok){
				const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
				if(!endTurnResult.ok){
					console.error("Error starting the turn after timer ended:", endTurnResult.message);
					return;
				}
				const allWS = Array.from(this.wsPlayerBinderMap.entries());
				allWS.forEach(([, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: endTurnResult.nextEvent,
					}));
				});
				this.__endTurnTimer();
				return;
			}

			if(isAllowedToEnd.code === "NO_ATTACKING_AND_NO_DRAW"){
				// We must draw the card for the player and then end his turn
				const cardsToJail = cardsToRemoveFromOverflowHand(gameState);
				if(cardsToJail.length > 0){
					const jailResult = await this.gameProcessLogic.jailCards({roomId, cardsToRemove: cardsToJail});
					if(!jailResult.ok){
						console.error("Error jailing cards after timer ended:", jailResult.message);
						return;
					}
					const allWSAfterJail = Array.from(this.wsPlayerBinderMap.entries());
					allWSAfterJail.forEach(([, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: jailResult.nextEvent,
						}));
					});

					// After jailing the cards we can end the turn
					const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
					if(!endTurnResult.ok){
						console.error("Error starting the turn after timer ended:", endTurnResult.message);
						return;
					}
					
					const allWS = Array.from(this.wsPlayerBinderMap.entries());
					allWS.forEach(([, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: endTurnResult.nextEvent,
						}));
					});
					this.__endTurnTimer();

				}
			}
		}
	}

	async __signalGameStatusToReconnectedPlayer(ws:WebSocket, roomId:string){
		const isReadyResult = await this.gameProcessLogic.isGamePreparationReady(roomId);
		if(isReadyResult.ok){
			ws.send(JSON.stringify({
				type: "INITIAL_CARD_IS_READY",
				message: "Everyone is ready. Starting the game...",
			}));
			return;
		}
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
		return true;
	}

	async __premadeRoom(roomId: string, playerIds: string[]){
		await this.roomLogic.setPreMadeRoom(roomId, playerIds.map(id=>({id})));
	}
}
