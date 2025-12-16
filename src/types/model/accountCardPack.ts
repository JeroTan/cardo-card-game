export type ModelAccountPackPurchase = {
  id: string;
  user_account_id: string;
  card_pack_id: string;
  total_price: number;
  created_at: string;
}

export type ModelAccountPackPurchaseCreate = Omit<ModelAccountPackPurchase, 'id' | 'created_at'>;
export type ModelAccountPackPurchaseUpdate = Partial<ModelAccountPackPurchaseCreate>;