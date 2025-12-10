import { typedEnv } from "@/lib/elysia";
import { getCardImage } from "@/lib/r2";
import Elysia, { t } from "elysia";



export function ResourcesRoutes({app}:{app: Elysia}){

  // For public resources like images, etc.
  app
    .use(typedEnv)
    .group('/public/resources', (app) => {
      return app
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
        }),
        detail: {
          summary: 'Get card image by ID',
          tags: ['Resources']
        }
      })

    })
  
}