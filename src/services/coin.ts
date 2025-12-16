import { D1Error, query } from "@/lib/querybuilder";
import type { ModelCoinLog, ModelCoinLogCreate } from "@/types/model/coin";
import type { ServiceResult } from "./types";

export class CoinService {
  async getTotalCoins({userId, env}:{userId: string, env:Env }): Promise<number> {
    const fields = [
      'id',
      'user_account_id',
      'delta',
      'reason',
      'created_at'
    ];
    const resultData = await query('coin').select(fields).where('user_account_id', '=', userId).get<ModelCoinLog>(env.DB);
    if(!resultData || resultData.length === 0){
      return 0;
    }
    return resultData.reduce((acc, log) => acc + log.delta, 0);
  }

  async createRecord({env, record}: {env: Env, record: ModelCoinLogCreate}): Promise<ServiceResult<ModelCoinLog>> {
    try{
      const toInsert = {
        ...record,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      await query('coin').insert(toInsert).run(env.DB);
      return {data: toInsert, error: null};
    }catch(error){
      console.error('Error creating coin log record:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to create coin log record';
      return {data: null, error: errorMessage};
    }
  }
}