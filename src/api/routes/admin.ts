import type { CardController } from '@/controller/admin/card';
import { Elysia } from 'elysia'

export function AdminRoutes({
  app,
  cardController
}:{
  app: Elysia<"/admin">
  cardController: CardController,
}){
  app
  .get("/cards", cardController.getAllCards)

  return app;
}