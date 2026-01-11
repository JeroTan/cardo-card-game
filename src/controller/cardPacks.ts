import type { CardService } from "@/services/card";
import type { CardPackService } from "@/services/cardPack";
import type { ModelCardPackCardsCreate, ModelCardPackCardsUpdate, ModelCardPackCreate } from "@/types/model/cardPack";
import type { PageProps, QueryProps } from "@/types/model/filter";
import uniq from "lodash/uniq";

export class CardPackController {
  constructor(
    public cardPackService: CardPackService,
    public cardService: CardService,
  ){}

  public async getCardPackList({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}) {
    const { data: cardPacks, error } = await this.cardPackService.get({env, queryProps, pageProps});

    if(error || !cardPacks) {
      return Response.json({
        message: error || "No card packs found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: pageProps?.page || 1,
        limit: pageProps?.limit || 10,
      }, {status: 422});
    }

    return Response.json({
      message: "Card packs retrieved successfully",
      ...cardPacks,
    });
  }

  public async getCardPackById({env, id}: {env: Env, id: string}) {
    const { data: cardPackDetails, error } = await this.cardPackService.getById(env, id);  
    if(error || !cardPackDetails) {
      return Response.json({
        message: error || "Card pack not found",
        data: null,
      }, {status: 404});
    }

    // After getting the card pack details, get the cards in the pack
    const { data: cards, error: cardsError } = await this.cardPackService.getCardsOfPack({env, cardPackId: id});
    if(cardsError) {
      return Response.json({
        message: cardsError || "Failed to retrieve cards of the pack",
        data: {
          cardPackDetails,
          cards: [],
        },
      }, {status: 500});
    }

    return Response.json({
      message: "Card pack retrieved successfully",
      data: {
        cardPackDetails,
        cards,
      },
    });
  }

  public async createCardPack({env, cardPackData, cards = []}: {env: Env, cardPackData: ModelCardPackCreate, cards?: Omit<ModelCardPackCardsCreate, "card_pack_id">[]}) {
    const { data: newCardPack, error } = await this.cardPackService.create(env, cardPackData);
    if(error || !newCardPack) {
      return Response.json({
        message: error || "Failed to create card pack",
        data: null,
      }, {status: 422});
    }

    // If there are cards to add to the pack
    if(cards.length < 1) {
      return Response.json({
        message: "Card pack created successfully",
        data: {
          cardPack: newCardPack,
          addedCards: null,
        },
      });
    }

    // If there is we need to check first if it is available in the cards list
    const cardIds = uniq(cards.map(c => c.card_id));
    const {data:cardsExists, error: cardsExistsError} = await this.cardService.checkCardExists({env, ids: cardIds});
    if(cardsExistsError){
      return Response.json({
        message: cardsExistsError || "Failed to verify cards existence",
      }, {status: 500});
    }
    
    if(!cardsExists){
      return Response.json({
        message: "Some cards do not exist",
      }, {status: 422});
    }

    // Now we can add the cards to the pack
    const {data: addCardsResult, error: addCardsError} = await this.cardPackService.addCards({env, cards: cards.map(c => ({
      ...c, card_pack_id: newCardPack.id
    }))});
    if(addCardsError){
      return Response.json({
        message: addCardsError || "Failed to add cards to the pack",
      }, {status: 500});
    }

    return Response.json({
      message: "Card pack created successfully",
      data: {
        cardPack: newCardPack,
        addedCards: addCardsResult,
      },
    });
  }

  public async updateCardPack({env, id, cardPackData}: {env: Env, id: string, cardPackData: Partial<Omit<ModelCardPackCreate, 'id'>>}) {
    const { data: updatedCardPack, error } = await this.cardPackService.update(env, id, cardPackData);
    if(error) {
      return Response.json({
        message: error || "Failed to update card pack",
        data: null,
      }, {status: 500});
    }
    return Response.json({
      message: "Card pack updated successfully",
      data: updatedCardPack,
    });
  }

  public async addCardsToPack({env, cardPackId, cards}: {env: Env, cardPackId: string, cards: Omit<ModelCardPackCardsCreate, "card_pack_id">[]}) {
    const { data: result, error } = await this.cardPackService.addCards({env, cards: cards.map(c => ({
      ...c, card_pack_id: cardPackId
    }))});
    if(error) {
      return Response.json({
        message: error || "Failed to add cards to the pack",
      }, {status: 500});
    }
    return Response.json({
      message: "Cards added to the pack successfully",
      data: result,
    });
  }

  public async updateCardsOfPack({env, cardPackId, cards}: {env: Env, cardPackId: string, cards: ModelCardPackCardsUpdate[]}) {
    const { data: result, error } = await this.cardPackService.updateCardsOfPack({env, cardPackId, cards});
    if(error) {
      return Response.json({
        message: error || "Failed to update cards of the pack",
      }, {status: 500});
    }
    return Response.json({
      message: "Cards of the pack updated successfully",
      data: result,
    });
  }

  public async deleteCardsFromPack({env, cardPackId, cardIds}: {env: Env, cardPackId: string, cardIds: string[]}) {
    const { data: result, error } = await this.cardPackService.deleteCardsFromPack({env, cardIds});
    if(error) {
      return Response.json({
        message: error || "Failed to delete cards from the pack",
      }, {status: 500});
    }
    return Response.json({
      message: "Cards deleted from the pack successfully",
      data: result,
    });
  }

  public async deleteCardPack({env, id}: {env: Env, id: string}) {
    const { data: deleteResult, error } = await this.cardPackService.delete(env, id);
    if(error) {
      return Response.json({
        message: error || "Failed to delete card pack",
      }, {status: 500});
    }

    return Response.json({
      message: "Card pack deleted successfully",
      data: deleteResult,
    });
  }



}