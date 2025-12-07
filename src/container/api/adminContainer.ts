import { AdminRoutes } from '@/api/routes/admin';
import { CardController } from '@/controller/admin/card';
import { CardService } from '@/services/card';
import { Elysia } from 'elysia'

export function AdminContainer(app: Elysia<"/admin">){
  // Services
  const services = {
    card: new CardService(),
  };

  // Controllers
  const controller = {
    card: new CardController(services.card),
  }


  // Routes Insertion
  AdminRoutes({
    app,
    cardController: controller.card
  });

  return app;
}