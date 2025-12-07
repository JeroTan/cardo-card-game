import type { CardController } from '@/controller/admin/card';
import { Elysia } from 'elysia'

export function AdminRoutes({
  app,
  cardController
}:{
  app: Elysia
  cardController: CardController,
}){
  app
  .use(new Elysia({prefix: '/admin'}))
  .get("/cards", cardController.getAllCards)

  return app;
}