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
      app.get("/find-quick-match", ({env, astroCookies})=>{
       
      }, {})

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
      return app;
    })
}