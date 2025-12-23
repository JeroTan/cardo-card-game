import { AdminRoutes } from '@/api/routes/admin';
import { PlayerRoutes } from '@/api/routes/player';
import { ResourcesRoutes } from '@/api/routes/resources';
import { AdminAccountController } from '@/controller/admin/adminAccount';
import { CardController } from '@/controller/admin/card';
import { CardPackController } from '@/controller/admin/cardPacks';
import { UserAccountController } from '@/controller/admin/userAccount';
import { handleContentTypeMismatch, handleFieldValidation } from '@/lib/api/general';
import { AdminAccountService } from '@/services/adminAccount';
import { CardService } from '@/services/card';
import { CardPackService } from '@/services/cardPack';
import { UserAccountService } from '@/services/userAccount';
import { Elysia } from 'elysia'

export function ApiContainer(app: Elysia){
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

  //Validation Handler to return error of typebox with style
  app.onError(({code, error})=>{
    if(code === 'VALIDATION'){
      return handleFieldValidation(error);
    }
    if(code == undefined && error != null && typeof error === 'object'){
      return handleContentTypeMismatch(error);
    }
  });

  // Routes Insertion
  AdminRoutes({
    app,
    cardController: controller.card,
    cardPackController: controller.cardPack,
    adminAccountController: controller.adminAccount,
    userAccountController: controller.userAccount,
  });
  PlayerRoutes({
    app,
    userController: controller.userAccount,
  });
  ResourcesRoutes({
    app,
  });

  return app;
}