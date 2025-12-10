import type { CardController } from '@/controller/admin/card';
import { typedEnv } from '@/lib/elysia';
import { tboxCardCreate, zodCardCreate } from '@/types/api/card';
import { tBoxQueryParams } from '@/types/api/query';
import { Elysia, t, type Context } from 'elysia'
import z from 'zod';

export function AdminRoutes({
  app,
  cardController
}:{
  app: Elysia
  cardController: CardController,
}){
  app
  .use(new Elysia({prefix: '/admin'}))
  .use(typedEnv)
  .onError((err) => {
    console.error("Admin Route Error:", err);
  })

  // Cards
  .get("/cards", ({env, query}: {env:Env, query: any})=>{
    return cardController.getAllCards({env});
  }, {
    query: tBoxQueryParams,
    detail: {
      summary: 'Get all cards',
      tags: ['Cards']
    }
  })
  .post("/cards", ({body, env})=>{
    return cardController.createCard( {cardData:body, env});
  }, {
    type: "multipart/form-data",
    body: tboxCardCreate(),
    detail: {
      summary: 'Create a new card',
      tags: ['Cards']
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
  })

  return app;
}