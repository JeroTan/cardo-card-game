import type { ModelCardCreate, ModelCardRaw, ModelCardUpdate, ModelCardWithPackItBelongsTo } from "@/types/model/cards";
import type { PageProps, QueryProps } from "@/types/model/filter";
import { query, D1Error } from "@/lib/querybuilder";
import type { PageResult } from "@/types/api/result";
import type { ServiceResult } from "./types";



export class CardService {

  async get ({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelCardRaw[]>>> {
    const fields = [
      'id',
      'name',
      'atk',
      'def',
      'card_art',
      'created_at',
      'updated_at'
    ];
    try {
      // Get total count (without pagination)
      const totalItems = await query('card')
        .selectCount()
        .applyQuery(queryProps, ['id', 'name', 'atk', 'def'])
        .count(env.DB);
      
      // Get paginated items
      const items = await query('card')
        .select(fields)
        .applyQuery(queryProps, ['id', 'name', 'atk', 'def'])
        .applyPage(pageProps)
        .get<ModelCardRaw>(env.DB);
      
      const limit = pageProps?.limit || 10;
      const totalPages = Math.ceil(totalItems / limit);
      
      return { data:{
        data: items,
        totalItems,
        totalPages,
        page: pageProps?.page || 1,
        limit,
      }, error: undefined };
    } catch (error) {
      console.error('Error fetching cards:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch cards';
      return { data: undefined, error: errorMessage };
    }
  }

  async getCardsWithPacks({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelCardWithPackItBelongsTo[]>>> {
    const fields = [
      'card.id',
      'card.name',
      'card.atk',
      'card.def',
      'card.card_art',
      'card.created_at',
      'card.updated_at'
    ];
    
    try {
      // Get total count (without pagination)
      const totalItems = await query('card')
        .selectCount()
        .applyQuery(queryProps, ['id', 'name', 'atk', 'def'])
        .count(env.DB);
      
      // Get paginated cards
      const cards = await query('card')
        .select(fields)
        .applyQuery(queryProps, ['id', 'name', 'atk', 'def'])
        .applyPage(pageProps)
        .get<ModelCardRaw>(env.DB);
      
      // Get all card_pack relationships for these cards
      const cardIds = cards.map(card => card.id);
      
      let packsData: Array<{card_id: string, pack_id: string, pack_name: string}> = [];
      if (cardIds.length > 0) {
        packsData = await query('card_pack_cards')
          .select([
            'DISTINCT card_pack_cards.card_id',
            'card_pack.id as pack_id',
            'card_pack.name as pack_name'
          ])
          .join('card_pack', 'card_pack_cards.card_pack_id = card_pack.id')
          .applyQuery({filter: [{field: 'card_id', type: 'in', values: cardIds}]}, ['card_id'])
          .get<{card_id: string, pack_id: string, pack_name: string}>(env.DB);
      }
      
      // Group packs by card_id with unique pack names
      const packsByCardId = new Map<string, Array<{id: string, name: string}>>();
      for (const pack of packsData) {
        if (!packsByCardId.has(pack.card_id)) {
          packsByCardId.set(pack.card_id, []);
        }
        packsByCardId.get(pack.card_id)!.push({
          id: pack.pack_id,
          name: pack.pack_name
        });
      }
      
      // Combine cards with their packs
      const items: ModelCardWithPackItBelongsTo[] = cards.map(card => ({
        ...card,
        packs: packsByCardId.get(card.id) || []
      }));
      
      const limit = pageProps?.limit || 10;
      const totalPages = Math.ceil(totalItems / limit);
      
      return { 
        data: {
          data: items,
          totalItems,
          totalPages,
          page: pageProps?.page || 1,
          limit,
        }, 
        error: undefined 
      };
    } catch (error) {
      console.error('Error fetching cards with packs:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch cards with packs';
      return { data: undefined, error: errorMessage };
    }
  }

  async getById (env:Env, id: string): Promise<ServiceResult<ModelCardRaw | null>> {
    const fields = [
      'id',
      'name',
      'atk',
      'def',
      'card_art',
      'created_at',
      'updated_at'
    ];

    try {
      const data = await query('card')
        .select(fields)
        .where('id', '=', id)
        .first<ModelCardRaw>(env.DB);
      return { data, error: undefined };
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch card';
      return { data: undefined, error: errorMessage };
    }
  }

  async getCardWithPacksById (env:Env, id: string): Promise<ServiceResult<ModelCardWithPackItBelongsTo | null>> {
    const fields = [
      'id',
      'name',
      'atk',
      'def',
      'card_art',
      'created_at',
      'updated_at'
    ];

    try {
      // Get the card
      const card = await query('card')
        .select(fields)
        .where('id', '=', id)
        .first<ModelCardRaw>(env.DB);

      if (!card) {
        return { data: null, error: undefined };
      }

      // Get packs for this card with unique pack names
      const packsData = await query('card_pack_cards')
        .select([
          'DISTINCT card_pack.id as pack_id',
          'card_pack.name as pack_name'
        ])
        .join('card_pack', 'card_pack_cards.card_pack_id = card_pack.id')
        .where('card_pack_cards.card_id', '=', id)
        .get<{pack_id: string, pack_name: string}>(env.DB);

      // Combine card with its packs
      const cardWithPacks: ModelCardWithPackItBelongsTo = {
        ...card,
        packs: packsData.map(pack => ({
          id: pack.pack_id,
          name: pack.pack_name
        }))
      };

      return { data: cardWithPacks, error: undefined };
    } catch (error) {
      console.error('Error fetching card by ID with packs:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch card with packs';
      return { data: undefined, error: errorMessage };
    }
  }

  async create(env:Env, data: ModelCardCreate): Promise<ServiceResult<ModelCardRaw | null>> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    try {
      await query('card')
        .insert({
          id,
          name: data.name,
          atk: data.atk,
          def: data.def,
          card_art: data.card_art,
          created_at: now,
          updated_at: now,
        })
        .run(env.DB);

      return await this.getById(env, id);
    } catch (error) {
      console.error('Error creating card:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to create card';
      return { data: undefined, error: errorMessage };
    }
  }

  async update(env:Env, id: string, data: ModelCardUpdate): Promise<ServiceResult<ModelCardRaw | null>> {
    try {
      const result = await query('card')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', id)
        .run(env.DB);

      if (result.meta.changes === 0) {
        return { data: null, error: undefined };
      }

      return await this.getById(env, id);
    } catch (error) {
      console.error('Error updating card:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to update card';
      return { data: undefined, error: errorMessage };
    }
  }

  async delete(env:Env, id: string): Promise<ServiceResult<{
    changes: number,
    dataDeleted: ModelCardRaw
  }>> {
    try {
      const existingCardResult = await this.getById(env, id);
      if (existingCardResult.error) {
        return { data: undefined, error: existingCardResult.error };
      }
      const result = await query('card')
        .delete()
        .where('id', '=', id)
        .run(env.DB);

      return { data: {
        changes: result.meta.changes,
        dataDeleted: existingCardResult.data as ModelCardRaw
      }, error: undefined };
    } catch (error) {
      console.error('Error deleting card:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to delete card';
      return { data: undefined, error: errorMessage };
    }
  }

  async checkCardExists({env, ids}: {env:Env, ids:string[]}): Promise<ServiceResult<boolean>> {
    try {
      //Check card(s) if it is existing in database
      const count = await query('card')
        .applyQuery({filter: [{field: 'id', type: 'in', values: ids}]}, ['id'])
        .selectCount()
        .count(env.DB);
      return { data: count === ids.length, error: undefined };
    } catch {
      return { data: null, error: 'Failed to check card existence' };  
    }
  }
}