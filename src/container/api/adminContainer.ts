import { AdminRoutes } from '@/api/routes/admin';
import { ResourcesRoutes } from '@/api/routes/resources';
import { CardController } from '@/controller/admin/card';
import { CardPackController } from '@/controller/admin/cardPacks';
import { CardService } from '@/services/card';
import { CardPackService } from '@/services/cardPack';
import { Elysia } from 'elysia'

export function AdminContainer(app: Elysia){
  // Services
  const services = {
    card: new CardService(),
    cardPack: new CardPackService(),
  };

  // Controllers
  const controller = {
    card: new CardController(services.card),
    cardPack: new CardPackController(services.cardPack, services.card),
  }


  // Routes Insertion
  AdminRoutes({
    app,
    cardController: controller.card,
    cardPackController: controller.cardPack,
  });
  ResourcesRoutes({
    app,
  })

  return app;
}