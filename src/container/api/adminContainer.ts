import { AdminRoutes } from '@/api/routes/admin';
import { ResourcesRoutes } from '@/api/routes/resources';
import { AdminAccountController } from '@/controller/admin/adminAccount';
import { CardController } from '@/controller/admin/card';
import { CardPackController } from '@/controller/admin/cardPacks';
import { UserAccountController } from '@/controller/admin/userAccount';
import { AdminAccountService } from '@/services/adminAccount';
import { CardService } from '@/services/card';
import { CardPackService } from '@/services/cardPack';
import { UserAccountService } from '@/services/userAccount';
import { Elysia } from 'elysia'

export function AdminContainer(app: Elysia){
  // Services
  const services = {
    card: new CardService(),
    cardPack: new CardPackService(),
    adminAccount: new AdminAccountService(),
    userAccount: new UserAccountService(),
  };

  // Controllers
  const controller = {
    card: new CardController(services.card),
    cardPack: new CardPackController(services.cardPack, services.card),
    adminAccount: new AdminAccountController(services.adminAccount),
    userAccount: new UserAccountController(services.userAccount),
  }

  // Routes Insertion
  AdminRoutes({
    app,
    cardController: controller.card,
    cardPackController: controller.cardPack,
    adminAccountController: controller.adminAccount,
    userAccountController: controller.userAccount,
  });
  ResourcesRoutes({
    app,
  })

  return app;
}