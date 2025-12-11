import type { ModelCardRaw } from "@/types/model/cards";
import type { PageProps, QueryProps } from "@/types/model/filter";
import { query, D1Error } from "@/lib/querybuilder";
import type { PageResult } from "@/types/api/result";

type ServiceResult<T> = 
  | { data: T; error: undefined }
  | { data: undefined; error: string };

export class CardService {

  async get ({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelCardRaw[]>>> {
    const fields = [
      'c.id',
      'c.name',
      'c.rarity',
      'c.atk',
      'c.def',
      'c.description',
      'c.card_art',
      'c.created_at',
      'c.updated_at'
    ];
    try {
      // Get total count (without pagination)
      const totalItems = await query('card')
        .alias('c')
        .selectCount()
        .applyQuery(queryProps, ['c.name', 'c.description'])
        .count(env.DB);
      
      // Get paginated items
      const items = await query('card')
        .alias('c')
        .select(fields)
        .applyQuery(queryProps, ['c.name', 'c.description'])
        .applyPage(pageProps)
        .orderBy('c.created_at', 'desc')
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

  async getById (env:Env, id: string): Promise<ServiceResult<ModelCardRaw | null>> {
    const fields = [
      'id',
      'name',
      'rarity',
      'atk',
      'def',
      'description',
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

  async create(env:Env, data: Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at' | "description"> & Partial<Pick<ModelCardRaw, "description">>): Promise<ServiceResult<ModelCardRaw | null>> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    try {
      await query('card')
        .insert({
          id,
          name: data.name,
          rarity: data.rarity,
          atk: data.atk,
          def: data.def,
          description: data.description || "",
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

  async update(env:Env, id: string, data: Partial<Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at'>>): Promise<ServiceResult<ModelCardRaw | null>> {
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

  async delete(env:Env, id: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await query('card')
        .delete()
        .where('id', '=', id)
        .run(env.DB);

      return { data: result.meta.changes > 0, error: undefined };
    } catch (error) {
      console.error('Error deleting card:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to delete card';
      return { data: undefined, error: errorMessage };
    }
  }
}