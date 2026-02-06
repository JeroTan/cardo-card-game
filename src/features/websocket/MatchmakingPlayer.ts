import { generateRoomId } from "@/features/game/utils/room";

export class MatchmakingPlayer {
  state: DurableObjectState;
  waitingPlayers: Map<string, { playerId: string; joinedAt: number; socket: WebSocket }> = new Map();
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const method = request.method;
    console.log(`MatchmakingPlayer received request: ${method} ${request.url}`);
    switch (method) {
      case "POST": {
        const body = await request.json() as { type: string, playerId: string };

        if (body.type === "JOIN_QUEUE") {
          console.log(`Player ${body.playerId} requested to join matchmaking queue`);
          if (!body.playerId) {
            return Response.json({ error: "playerId is required" }, { status: 400 });
          }

          return Response.json({ 
            success: true, 
            message: "Join matchmaking via WebSocket",
            playerId: body.playerId 
          });
        }

        return Response.json({ error: "Unknown type" }, { status: 404 });
      }

      case "GET":
      default: {
        // Handle WebSocket upgrade
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
          return new Response("Expected Upgrade: websocket", { status: 426 });
        }

        const url = new URL(request.url);
        const playerId = url.searchParams.get("playerId");

        if (!playerId) {
          return Response.json({ error: "playerId is required" }, { status: 400 });
        }

        const [client, server] = Object.values(new WebSocketPair());

        // Add player to waiting list immediately
        this.waitingPlayers.set(playerId, {
          playerId,
          joinedAt: Date.now(),
          socket: server,
        });

        // Send initial waiting status
        server.send(
          JSON.stringify({
            status: "waiting",
            queuePosition: this.waitingPlayers.size,
          })
        );

        // Check if we have 2+ players to match
        this.tryMatchPlayers();

        server.addEventListener("close", () => {
          // Remove player from queue if they disconnect
          this.waitingPlayers.delete(playerId);
        });

        server.addEventListener("error", () => {
          // Remove player from queue on error
          this.waitingPlayers.delete(playerId);
        });

        return new Response(null, { status: 101, webSocket: client });
      }
    }
  }

  private async tryMatchPlayers() {
    if (this.waitingPlayers.size >= 2) {
      const players = Array.from(this.waitingPlayers.values());
      const player1 = players[0];
      const player2 = players[1];
      const roomId = generateRoomId();

      // Initialize the CardGameRoom with both players
      if (this.env?.CARD_GAME_ROOM) {
        const roomDO = this.env.CARD_GAME_ROOM;
        const id = roomDO.idFromName(roomId);
        const stub = roomDO.get(id);

        // Pre-initialize the room with player data
        await stub.fetch("https://internal/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            players: [
              { playerId: player1.playerId },
              { playerId: player2.playerId }
            ]
          })
        });
      }

      // Notify both players they matched
      player1.socket.send(
        JSON.stringify({
          status: "matched",
          roomId,
          opponent: player2.playerId,
        })
      );

      player2.socket.send(
        JSON.stringify({
          status: "matched",
          roomId,
          opponent: player1.playerId,
        })
      );

      // Remove matched players
      this.waitingPlayers.delete(player1.playerId);
      this.waitingPlayers.delete(player2.playerId);

      // Close sockets after match notification
      setTimeout(() => {
        player1.socket.close(1000, "Matched");
        player2.socket.close(1000, "Matched");
      }, 100);
    }
  }
}