import type { CardController } from '@/controller/admin/card';
import type { CardPackController } from '@/controller/admin/cardPacks';
import { typedEnv, typedUrlData } from '@/lib/elysia';
import { tboxCardCreate, tboxCardPackAddCards, tboxCardPackCreate, tboxCardPackUpdate, tboxCardPackUpdateCards } from '@/types/api/card';
import { tboxQueryParams, tboxPaginationParams } from '@/types/api/query';
import { convertQueriesToPageAndQueryProps, getQueryTransformer } from '@/utils/api/query';
import { Elysia, t } from 'elysia'

export function AdminRoutes({
  app,
  cardController,
  cardPackController,
}:{
  app: Elysia
  cardController: CardController,
  cardPackController: CardPackController, 
}){
  app
  .use(typedEnv)
  .use(typedUrlData)
  .onError((err) => {
    console.error("Admin Route Error:", err);
  })
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
    .post("/cards", ({body, env})=>{
      return cardController.createCard( {cardData:body, env});
    }, {
      type: "multipart/form-data",
      body: tboxCardCreate(),
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
        if(body?.rarity && typeof body.rarity === 'string'){
          body.rarity = Number(body.rarity);
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
      body: tboxCardPackCreate(),
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
      body: tboxCardPackAddCards(),
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
      body: tboxCardPackUpdate(),
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
      body: tboxCardPackUpdateCards(),
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
    ;

    return app;
  });

  return app;
}