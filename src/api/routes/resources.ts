import { typedEnv } from "@/lib/elysia";
import { getCardImage } from "@/lib/r2";
import Elysia, { t } from "elysia";



export function ResourcesRoutes(app: Elysia){

  // For public resources like images, etc.
  app
    .use(new Elysia({prefix: '/public/resources'}))
    .use(typedEnv)
    .get("/card/:id", ({params, env})=>{
      const image = getCardImage({env, id: params.id});
      if(!image){
        return Response.json({
          message: "Image not found",
        }, {status: 404});
      }
      return image;
    }, {
      params: t.Object({
        id: t.String()
      })
    })



  
}