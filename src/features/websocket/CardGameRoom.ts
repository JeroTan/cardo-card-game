import { DurableObject } from "cloudflare:workers";
import type { TurnEvent } from "@/types/game/events";
import { cardsToRemoveFromOverflowHand, checkIfFirstTurnAndNoSentinelYet, convertTurnStateForClient, getCurrentPlayer, isCurrentASentinel, isNotSentinelOwnerAllowedToEnd } from "@/services/game/General";
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
		// console.log(`CardGameRoom received request for roomId: ${roomId} with type: ${requestType} from durable id: ${this.ctx.id.toString()}`);

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
			case "JOIN_CUSTOM_PRE_ROOM":{

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
		const allWS = this.ctx.getWebSockets().map(ws=>{
			return [ws.deserializeAttachment().playerId, ws];
		});

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

					allWS.forEach(([, playerWS])=>{
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

				allWS.forEach(([, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "EVERYONE_READY",
						message: "Everyone is ready. Starting the game...",
					}));
				});
				
				const gameState = await this.gameProcessLogic.getGameState(roomId);
				if(!gameState || (gameState && gameState.events.filter(event => event.type === "START_TURN").length === 0) ){
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
							data: convertTurnStateForClient(startTurnResult.nextEvent, playerId),
						}));
					});
					this.__endTurnTimer();
				}
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
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(result.nextEvent, id),
					}));
				});
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
				
				const attackResult = await this.gameProcessLogic.attackWithCards({roomId, attackingCardIds: attackingCards});
				if(!attackResult.ok){
					console.error("Error attacking with cards:", attackResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: attackResult.message,
					}));
					return;
				}
				// Broadcast the attack event to all players
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(attackResult.nextEvent, id),
					}));
				});


				// Discard the attacking cards from the player's hand and broadcast the event to all players, but only send the number of removed cards to opponents
				const removeFromHand = await this.gameProcessLogic.removeFromHand({roomId, cardsToRemove: attackingCards});
				if(!removeFromHand.ok){
					console.error("Error removing cards from hand for attack:", removeFromHand.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: removeFromHand.message,
					}));
					return;
				}

				let nextEvent = removeFromHand.nextEvent as TurnEvent;
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(nextEvent, id),
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

				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(changeSentinelResult.nextEvent, id),
					}));
				});

				// Jail the card if the attack is successful
				if(changeSentinelResult.gameState.events.filter(e=>e.type === "START_TURN").length > 1){
					const jailCardResult = await this.gameProcessLogic.jailSentinelCards({roomId});

					if(!jailCardResult.ok){
						console.error("Error jailing cards after attack:", jailCardResult.message);
						ws.send(JSON.stringify({
							type: "ERROR",
							message: jailCardResult.message,
						}));
						return;
					}

					allWS.forEach(([id, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: convertTurnStateForClient(jailCardResult.nextEvent, id),
						}));
					});
				}

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
				allWS.forEach(([playerId, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(result.nextEvent, playerId),
					}));
				});
				this.__endTurnTimer();
				break;
			}
			case "REQUEST_DISCARD_CARD":{
				const { cardsToDiscard } = jsonData.data as { cardsToDiscard: string[] };
				if(!cardsToDiscard || !Array.isArray(cardsToDiscard) || cardsToDiscard.length === 0){
					ws.send(JSON.stringify({
						type: "ERROR",
						message: "cardsToDiscard is required and should be a non-empty array",
					}));
				}
				const removeResult = await this.gameProcessLogic.removeFromHand({roomId, cardsToRemove: cardsToDiscard});
				if(!removeResult.ok){
					console.error("Error discarding cards from hand:", removeResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: removeResult.message,
					}));
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(removeResult.nextEvent, id),
					}));
				});

				const jailResult = await this.gameProcessLogic.jailSentinelCards({roomId});
				if(!jailResult.ok){
					console.error("Error jailing cards after discarding:", jailResult.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: jailResult.message,
					}));
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(jailResult.nextEvent, id),
					}));
				});
				break;
			}
			case "REQUEST_SURRENDER":{
				const result = await this.gameProcessLogic.setPlayerLose({roomId, playerId});
				if(!result.ok){
					console.error("Error surrendering:", result.message);
					ws.send(JSON.stringify({
						type: "ERROR",
						message: result.message,
					}));
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(result.nextEvent, id),
					}));
				});
				const gameState = result.gameState;
				const winnerResult = await this.gameProcessLogic.isThereAWinner({roomId});
				if(!winnerResult.ok){
					return this.__endTurnTimer();
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(winnerResult.nextEvent, id),
					}));
				});

				const usernameOfWinner = winnerResult.nextEvent.type === "PLAYER_WIN" ? gameState.playerInfo.find(player=>player.id === (winnerResult.nextEvent as any).playerId)?.username : "unknown";

				allWS.forEach(([, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "GAME_END",
						message: `Player ${usernameOfWinner} has won the game`
					}));
				});  
				return;
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
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
		console.log("Setting end turn timer for 60 seconds");
		this.ctx.storage.setAlarm(Date.now() + 1000 * 60);
	}

	async alarm(){
		const ws = this.ctx.getWebSockets()[0];
		const {roomId} = ws.deserializeAttachment() as {roomId: string, playerId: string};	
		if(!roomId ){
			console.warn("Alarm triggered without proper WebSocket attachment");
			return;
		}
		// Check the gameState
		let gameState = await this.gameProcessLogic.getGameState(roomId);
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

		// All WS
		const allWS = this.ctx.getWebSockets().map((ws)=>{
			return [ws.deserializeAttachment().playerId, ws];
		});

		const firstTurn = checkIfFirstTurnAndNoSentinelYet(gameState);
		if( firstTurn ){
			const playerInfo = getCurrentPlayer(gameState);
			const attackResult = await this.gameProcessLogic.attackWithCards({
				roomId,
				attackingCardIds: [playerInfo.cardsInHand[0].id], 
				forceOutOfTime: true,
			})
			if(!attackResult.ok){
				console.error("Error forcing attack for first turn:", attackResult.message);
				return;
			}
			allWS.forEach(([id, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: convertTurnStateForClient(attackResult.nextEvent, id),
				}));
			});

			// Remove from hand
			const removeFromHand = await this.gameProcessLogic.removeFromHand({
				roomId, 
				cardsToRemove: [playerInfo.cardsInHand[0].id],
			});
			if(!removeFromHand.ok){
				console.error("Error removing card from hand for first turn attack:", removeFromHand.message);
				return;
			}
			allWS.forEach(([id, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: convertTurnStateForClient(removeFromHand.nextEvent, id),
				}));
			});

			const changeSentinelResult = await this.gameProcessLogic.changeSentinel({roomId});
			if(!changeSentinelResult.ok){
				console.error("Error changing sentinel after forcing attack for first turn:", changeSentinelResult.message);
				return;
			}
			allWS.forEach(([id, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: convertTurnStateForClient(changeSentinelResult.nextEvent, id),
				}));
			});

			const newTurnResult = await this.gameProcessLogic.startTurn(roomId);
			if(!newTurnResult.ok){
				console.error("Error starting new turn after forcing attack for first turn:", newTurnResult.message);
				return;
			}
			allWS.forEach(([id, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: convertTurnStateForClient(newTurnResult.nextEvent, id),
				}));
			});

			this.__endTurnTimer();
			return;
		}

		// Since his turn is over then we are the one who should end his turn but let's check also if he is a sentinel or not 
		const isCurrentPlayerIsSentinel = isCurrentASentinel(gameState);
		if(isCurrentPlayerIsSentinel){
			// Check if there's an overflow in hand
			const cardsToJail = cardsToRemoveFromOverflowHand(gameState);
			if(cardsToJail.length > 0){
				const removeFromHandResult = await this.gameProcessLogic.removeFromHand({roomId, cardsToRemove: cardsToJail.map(card=>card.id)});
				if(!removeFromHandResult.ok){
					console.error("Error removing cards from hand after timer ended for sentinel:", removeFromHandResult.message);
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(removeFromHandResult.nextEvent, id),
					}));
				});
			};


			const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
			if(!endTurnResult.ok){
				console.error("Error starting the turn after timer ended:", endTurnResult.message);
				return;
			}

			allWS.forEach(([id, playerWS])=>{
				playerWS.send(JSON.stringify({
					type: "NEXT_EVENT",
					data: convertTurnStateForClient(endTurnResult.nextEvent, id),
				}));
			});
			this.__endTurnTimer();
		}else{
			const isAllowedToEnd = isNotSentinelOwnerAllowedToEnd(gameState);
			if(isAllowedToEnd.ok){
				const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
				if(!endTurnResult.ok){
					console.error("Error starting the turn after timer ended:", endTurnResult.message);
					return;
				}

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
				// Check if there's still a card in the deck to draw
				const currentPlayerInfo = getCurrentPlayer(gameState);
				if(currentPlayerInfo.cardsInDeck.length === 0){
					const playerLoseResult = await this.gameProcessLogic.setPlayerLose({roomId, playerId: currentPlayerInfo.id});
					if(!playerLoseResult.ok){
						console.error("Error setting player lose after timer ended with empty deck:", playerLoseResult.message);
						return;
					}
					
					allWS.forEach(([id, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: convertTurnStateForClient(playerLoseResult.nextEvent, id),
						}));
					});

					const winnerResult = await this.gameProcessLogic.isThereAWinner({roomId});
					if(!winnerResult.ok){
						return this.__endTurnTimer();
					}
					allWS.forEach(([id, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: convertTurnStateForClient(winnerResult.nextEvent, id),
						}));
					});

					const usernameOfWinner = winnerResult.nextEvent.type === "PLAYER_WIN" ? gameState.playerInfo.find(player=>player.id === (winnerResult.nextEvent as any).playerId)?.username : "unknown";

					allWS.forEach(([, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "GAME_END",
							message: `Player ${usernameOfWinner} has won the game`
						}));
					});  
					return;
				}

				const drawCardResult = await this.gameProcessLogic.drawCards({roomId, playerId: latestTurnEvent.playerId, cardsToDraw: 1});
				if(!drawCardResult.ok){
					console.error("Error drawing card after timer ended:", drawCardResult.message);
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(drawCardResult.nextEvent, id),
					}));
				});

				gameState = drawCardResult.gameRoom; // Update the game state after drawing the card to check if we need to jail any card due to hand limit

				// Check if card overflow happened and if yes then jail the card and end the turn
				const cardsToJail = cardsToRemoveFromOverflowHand(gameState);

				if(cardsToJail.length > 0){
					const removeFromHandResult = await this.gameProcessLogic.removeFromHand({roomId, cardsToRemove: cardsToJail.map(card=>card.id)});
					if(!removeFromHandResult.ok){
						console.error("Error removing cards from hand after timer ended:", removeFromHandResult.message);
						return;
					}
					allWS.forEach(([id, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: convertTurnStateForClient(removeFromHandResult.nextEvent, id),
						}));
					});

					const jailResult = await this.gameProcessLogic.jailCards({roomId, cardsToRemove: cardsToJail});
					if(!jailResult.ok){
						console.error("Error jailing cards after timer ended:", jailResult.message);
						return;
					}
		
					allWS.forEach(([id, playerWS])=>{
						playerWS.send(JSON.stringify({
							type: "NEXT_EVENT",
							data: convertTurnStateForClient(jailResult.nextEvent, id),
						}));
					});
				}
				// After jailing the cards we can end the turn
				const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
				if(!endTurnResult.ok){
					console.error("Error starting the turn after timer ended:", endTurnResult.message);
					return;
				}
				
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(endTurnResult.nextEvent, id),
					}));
				});
				this.__endTurnTimer();
			}

			if(isAllowedToEnd.code === "HAND_OVERFLOW"){
				// We must jail the card for the player and then end his turn
				const currentPlayerInfo = getCurrentPlayer(gameState);
				const cardsToJail = cardsToRemoveFromOverflowHand(gameState);
				const removeFromHandResult = await this.gameProcessLogic.removeFromHand({roomId, cardsToRemove: cardsToJail.map(card=>card.id)});
				if(!removeFromHandResult.ok){
					console.error("Error removing cards from hand after timer ended:", removeFromHandResult.message);
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(removeFromHandResult.nextEvent, id),
					}));
				});

				const jailResult = await this.gameProcessLogic.jailCards({roomId, cardsToRemove: cardsToJail});
				if(!jailResult.ok){
					console.error("Error jailing cards after timer ended:", jailResult.message);
					return;
				}

				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(jailResult.nextEvent, id),
					}));
				});

				const endTurnResult = await this.gameProcessLogic.startTurn(roomId);
				if(!endTurnResult.ok){
					console.error("Error starting the turn after timer ended:", endTurnResult.message);
					return;
				}
				allWS.forEach(([id, playerWS])=>{
					playerWS.send(JSON.stringify({
						type: "NEXT_EVENT",
						data: convertTurnStateForClient(endTurnResult.nextEvent, id),
					}));
				});
				this.__endTurnTimer();
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

	async __createCustomRoom(roomId: string, roomName: string = "Custom Room", inviteType: "INVITE_ONLY" | "OPEN"){
		await this.roomLogic.createRoom(roomId, roomName, inviteType);
	}

	async __updateCustomRoom({roomId, roomName, inviteType}: {roomId: string, roomName?: string, inviteType?: "INVITE_ONLY" | "OPEN"}){
		await this.roomLogic.updateRoom(roomId, {name: roomName, joinCondition: inviteType});
	}

	async __setRoomOwner(roomId: string, playerId: string){
		await this.roomLogic.setRoomOwner(roomId, playerId);
	}
	
	async __inviteAPlayer(roomId: string, playerInfo: {id: string, username: string}[]){
		await this.roomLogic.inviteToRoom(roomId, playerInfo);
	}

	async __joinCustomRoom(roomId: string, playerInfo: {id: string, username: string}){
		await this.roomLogic.joinRoom(roomId, [playerInfo]);
	}

	async __removePlayerFromRoom(roomId: string, playerId: string){
		await this.roomLogic.removePlayerFromRoom(roomId, playerId);
	}

	async __setPlayerReadyOnCustom(roomId: string, playerId: string){
		await this.roomLogic.playerReadyOnCustomRoom(roomId, playerId);
	}

	async __setPlayerNotReadyOnCustom(roomId: string, playerId: string){
		await this.roomLogic.playerNotReadyOnCustomRoom(roomId, playerId);
	}

	async __getRoomState(roomId: string){
		const roomState = await this.roomLogic.getRoomInfo(roomId);
		return roomState;
	}
}
