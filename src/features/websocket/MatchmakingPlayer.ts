import { generateRoomId } from "@/features/game/utils/room";
import { MatchmakingLogic } from "@/services/game/MatchmakingLogic";
import { DurableObject } from "cloudflare:workers";

export class MatchmakingPlayer extends DurableObject {
  public matchMaker: MatchmakingLogic;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.matchMaker = new MatchmakingLogic(this.ctx.storage);
  } 

  async fetch(request: Request) {
    console.log(`MatchmakingPlayer received request from id: ${this.ctx.id.toString()}`);

    // We need to check first if the request has player id to proceed with matchmaking
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    if (!playerId) {
      return Response.json({ error: "playerId is required" }, { status: 400 });
    }


    // Generate4 Websocket pair for communication
    const [client, server] = Object.values(new WebSocketPair());
    // Accept the WebSocket connection in Durable Object state
    this.ctx.acceptWebSocket(server);

    
    // If yes add it to the matchmaking queue and wait for opponent
    await this.matchMaker.addPlayer(playerId);
    // Serialize the websocket with playerId for later use
    server.serializeAttachment({ playerId });

    server.send(JSON.stringify({
      type: "JOINED_QUEUE",
      message: "You have joined the matchmaking queue. Waiting for an opponent...",
    }))

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void | Promise<void> {
    if(!ws.deserializeAttachment || !ws.deserializeAttachment().playerId){
      console.warn("WebSocket closed without playerId attachment");
    }
    const playerId = ws.deserializeAttachment()?.playerId as string;
    this.matchMaker.removePlayer(playerId);
  }

  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
    console.error("WebSocket error:", error);
    ws.close(1011, "WebSocket error");
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const matchReport = await this.matchMaker.isMatchReady();
    if(matchReport.ok){
      ws.send(JSON.stringify({
        type: "MATCH_FOUND",
        roomId: generateRoomId(),
      }));
    }else{
      ws.send(JSON.stringify({
        type: "WAITING_FOR_OPPONENT",
        playersInQueue: matchReport.players.length,
      }));
    }
  }
  
  
}