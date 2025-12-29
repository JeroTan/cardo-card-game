import type { AdminAccountController } from '@/controller/adminAccount';
import type { CardController } from '@/controller/card';
import type { CardPackController } from '@/controller/cardPacks';
import type { UserAccountController } from '@/controller/userAccount';
import { typedAstroCookies, typedEnv, typedUrlData } from '@/lib/elysia';
import { tboxCreateAdminAccount } from '@/types/api/admin';
import { tboxLoginWithPassword, tboxResetPasswordWithToken } from '@/types/api/auth';
import { tboxCardCreate, tboxCardPackAddCards, tboxCardPackCreate, tboxCardPackUpdate, tboxCardPackUpdateCards, tboxCardUpdate } from '@/types/api/card';
import { tboxQueryParams, tboxPaginationParams } from '@/types/api/query';
import { tboxCreateUserAccount, tboxUpdateUserAccount } from '@/types/api/user';
import { convertQueriesToPageAndQueryProps, getQueryTransformer } from '@/utils/api/query';
import { Elysia, t } from 'elysia'

export function AdminRoutes({
  app,
  cardController,
  cardPackController,
  adminAccountController,
  userAccountController,
}:{
  app: Elysia
  cardController: CardController,
  cardPackController: CardPackController, 
  adminAccountController: AdminAccountController,
  userAccountController: UserAccountController,
}){
  app
  .use(typedEnv)
  .use(typedUrlData)
  .use(typedAstroCookies)
  .group('/admin', (app) => {
    app
    //====================================================================================//
    .get("/cards", ({env, query, urlData})=>{
      const { queryProps, pageProps } = convertQueriesToPageAndQueryProps(query);
      return cardController.getAllCards({env, origin: urlData.origin, queryProps, pageProps});
    }, {
      query: t.Composite([tboxQueryParams, tboxPaginationParams]),
      detail: {
        summary: 'Get all cards',
        tags: ['Admin Cards Management']
      },
      transform({query}){
        getQueryTransformer(query);
      }
    })
    //====================================================================================//
    .get("/cards/:id", ({params, env, urlData})=>{
      return cardController.getCardById({env, id: params.id, origin: urlData.origin});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Get card by ID',
        tags: ['Admin Cards Management']
      },
    })
    //====================================================================================//
    .post("/cards", ({body, env})=>{
      return cardController.createCard( {cardData:body, env});
    }, {
      type: "multipart/form-data",
      body: tboxCardCreate,
      detail: {
        summary: 'Create a new card',
        tags: ['Admin Cards Management']
      },
      transform({body}){
        if(body?.atk && typeof body.atk === 'string'){
          body.atk = Number(body.atk);
        }
        if(body?.def && typeof body.def === 'string'){
          body.def = Number(body.def);
        }
      }
    })
    .patch("/cards/:id", ({params, body, env})=>{
      return cardController.updateCard({env, id: params.id, cardData: body});
    }, {
      type: "multipart/form-data",
      body: tboxCardUpdate,
      transform({body}){
        if(body?.atk && typeof body.atk === 'string'){
          body.atk = Number(body.atk);
        }
        if(body?.def && typeof body.def === 'string'){
          body.def = Number(body.def);
        }
      }
    })
    //====================================================================================//
    .delete("/cards/:id", ({params, env})=>{
      return cardController.deleteCard({env, id: params.id});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Delete a card by ID',
        tags: ['Admin Cards Management']
      },
    })
    //====================================================================================//
    .get("/pack", ({env, query})=>{
      const { queryProps, pageProps } = convertQueriesToPageAndQueryProps(query);
      return cardPackController.getCardPackList({env, queryProps, pageProps});
    }, {
      query: t.Composite([tboxQueryParams, tboxPaginationParams]),
      detail: {
        summary: 'Get all card packs',
        tags: ['Admin Card Packs Management']
      },
      transform({query}){
        getQueryTransformer(query);
      }
    })
    //====================================================================================//
    .get("/pack/:id", ({params, env})=>{
      return cardPackController.getCardPackById({env, id: params.id});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Get card pack by ID',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================//
    .post("/pack", ({body, env})=>{
      const { pack:cardPackData, cards } = body;
      return cardPackController.createCardPack({env, cardPackData, cards});
    }, {
      body: tboxCardPackCreate,
      detail: {
        summary: 'Create a new card pack',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================//
    .post("/pack/:id/cards", ({params, body, env})=>{
      return cardPackController.addCardsToPack({env, cardPackId: params.id, cards: body});
    }, {
      params: t.Object({
        id: t.String()
      }),
      body: tboxCardPackAddCards,
      detail: {
        summary: 'Add cards to a card pack',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================//
    .patch("/pack/:id", ({params, body, env})=>{
      return cardPackController.updateCardPack({env, id: params.id, cardPackData: body});
    },{
      params: t.Object({
        id: t.String()
      }),
      body: tboxCardPackUpdate,
      detail: {
        summary: 'Update a card pack by ID',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================//
    .patch("/pack/:id/cards", ({params, body, env})=>{
      return cardPackController.updateCardsOfPack({env, cardPackId: params.id, cards: body});
    },{
      params: t.Object({
        id: t.String()
      }),
      body: tboxCardPackUpdateCards,
      detail: {
        summary: 'Update cards of a card pack',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================//
    .delete("/pack/:id", ({params, env})=>{
      return cardPackController.deleteCardPack({env, id: params.id});
    },{
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Delete a card pack by ID',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================//  
    .delete("/pack/:id/cards", ({params, query, env})=>{
      const cardIds = Array.isArray(query.card_id) ? query.card_id : [query.card_id];
      return cardPackController.deleteCardsFromPack({env, cardPackId: params.id, cardIds});
    },{
      params: t.Object({
        id: t.String()
      }),
      query: t.Object({
        card_id: t.Union([t.String(), t.Array(t.String())])
      }),
      detail: {
        summary: 'Delete cards from a card pack',
        tags: ['Admin Card Packs Management']
      },
    })
    //====================================================================================// 
    .get("/admin-account", ({env, query})=>{
      const { queryProps, pageProps } = convertQueriesToPageAndQueryProps(query);
      return adminAccountController.getAccountList({env, queryProps, pageProps});
    }, {
      query: t.Composite([tboxQueryParams, tboxPaginationParams]),
      detail: {
        summary: 'Get all admin accounts',
        tags: ['Admin Accounts Management']
      },
      transform({query}){
        getQueryTransformer(query);
      }
    })
    //====================================================================================//
    .get("/admin-account/:id", ({params, env})=>{
      return adminAccountController.getAccountById({env, id: params.id});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Get admin account by ID',
        tags: ['Admin Accounts Management']
      },
    })
    //====================================================================================//
    .post("/admin-account", ({body, env})=>{
      return adminAccountController.createAdminAccount({env, ...body});
    }, {
      body: tboxCreateAdminAccount,
      detail: {
        summary: 'Create a new admin account',
        tags: ['Admin Accounts Management']
      },
    })
    //====================================================================================//
    .delete("/admin-account/:id", ({params, env})=>{
      return adminAccountController.deleteAccount({env, id: params.id});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Delete admin account by ID',
        tags: ['Admin Accounts Management']
      },
    })
    .group('/auth', (app) => {
      app
      //====================================================================================//
      .post("/login-with-password", ({body, env, astroCookies})=>{
        return adminAccountController.loginWithPassword({env, ...body, astroCookies});
      }, {
        body: tboxLoginWithPassword,
        detail: {
          summary: 'Login with password',
          tags: ['Admin Authentication']
        },
      })
      //====================================================================================//
      .post("/request-reset-password", ({body, env})=>{
        return adminAccountController.requestPasswordResetToken({env, ...body});
      }, {
        body: t.Object({
          email: t.String(),
          urlLinkToSend: t.String(),
        }),
        detail: {
          summary: 'Request admin password reset',
          tags: ['Admin Authentication']
        },
      })
      //====================================================================================//
      .post("/reset-password-with-token", async ({body, env})=>{
        return adminAccountController.resetPasswordWithToken({env, token: body.token, newPassword: body.newPassword});
      },{
        body: tboxResetPasswordWithToken,
        detail: {
          summary: 'Reset admin account password with token',
          tags: ['Admin Authentication']
        },
      });
      return app;
    })
    //====================================================================================//
    .get("/user-account", ({env, query})=>{
      const { queryProps, pageProps } = convertQueriesToPageAndQueryProps(query);
      return userAccountController.getAllUserAccounts({env, queryProps, pageProps});
    }, {
      query: t.Composite([tboxQueryParams, tboxPaginationParams]),
      detail: {
        summary: 'Get all user accounts',
        tags: ['Admin User Accounts Management']
      },
      transform({query}){
        getQueryTransformer(query);
      }
    })
    //====================================================================================//
    .get("/user-account/:id", ({params, env})=>{
      return userAccountController.getUserAccountById({env, id: params.id});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Get user account by ID',
        tags: ['Admin User Accounts Management']
      },
    })
    //====================================================================================//
    .post("/user-account", ({body, env})=>{
      return userAccountController.createUserAccount({env, userData: body});
    }, {
      body: tboxCreateUserAccount,
      detail: {
        summary: 'Create a new user account',
        tags: ['Admin User Accounts Management']
      },
    })
    //====================================================================================//
    .patch("/user-account/:id", ({params, env, body})=>{
      return userAccountController.updateUserAccount({env, id: params.id, userData: body});
    }, {
      params: t.Object({
        id: t.String()
      }),
      body: tboxUpdateUserAccount,
      detail: {
        summary: 'Update user account by ID',
        tags: ['Admin User Accounts Management']
      },
    })
    //====================================================================================//
    .delete("/user-account/:id", ({params, env})=>{
      return userAccountController.deleteUserAccount({env, id: params.id});
    }, {
      params: t.Object({
        id: t.String()
      }),
      detail: {
        summary: 'Delete user account by ID',
        tags: ['Admin User Accounts Management']
      },
    })
    ;

    return app;
  });

  return app;
}