import { D1Error, query } from "@/lib/querybuilder";
import type { ModelCardPackCards, ModelCardPackCardsCreate, ModelCardPackCardsWitCardDetails, ModelCardPackCreate, ModelCardPackRaw } from "@/types/model/cardPack";
import type { PageProps, QueryProps } from "@/types/model/filter";
import type { ServiceResult } from "./types";
import type { PageResult } from "@/types/api/result";

export class CardPackService {
  async get({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelCardPackRaw[]>>> {
    const fields = ['id', 'status', 'name', 'pack_price', 'publish_start_date', 'publish_end_date', 'created_at', 'updated_at'];

    try{
      // Get total count (without pagination)
      const totalItems = await query('card_pack')
        .selectCount()
        .applyQuery(queryProps, ['id', 'name', 'status', 'pack_price', 'publish_start_date', 'publish_end_date'])
        .count(env.DB);

      // Get paginated items
      const items = await query('card_pack')
        .select(fields)
        .applyQuery(queryProps, ['id', 'name', 'status', 'pack_price', 'publish_start_date', 'publish_end_date'])
        .applyPage(pageProps)
        .get<ModelCardPackRaw>(env.DB);

      const limit = pageProps?.limit || 10;
      const totalPages = Math.ceil(totalItems / limit);
      return { data:{
        data: items,
        totalItems,
        totalPages,
        page: pageProps?.page || 1,
        limit,
      }, error: undefined };

    }catch(error){
      console.error('Error fetching cards:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch cards';
      return { data: undefined, error: errorMessage };
    }
  }

  async getById(env:Env, id: string): Promise<ServiceResult<ModelCardPackRaw | null>> {
    const fields = ['id', 'status', 'name', 'pack_price', 'publish_start_date', 'publish_end_date', 'created_at', 'updated_at'];
    try {
      const data = await query('card_pack')
        .select(fields)
        .where('id', '=', id)
        .first<ModelCardPackRaw>(env.DB);
      return { data, error: undefined };
    }
    catch(error){
      console.error('Error fetching card pack by ID:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch card pack';
      return { data: null, error: errorMessage };
    }
  }

  async getCardsOfPack({env, cardPackId}: {env: Env, cardPackId: string}): Promise<ServiceResult<ModelCardPackCardsWitCardDetails[]>> {
    try {
      const data = await query('card_pack_cards')
        .select([
          'card_pack_cards.id',
          'card_pack_cards.card_pack_id',
          'card_pack_cards.card_id',
          'card.name',
          'card.rarity',
          'card.atk',
          'card.def',
          'card.description',
          'card.card_art'
        ])
        .join('card', 'card_pack_cards.card_id = card.id')
        .where('card_pack_cards.card_pack_id', '=', cardPackId)
        .get<ModelCardPackCardsWitCardDetails>(env.DB);
      return { data, error: undefined };
    }
    catch(error){
      console.error('Error fetching cards of pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch cards of pack';
      return { data: undefined, error: errorMessage };
    }
  }

  async create(env:Env, cardPackData: ModelCardPackCreate): Promise<ServiceResult<ModelCardPackRaw>> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const toInsert = {
      id,
      ...cardPackData,
      created_at: now,
      updated_at: now,
    };
    try {
      await query('card_pack')
        .insert(toInsert)
        .run(env.DB);
      return { data: toInsert, error: undefined };
    }
    catch(error){
      console.error('Error creating card pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to create card pack';
      return { data: null, error: errorMessage };
    }
  }

  async addCards({env, cards}: {env:Env, cards: ModelCardPackCardsCreate[]}): Promise<ServiceResult<ModelCardPackCardsCreate[]>> {
    try {
      const insertedCards: ModelCardPackCards[] = [];
      for(const card of cards) {
        const toInsert = {
          id: crypto.randomUUID(),
          ...card,
        };
        insertedCards.push(toInsert);
        await query('card_pack_cards')
          .insert(toInsert)
          .run(env.DB);
      }
      return { data: insertedCards , error: undefined };
    }
    catch(error){
      console.error('Error adding cards to pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to add cards to pack';
      return { data: null, error: errorMessage };
    }
  }

  async updateCardsOfPack({env, cardPackId, cards}: {env:Env, cardPackId: string, cards: Partial<ModelCardPackCards>[] }): Promise<ServiceResult<ModelCardPackCards[]>> {
    try{
      const existingCards = await this.getCardsOfPack({env, cardPackId});
      for(const card of cards){
        if(!card.id) continue;
        const exists = existingCards.data?.find(c => c.id === card.id);
        if(!exists) continue;
        await query('card_pack_cards')
          .where('id', '=', card.id)
          .update({
            ...card,
            // updated_at: new Date().toISOString(), // Assuming there's an updated_at field
          })
          .run(env.DB);
        Object.assign(exists, card);
      }
      return { data: existingCards.data || [], error: undefined };
    }catch(error){
      console.error('Error updating cards of pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to update cards of pack';
      return { data: null, error: errorMessage };
    }
  }

  async deleteCardsFromPack({env, cardIds}: {env:Env, cardIds: string[]}): Promise<ServiceResult<ModelCardPackCards[]>> {
    try {
      const dataToBeDeleted = await query('card_pack_cards')
        .applyQuery({ filter: [{ field: 'id', type: 'in', values: cardIds }]})
        .get<ModelCardPackCards>(env.DB);
        
      await query('card_pack_cards')
        .applyQuery({ filter: [{ field: 'id', type: 'in', values: cardIds }]})
        .delete()
        .run(env.DB);
      return { data: dataToBeDeleted, error: undefined };
    }catch(error){
      console.error('Error deleting cards from pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to delete cards from pack';
      return { data: null, error: errorMessage };
    }
  }

  async update(env:Env, id:string, cardPackData: Partial<Omit<ModelCardPackRaw, 'id' | 'created_at'>>): Promise<ServiceResult<ModelCardPackRaw | null>> {
    const toUpdate = {
      ...cardPackData,
      updated_at: new Date().toISOString(),
    };
    try {
      await query('card_pack')
        .where('id', '=', id)
        .update(toUpdate)
        .run(env.DB);
      return this.getById(env, id);
    }
    catch(error){
      console.error('Error updating card pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to update card pack';
      return { data: null, error: errorMessage };
    }
  }

  async delete(env:Env, id:string): Promise<ServiceResult<ModelCardPackRaw | null>> {
    try {
      const cardPack = await this.getById(env, id);
      if(cardPack.error || !cardPack.data) {
        return { data: null, error: 'Card pack not found' };
      }
      await query('card_pack')
        .where('id', '=', id)
        .delete()
        .run(env.DB);
      return { data: cardPack.data, error: undefined };
    }
    catch(error){
      console.error('Error deleting card pack:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to delete card pack';
      return { data: null, error: errorMessage };
    }
  }
}

