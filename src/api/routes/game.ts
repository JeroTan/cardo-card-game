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

      app.get("/room/:id", async ({params, env, request})=>{
        const response = await gameController.prepareRoom({
          roomId: params.id,
          env: env,
        });
        // Clone the response to make it mutable for Elysia
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers)
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
      return app;
    })
}