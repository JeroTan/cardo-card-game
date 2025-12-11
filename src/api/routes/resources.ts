import { typedEnv } from "@/lib/elysia";
import { getCardImage } from "@/lib/r2";
import Elysia, { t } from "elysia";



export function ResourcesRoutes({app}:{app: Elysia}){

  // For public resources like images, etc.
  app
    .use(typedEnv)
    .group('/public/resources', (app) => {
      return app
      .get("/card/:id", async ({params, env})=>{
        const image = await getCardImage({env, id: params.id});
        if(!image){
          return new Response(JSON.stringify({
            message: "Image not found",
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // Convert File to blob and return with proper headers for inline display
        return new Response(image, {
          headers: {
            'Content-Type': image.type,
            'Cache-Control': 'public, max-age=31536000, immutable',
          }
        });
      }, {
        params: t.Object({
          id: t.String()
        }),
        detail: {
          summary: 'Get card image by ID',
          tags: ['Public Resources']
        }
      })

    })
  
}