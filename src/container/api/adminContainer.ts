import { AdminRoutes } from '@/api/routes/admin';
import { ResourcesRoutes } from '@/api/routes/resources';
import { CardController } from '@/controller/admin/card';
import { CardService } from '@/services/card';
import { Elysia } from 'elysia'

export function AdminContainer(app: Elysia){
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
  ResourcesRoutes({
    app,
  })

  return app;
}