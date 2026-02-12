import { generateRoomId } from "@/services/game/General";
import { cleanseDurableObjectStorage, stabRequest, stabRequestBody } from "@/lib/durableObject";
import { MatchmakingLogic } from "@/services/game/MatchmakingLogic";
import { DurableObject } from "cloudflare:workers";
import type { CardGameRoom } from "./CardGameRoom";

export class MatchmakingPlayer extends DurableObject {
  private wsPlayerBinderMap = new Map<string, WebSocket>(); // Map to bind playerId with their WebSocket connection 
  public matchMaker: MatchmakingLogic;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.matchMaker = new MatchmakingLogic(this.ctx.storage);
  } 

  async fetch(request: Request) {
    console.log(`MatchmakingPlayer received request from durable id: ${this.ctx.id.toString()}`);

    // We need to check first if the request has player id to proceed with matchmaking
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    if (!playerId) {
      return Response.json({ error: "playerId is required" }, { status: 400 });
    }
    console.log(`Player ${playerId} is trying to join matchmaking`);

    // Generate4 Websocket pair for communication
    const [client, server] = Object.values(new WebSocketPair());
    // Accept the WebSocket connection in Durable Object state
    this.ctx.acceptWebSocket(server);

    // If yes add it to the matchmaking queue and wait for opponent
    await this.matchMaker.addPlayer(playerId);
    this.wsPlayerBinderMap.set(playerId, server);
    // Serialize the websocket with playerId for later use
    server.serializeAttachment({ playerId });

    server.send(JSON.stringify({
      type: "JOINED_QUEUE",
      message: "You have joined the matchmaking queue. Waiting for an opponent...",
    }));

    // Find a match for the player`
    this.__findMatch(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void | Promise<void> {
    console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}, WasClean: ${wasClean}`);
    if(!ws.deserializeAttachment || !ws.deserializeAttachment().playerId){
      console.warn("WebSocket closed without playerId attachment");
    }
    const playerId = ws.deserializeAttachment()?.playerId as string;
    this.matchMaker.removePlayer(playerId);
    this.wsPlayerBinderMap.delete(playerId);
  }

  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
    console.error("WebSocket error:", error);
    ws.close(1011, "WebSocket error");
  }

  async __findMatch(serverWS: WebSocket) {
    const playerId = serverWS.deserializeAttachment()?.playerId as string;
    const matchReport = await this.matchMaker.isMatchReadyFor(playerId);
    if(matchReport.ok){
      const roomId = generateRoomId();

      matchReport.players.forEach(async (player)=>{
        const playerWS = this.wsPlayerBinderMap.get(player.playerId);
        const { CARD_GAME_ROOM } = this.env;
        const stub = CARD_GAME_ROOM.get(CARD_GAME_ROOM.idFromName(roomId)) as DurableObjectStub<CardGameRoom>;
        await stub.__premadeRoom(roomId, matchReport.players.map(player=>player.playerId));

        if(playerWS){
          playerWS.send(JSON.stringify({
            type: "MATCH_FOUND",
            roomId: roomId,
          }));
        }

        // Remove players from matchmaking queue
        this.matchMaker.removePlayer(player.playerId);
        this.wsPlayerBinderMap.delete(player.playerId);
      });

    }else{
      serverWS.send(JSON.stringify({
        type: "WAITING_FOR_OPPONENT",
        playersInQueue: matchReport.players.length,
      }));
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    
  }
  
  async __cleanupStorage(){
    this.matchMaker.poolCleanse();
  }
  
}