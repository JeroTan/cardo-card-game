import type { CardController } from '@/controller/admin/card';
import { tboxCardCreate, zodCardCreate } from '@/types/api/card';
import { Elysia, t } from 'elysia'
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
  .onError((err) => {
    console.error("Admin Route Error:", err);
  })

  // Cards
  .get("/cards", cardController.getAllCards)

  .post("/cards", async ({body})=>{
    console.log("Body in route:",body);  
    // console.log("Body keys:", Object.keys(body));
    // console.log("Body types:", Object.entries(body).map(([key, val]) => [key, typeof val, val instanceof File ? 'File' : '']));
    // return cardController.createCard( body);
    return "SAMPLE RESPONSE FROM ROUTE"
  }, {
    type: "multipart/form-data",
    body: tboxCardCreate(),
    detail: {
      summary: 'Create a new card',
      tags: ['Cards']
    }
  })

  return app;
}