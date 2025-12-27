export type ModelCardRaw = {
  id: string,
  name: string,
  atk: number,
  def: number,
  card_art: string,
  created_at: string,
  updated_at: string,
}

// Utility types for CRUD operations
export type ModelCardCreate = Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at'>;
export type ModelCardUpdate = Partial<ModelCardCreate>;


export type ModelCardWithPackItBelongsTo = ModelCardRaw & {
  packs: Array<{
    id: string,
    name: string,
  }>
}