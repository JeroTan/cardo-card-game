import { DurableObject } from "cloudflare:workers";
import type { RoomState, TurnEvent } from "@/types/game/events";
import { convertRoomStateForClient, validateGameEvent } from "@/features/game/utils/room";

export class CardGameRoom extends DurableObject {
	private roomState: RoomState | null = null;
	private playerSockets: Map<string, WebSocket> = new Map();

	async fetch(request: Request): Promise<Response> {
		const method = request.method;

		switch (method) {
			case "POST": {
				const body = await request.json() as {
					type: string,
					roomId?: string,
					playerId?: string,
					cardIds?: string[],
					players?: Array<{ playerId: string }>
				};

				if (body.type === "DRAW_CARD" || body.type === "ATTACKING") {
					if (!this.roomState) {
						return Response.json({ error: "Room not initialized" }, { status: 400 });
					}

					if (!body.playerId) {
						return Response.json({ error: "playerId is required" }, { status: 400 });
					}

					// Convert cardIds to actual cards from player's deck
					let event: TurnEvent | null = null;
					const player = this.roomState.playerInfo.players.find(p => p.id === body.playerId);

					if (!player) {
						return Response.json({ error: "Player not found" }, { status: 404 });
					}

					if (body.type === "DRAW_CARD" && body.cardIds) {
						const drawnCards = player.cardsInDeck.filter(card => body.cardIds!.includes(card.id));
						event = {
							type: "DRAW_CARD",
							playerId: body.playerId,
							drawn_cards: drawnCards,
						};
					} else if (body.type === "ATTACKING" && body.cardIds) {
						const attackCards = player.cardsInDeck.filter(card => body.cardIds!.includes(card.id));
						event = {
							type: "ATTACKING",
							playerId: body.playerId,
							card_used: attackCards,
						};
					}

					if (!event) {
						return Response.json({ error: "Invalid event type or missing data" }, { status: 400 });
					}

					// Validate the event
					const validation = validateGameEvent(event, this.roomState);
					if (!validation.valid) {
						return Response.json({ error: validation.error }, { status: 400 });
					}

					// Add event to room state
					this.roomState.events.push(validation.event);

					// Broadcast event to all players
					this.broadcastEvent(validation.event);

					return Response.json({ success: true, event: validation.event });
				}

				if (body.type === "JOIN_ROOM") {
					if (!body.roomId) {
						return Response.json({ error: "roomId is required" }, { status: 400 });
					}

					// Initialize room state if not exists
					if (!this.roomState) {
						this.roomState = {
							roomId: body.roomId,
							playerInfo: { players: [] },
							events: [],
							createdAt: new Date().toISOString(),
							status: "waiting",
						};
					}

					return Response.json({ success: true, roomState: convertRoomStateForClient(this.roomState) });
				}

				// Handle room initialization from matchmaking
				if (!body.roomId || !body.players) {
					return Response.json({ error: "roomId and players are required" }, { status: 400 });
				}

				// Initialize room state with matched players
				this.roomState = {
					roomId: body.roomId,
					playerInfo: {
						players: body.players.map(p => ({
							id: p.playerId,
							username: `Player-${p.playerId.slice(0, 6)}`,
							cardsInDeck: [],
							jailedCards: [],
							turnLeft: 0,
							timeLeft: new Date(Date.now() + 60000).toISOString(),
						}))
					},
					events: [
						{ type: "PLAYER_JOIN", playerId: body.players[0].playerId },
						{ type: "PLAYER_JOIN", playerId: body.players[1].playerId },
					],
					createdAt: new Date().toISOString(),
					status: "waiting",
				};

				return Response.json({ success: true });
			}

			case "GET":
			default: {
				// Check for WebSocket upgrade
				const upgradeHeader = request.headers.get("Upgrade");
				if (!upgradeHeader || upgradeHeader !== "websocket") {
					return new Response("Expected Upgrade: websocket", { status: 426 });
				}

				// Extract playerId from URL query params
				const url = new URL(request.url);
				const playerId = url.searchParams.get("playerId");
				const roomId = url.searchParams.get("roomId");

				if (!playerId || !roomId) {
					return new Response("playerId and roomId are required", { status: 400 });
				}

				// Initialize room state if not already initialized (fallback)
				if (!this.roomState) {
					this.roomState = {
						roomId,
						playerInfo: { players: [] },
						events: [],
						createdAt: new Date().toISOString(),
						status: "waiting",
					};
				}

				// Check if game is finished
				if (this.roomState.status === "finished") {
					return new Response("Game is over. Room is disbanded.", { status: 403 });
				}

				// Check if game has started
				const gameStarted = this.roomState.events.some(e => e.type === "GAME_START");

				if (gameStarted) {
					// Game already started - only allow players who were in initial PLAYER_JOIN events
					const isInitialPlayer = this.roomState.playerInfo.players.some(p => p.id === playerId);
					
					if (!isInitialPlayer) {
						return new Response("Game has already started. Only initial players can join.", { status: 403 });
					}
				} else {
					// Game hasn't started - allow new players to join
					const existingPlayer = this.roomState.playerInfo.players.find(p => p.id === playerId);
					
					if (!existingPlayer) {
						// Add new player to room
						const joinEvent: TurnEvent = {
							type: "PLAYER_JOIN",
							playerId,
						};
						this.roomState.events.push(joinEvent);

						this.roomState.playerInfo.players.push({
							id: playerId,
							username: `Player-${playerId.slice(0, 6)}`,
							cardsInDeck: [],
							jailedCards: [],
							turnLeft: 0,
							timeLeft: new Date(Date.now() + 60000).toISOString(),
						});
					}
				}

				// Create WebSocket pair
				const webSocketPair = new WebSocketPair();
				const [client, server] = Object.values(webSocketPair);

				// Accept the WebSocket connection
				this.ctx.acceptWebSocket(server);

				// Store player socket
				this.playerSockets.set(playerId, server);

				// Send current room state to the joining player (converted to client-safe format)
				server.send(JSON.stringify({
					type: "ROOM_STATE",
					data: convertRoomStateForClient(this.roomState),
				}));

				// Check if all matched players are now connected
				const allPlayersConnected = this.roomState.playerInfo.players.every(
					p => this.playerSockets.has(p.id)
				);

				// Start game if all players connected and game hasn't started
				if (allPlayersConnected && this.roomState.status === "waiting") {
					this.startGame();
				}

				return new Response(null, {
					status: 101,
					webSocket: client,
				});
			}
		}
	}

	private startGame() {
		if (!this.roomState) return;

		this.roomState.status = "playing";

		const gameStartEvent: TurnEvent = {
			type: "GAME_START",
		};
		this.roomState.events.push(gameStartEvent);

		// Broadcast game start to all players
		this.broadcastEvent(gameStartEvent);
	}

	private endGame(winnerId?: string) {
		if (!this.roomState) return;

		this.roomState.status = "finished";

		const gameEndEvent: TurnEvent = {
			type: "GAME_END",
		};
		this.roomState.events.push(gameEndEvent);

		// Broadcast game end to all players
		this.broadcastEvent(gameEndEvent);

		// Close all player connections after a short delay
		setTimeout(() => {
			for (const socket of this.playerSockets.values()) {
				socket.close(1000, "Game finished");
			}
			this.playerSockets.clear();
		}, 5000); // 5 seconds to allow players to see the result
	}

	private broadcastEvent(event: TurnEvent, excludePlayerId?: string) {
		const message = JSON.stringify({
			type: "GAME_EVENT",
			event,
		});

		for (const [playerId, socket] of this.playerSockets) {
			if (playerId !== excludePlayerId) {
				try {
					socket.send(message);
				} catch (err) {
					console.error(`Error sending to player ${playerId}:`, err);
				}
			}
		}
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		// Handle incoming game actions
		const messageText = typeof message === "string" ? message : new TextDecoder().decode(message);
		
		try {
			const data = JSON.parse(messageText);
			
			// Handle different game actions here
			// For now, just log and broadcast
			console.log(`Received message:`, data);
			
			// Broadcast to all clients except sender
			const webSockets = this.ctx.getWebSockets();
			for (const socket of webSockets) {
				if (socket !== ws) {
					socket.send(messageText);
				}
			}
		} catch (err) {
			console.error("Error processing message:", err);
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		// Find and remove the disconnected player
		for (const [playerId, socket] of this.playerSockets) {
			if (socket === ws) {
				this.playerSockets.delete(playerId);
				
				if (this.roomState) {
					const playerOutEvent: TurnEvent = {
						type: "PLAYER_OUT",
						playerId,
					};
					this.roomState.events.push(playerOutEvent);
					this.broadcastEvent(playerOutEvent);
				}
				
				console.log(`Player ${playerId} disconnected`);
				break;
			}
		}
		
		ws.close(code, "Player disconnected");
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("WebSocket error:", error);
	}
}
