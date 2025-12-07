import type { ModelCardRaw } from "@/types/model/cards";
import type { QueryProps } from "@/types/model/filter";
import { listTables, query } from "@/lib/querybuilder";

export class CardService {

  async get (env:Env, props?: {query?: QueryProps}): Promise<ModelCardRaw[]> {
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
      return await query('card')
        .select(fields, 'c')
        .applyQuery(props?.query, ['c.name', 'c.description'])
        .orderBy('c.created_at', 'desc')
        .get<ModelCardRaw>(env.DB);
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }

  async getById (env:Env, id: string): Promise<ModelCardRaw | null> {
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
      return await query('card')
        .select(fields)
        .where('id', '=', id)
        .first<ModelCardRaw>(env.DB);
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      return null;
    }
  }

  async create(env:Env, data: Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at'>): Promise<ModelCardRaw | null> {
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
          description: data.description,
          card_art: data.card_art,
          created_at: now,
          updated_at: now,
        })
        .run(env.DB);

      return await this.getById(env, id);
    } catch (error) {
      console.error('Error creating card:', error);
      return null;
    }
  }

  async update(env:Env, id: string, data: Partial<Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at'>>): Promise<ModelCardRaw | null> {
    try {
      const result = await query('card')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', id)
        .run(env.DB);

      if (result.meta.changes === 0) {
        return null;
      }

      return await this.getById(env, id);
    } catch (error) {
      console.error('Error updating card:', error);
      return null;
    }
  }

  async delete(env:Env, id: string): Promise<boolean> {
    try {
      const result = await query('card')
        .delete()
        .where('id', '=', id)
        .run(env.DB);

      return result.meta.changes > 0;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  }
}