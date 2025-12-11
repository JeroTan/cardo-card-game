import type { CardController } from '@/controller/admin/card';
import { typedEnv, typedUrlData } from '@/lib/elysia';
import { tboxCardCreate } from '@/types/api/card';
import { tboxQueryParams, tboxPaginationParams } from '@/types/api/query';
import { convertQueriesToPageAndQueryProps, getQueryTransformer } from '@/utils/api/query';
import { Elysia, t } from 'elysia'

export function AdminRoutes({
  app,
  cardController
}:{
  app: Elysia
  cardController: CardController,
}){
  app
  .use(typedEnv)
  .use(typedUrlData)
  .onError((err) => {
    console.error("Admin Route Error:", err);
  })
  .group('/admin', (app) => {
    app
    // Cards
    .get("/cards", ({env, query, urlData})=>{
      const { queryProps, pageProps } = convertQueriesToPageAndQueryProps(query);
      return cardController.getAllCards({env, origin: urlData.origin, queryProps, pageProps});
    }, {
      query: t.Composite([tboxQueryParams, tboxPaginationParams]),
      detail: {
        summary: 'Get all cards',
        tags: ['Admin Cards Management']
      },
      transform({query}){
        getQueryTransformer(query);
      }
    })
    .post("/cards", ({body, env})=>{
      return cardController.createCard( {cardData:body, env});
    }, {
      type: "multipart/form-data",
      body: tboxCardCreate(),
      detail: {
        summary: 'Create a new card',
        tags: ['Admin Cards Management']
      },
      transform({body}){
        if(body?.atk && typeof body.atk === 'string'){
          body.atk = Number(body.atk);
        }
        if(body?.def && typeof body.def === 'string'){
          body.def = Number(body.def);
        }
        if(body?.rarity && typeof body.rarity === 'string'){
          body.rarity = Number(body.rarity);
        }
      }
    });
    return app;
  })

  return app;
}