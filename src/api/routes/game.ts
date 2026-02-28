import  { CardGameController } from "@/controller/game";
import { getTemporaryUser, getUserAuthInformation, setTemporaryUser } from "@/lib/authentication/userAuth";
import { typedAstroCookies, typedEnv, typedUrlData } from "@/lib/elysia";
import { getPlayerOnSession } from "@/services/game/MatchmakingLogic";
import type Elysia from "elysia";
import { t } from "elysia";


export function GameRoutes({
  app,
  gameController,
}:{
  app: Elysia,
  gameController: CardGameController,
}){
    app
    .use(typedEnv)
    .use(typedUrlData)
    .use(typedAstroCookies)
    .group("/game", (app)=>{
      app.get("/find-match", async ({env, astroCookies, request})=>{
        const {playerId} = getPlayerOnSession(astroCookies);
        return gameController.findMatch({playerId, env, request});
      }, {
        detail:{
          summary: "Create a new game room",
          tags: ["Game Room"],
        },
      })

      app.get("/room/:id", async ({params, env, request, astroCookies})=>{
        const {playerId, playerUsername} = getPlayerOnSession(astroCookies);
        return await gameController.joinRoom({
          roomId: params.id,
          env: env,
          playerId,
          playerUsername,
          request,
        });
      }, {
        detail:{
          summary: "Get game room info through websocket",
          tags: ["Game Room"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
      })
      app.get("/room/:id/check", async ({params, env})=>{
        return await gameController.checkRoom({roomId: params.id, env});
      }, {
        detail:{
          summary: "Check if room is available",
          tags: ["Game Room"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
      })
      app.get("/room/:id/game-state", async ({params, env, astroCookies})=>{
        const  {playerId} = getPlayerOnSession(astroCookies);
        return await gameController.getGameState({roomId: params.id, env, playerId});
      }, {
        detail:{
          summary: "Get current game state of the room",
          tags: ["Game Room"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
      })

      // Custom room lobby routes
      app.post("/room/create", async ({env, astroCookies, body})=>{
        console.log("Create custom room request received with body:", body);
        const {playerId, playerUsername} = getPlayerOnSession(astroCookies);
        return await gameController.createCustomRoom({
          roomName: body.roomName,
          type: body.type,
          userId: playerId,
          username: playerUsername,
          env,
        });
      }, {
        body: t.Object({
          roomName: t.String({minLength: 3, maxLength: 50}),
          type: t.Optional(t.Union([t.Literal("OPEN"), t.Literal("INVITE_ONLY")])),
        }),
        detail:{
          summary: "Create a new custom room",
          tags: ["Game Room", "Lobby"],
        },
      })

      app.post("/room/join", async ({body, env, astroCookies})=>{
        const {playerId, playerUsername} = getPlayerOnSession(astroCookies);
        return await gameController.joinRoomByCode({
          code: body.code,
          userId: playerId,
          username: playerUsername,
          env,
        });
      }, {
        detail:{
          summary: "Join a room by code",
          tags: ["Game Room", "Lobby"],
        },
        body: t.Object({
          code: t.String({minLength: 6, maxLength: 6}),
        }),
      })

      app.post("/room/:id/join", async ({params, env, astroCookies})=>{
        const {playerId, playerUsername} = getPlayerOnSession(astroCookies);
        // For direct room ID join (not by code)
        return Response.json({roomId: params.id, message: "Use websocket endpoint instead"}, {status: 200});
      }, {
        detail:{
          summary: "Join room by ID",
          tags: ["Game Room", "Lobby"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
      })

      app.post("/room/:id/remove-player", async ({params, body, env, astroCookies})=>{
        const {playerId} = getPlayerOnSession(astroCookies);
        return await gameController.removePlayerFromRoom({
          roomId: params.id,
          targetPlayerId: body.targetPlayerId,
          env,
        });
      }, {
        detail:{
          summary: "Remove a player from the room (creator only)",
          tags: ["Game Room", "Lobby"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
        body: t.Object({
          targetPlayerId: t.String(),
        }),
      })

      app.post("/room/:id/ready", async ({params, env, astroCookies, query})=>{
        const {playerId} = getPlayerOnSession(astroCookies);
        return await gameController.toggleReadyState({
          roomId: params.id,
          userId: playerId,
          env,
          ready: query.ready,
        });
      }, {
        detail:{
          summary: "Toggle player ready state",
          tags: ["Game Room", "Lobby"],
        },
        query: t.Object({
          ready: t.Optional(t.Boolean()),
        }),
        params: t.Object({
          id: t.Required(t.String())
        }),
      })

      app.post("/room/:id/add-bot", async ({params, body, env})=>{
        return await gameController.addBotPlayer({
          roomId: params.id,
          difficulty: body.difficulty || "MEDIUM",
          env,
        });
      }, {
        detail:{
          summary: "Add a bot player to the room",
          tags: ["Game Room", "Lobby"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
        body: t.Object({
          difficulty: t.Optional(t.Union([t.Literal("EASY"), t.Literal("MEDIUM"), t.Literal("HARD")])),
        }),
      })

      app.get("/room/:id/custom-room-state", async ({params, env})=>{
        return await gameController.getRoomState({
          roomId: params.id,
          env,
        });
      },{
        detail:{
          summary: "Get current state of the custom room lobby",
          tags: ["Game Room", "Lobby"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
      });

      app.patch("/room/:id/update", async ({params, body, env, astroCookies})=>{
        return await gameController.updateCustomRoom({
          roomId: params.id,
          roomName: body.roomName,
          inviteType: body.inviteType,
          env,
        });
      }, {
        detail:{
          summary: "Update custom room settings (creator only)",
          tags: ["Game Room", "Lobby"],
        },
        params: t.Object({
          id: t.Required(t.String())
        }),
        body: t.Object({
          roomName: t.Optional(t.String({minLength: 3, maxLength: 50})),
          inviteType: t.Optional(t.Union([t.Literal("OPEN"), t.Literal("INVITE_ONLY")])),
        }),
      })

      return app;
    })
}