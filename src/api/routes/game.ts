import  { CardGameController } from "@/controller/game";
import { typedAstroCookies, typedEnv, typedUrlData } from "@/lib/elysia";
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
      app.get("/room:id", ({params, env, request})=>{
        return gameController.prepareRoom({
          roomId: params.id,
          env: env,
          request: request,
        })
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