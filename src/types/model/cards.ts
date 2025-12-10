export type ModelCardRaw = {
  id: string,
  name: string,
  rarity: number,
  atk: number,
  def: number,
  description: string,
  card_art: string,
  created_at: string,
  updated_at: string,
}

// Utility types for CRUD operations
export type ModelCardCreate = Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at' | 'description'> & Partial<Pick<ModelCardRaw, 'description'>>;
export type ModelCardUpdate = Partial<Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at'>>;
