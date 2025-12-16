import type { PageProps, QueryProps } from "@/types/model/filter";
import type { ServiceResult } from "./types";
import type { PageResult } from "@/types/api/result";
import type { ModelAccountPackPurchase } from "@/types/model/accountCardPack";
import { query } from "@/lib/querybuilder";


export class AccountCardPackService {

  async get({env, userAccountId, queryProps, pageProps}: {env: Env, userAccountId: string, queryProps?: QueryProps, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelAccountPackPurchase[]>>> {
    const fields = [
      'id',
      'user_account_id',
      'card_pack_id',
      'total_price',
      'created_at'
    ];
    try {
      // Get total count (without pagination)
      const totalItems = await query('account_pack_purchase')
        .selectCount()
        .where('user_account_id', "=", userAccountId)
        .applyQuery(queryProps, ['id', 'card_pack_id'])
        .count(env.DB);

      // Get paginated items
      const items = await query('account_pack_purchase')
        .select(fields)
        .where('user_account_id', "=", userAccountId)
        .applyQuery(queryProps, ['id', 'card_pack_id'])
        .applyPage(pageProps)
        .get<ModelAccountPackPurchase>(env.DB);
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
      console.error('Error fetching account card pack purchases:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch account card pack purchases';
      return { data: undefined, error: errorMessage };
    }
  }
}