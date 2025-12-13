import type { ModelCardRaw } from "./cards";

export const cardPackStatus = ["PUBLISHED", "HIDDEN"] as const;
export type CardPackStatus = (typeof cardPackStatus)[number];

export type ModelCardPackRaw = {
  id: string,
  status: CardPackStatus,
  name: string,
  pack_price: number,
  publish_start_date: string,
  publish_end_date: string,
  created_at: string,
  updated_at: string,
}

export type ModelCardPackCreate = Omit<ModelCardPackRaw, 'id' | 'created_at' | 'updated_at'>;
export type ModelCardPackUpdate = Partial<Omit<ModelCardPackRaw, 'id' | 'created_at' | 'updated_at'>>;

export type ModelCardPackCards = {
  id: string,
  card_pack_id: string,
  card_id: string,
}

export type ModelCardPackCardsCreate = Omit<ModelCardPackCards, 'id'>;
export type ModelCardPackCardsUpdate = Partial<Omit<ModelCardPackCards, 'id'>>;

export type ModelCardPackCardsWitCardDetails = ModelCardPackCards & Omit<ModelCardRaw, 'id' | 'created_at' | 'updated_at'>;