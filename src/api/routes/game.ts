import  { CardGameController } from "@/controller/game";
import { getTemporaryUser, getUserAuthInformation, setTemporaryUser } from "@/lib/authentication/userAuth";
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
      app.get("/find-match", async ({env, astroCookies, request})=>{
        const {data: userInfo, error} = getUserAuthInformation(astroCookies);
        let playerId: string;
        if(error != null){
          const {data: userInfo, error} = getTemporaryUser(astroCookies);
          const info = {
            username: "Guest",
            id: "",
          }
          if(error != null){
            const newTemporaryUser = setTemporaryUser(astroCookies);
            info.id = newTemporaryUser.id;
            info.username = newTemporaryUser.username;
          }else{
            info.id = userInfo.id;
            info.username = userInfo.username;
          }
          playerId = info.id;
        } else {
          playerId = userInfo.id;
        }
        
        // Get the Durable Object for matchmaking
        const { MATCHMAKING_PLAYER } = env;
        const id = MATCHMAKING_PLAYER.idFromName("global-queue");
        const stub = MATCHMAKING_PLAYER.get(id);
        
        // Forward the WebSocket upgrade request with playerId
        const url = new URL(request.url);
        url.searchParams.set("playerId", playerId);
        
        const response = await stub.fetch(new URL(url.pathname + url.search, "https://internal").toString(), {
          method: request.method,
          headers: request.headers,
        });
        
        // Return the WebSocket upgrade response
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
          webSocket: (response as any).webSocket
        });
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