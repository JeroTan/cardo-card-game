import { DurableObject } from "cloudflare:workers";

export class ChatRoom extends DurableObject {
	async fetch(request: Request): Promise<Response> {
		// Check for WebSocket upgrade
		const upgradeHeader = request.headers.get("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return new Response("Expected Upgrade: websocket", { status: 426 });
		}

		// Create WebSocket pair
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		// Accept the WebSocket connection
		this.ctx.acceptWebSocket(server);

		const connectionCount = this.ctx.getWebSockets().length;
		console.log(`New connection. Total connections: ${connectionCount}`);

		// Send system message to the newly connected client
		const systemMessage = JSON.stringify({
			system: {
				message: `WebSocket is connected for id ${this.ctx.id.toString()}`,
				connections: connectionCount,
				timestamp: new Date().toISOString(),
			},
		});

		// Send welcome message to the new client
		server.send(systemMessage);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		// Broadcast message to all connected clients
		const messageText = typeof message === "string" ? message : new TextDecoder().decode(message);

		console.log(`Broadcasting message: ${messageText}`);

		// Get all WebSockets in this room
		const webSockets = this.ctx.getWebSockets();

		// Broadcast to all clients except sender
		for (const socket of webSockets) {
			if (socket !== ws) {
				try {
					socket.send(messageText);
				} catch (err) {
					console.error("Error sending message:", err);
				}
			}
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
		ws.close(code, "Durable Object is closing WebSocket");
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("WebSocket error:", error);
	}
}
