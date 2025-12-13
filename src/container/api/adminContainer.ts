import { AdminRoutes } from '@/api/routes/admin';
import { ResourcesRoutes } from '@/api/routes/resources';
import { AdminAccountController } from '@/controller/admin/adminAccount';
import { CardController } from '@/controller/admin/card';
import { CardPackController } from '@/controller/admin/cardPacks';
import { AdminAccountService } from '@/services/adminAccount';
import { CardService } from '@/services/card';
import { CardPackService } from '@/services/cardPack';
import { Elysia } from 'elysia'

export function AdminContainer(app: Elysia){
  // Services
  const services = {
    card: new CardService(),
    cardPack: new CardPackService(),
    adminAccount: new AdminAccountService(),
  };

  // Controllers
  const controller = {
    card: new CardController(services.card),
    cardPack: new CardPackController(services.cardPack, services.card),
    adminAccount: new AdminAccountController(services.adminAccount),
  }


  // Routes Insertion
  AdminRoutes({
    app,
    cardController: controller.card,
    cardPackController: controller.cardPack,
    adminAccountController: controller.adminAccount,
  });
  ResourcesRoutes({
    app,
  })

  return app;
}