export type ModelCoinLog = {
  id: string;
  user_account_id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export type ModelCoinLogCreate = Omit<ModelCoinLog, 'id' | 'created_at'>;
export type ModelCoinLogUpdate = Partial<ModelCoinLogCreate>;