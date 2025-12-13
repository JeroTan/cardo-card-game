import type { PageProps, QueryProps } from "@/types/model/filter";
import type { ServiceResult } from "./types";
import type { PageResult } from "@/types/api/result";
import type { ModelUserAccount, ModelUserAccountCreate, ModelUserAccountUpdate } from "@/types/model/user";
import { D1Error, query } from "@/lib/querybuilder";

export class UserAccountService {
  async get({env, queryProps, pageProps}: {env: Env, queryProps?: Partial<QueryProps>, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelUserAccount[]>>> {
    const fields = ['id', 'name', 'username', 'email', 'password_hash', 'created_at', 'updated_at', 'google_id'];
    try{
      // Get total count (without pagination)
      const totalItems = await query('user_account')
        .selectCount()
        .applyQuery(queryProps, ['id', 'name', 'username', 'email'])
        .count(env.DB);
      // Get paginated items
      const items = await query('user_account')
        .select(fields)
        .applyQuery(queryProps, ['id', 'name', 'username', 'email'])
        .applyPage(pageProps)
        .get<ModelUserAccount>(env.DB);
      const limit = pageProps?.limit || 10;
      const totalPages = Math.ceil(totalItems / limit);
      return { data:{
        data: items,
        totalItems,
        totalPages,
        page: pageProps?.page || 1,
        limit,
      }, error: undefined };  
    }catch(error){
      console.error('Error fetching user accounts:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch user accounts';
      return { data: undefined, error: errorMessage };
    }
  }

  async getById({env, id}: {env:Env, id: string}): Promise<ServiceResult<ModelUserAccount | null>> {
    const fields = ['id', 'name', 'username', 'email', 'password_hash', 'created_at', 'updated_at', 'google_id'];
    try {
      const data = await query('user_account')
        .select(fields)
        .where('id', '=', id)
        .first<ModelUserAccount>(env.DB);
      return { data, error: undefined };
    }
    catch(error){
      console.error('Error fetching user account by ID:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch user account';
      return { data: null, error: errorMessage };
    }
  }

  async getByEmail({env, email}: {env:Env, email: string}): Promise<ServiceResult<ModelUserAccount | null>> {
    const fields = ['id', 'name', 'username', 'email', 'password_hash', 'created_at', 'updated_at', 'google_id'];
    try {
      const data = await query('user_account')
        .select(fields)
        .where('email', '=', email)
        .first<ModelUserAccount>(env.DB);
      return { data, error: undefined };
    }
    catch(error){
      console.error('Error fetching user account by email:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch user account';
      return { data: null, error: errorMessage };
    }
  }

  async create({env, userData}: {env:Env, userData: ModelUserAccountCreate}): Promise<ServiceResult<ModelUserAccount>> {
    try {
      const toInsert = {
        ...userData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await query('user_account')
        .insert(toInsert)
        .run(env.DB);
      return { data: toInsert, error: undefined };
    } catch (error) {
      console.error('Error creating user account:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to create user account';
      return { data: null as any, error: errorMessage };
    }
  }

  async update({env, id, userData}: {env:Env, id: string, userData: Partial<ModelUserAccountUpdate>}): Promise<ServiceResult<ModelUserAccount | null>> {
    try{
      const {data:previousData, error} = await this.getById({env, id});
      if(error){
        return { data: null, error };
      }
      if(!previousData){
        return { data: null, error: 'User account not found' };
      }

      const toUpdateData = {
        ...userData,
        updated_at: new Date().toISOString(),
      };

      await query('user_account')
        .update(toUpdateData)
        .where('id', '=', id)
        .run(env.DB);

      return { data: { ...previousData, ...toUpdateData }, error: undefined };
    }catch(error){
      console.error('Error updating user account:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to update user account';
      return { data: null, error: errorMessage };
    }
  }

  async delete({env, id}: {env:Env, id: string}): Promise<ServiceResult<ModelUserAccount>> {
    try{
      const {data: userData, error} = await this.getById({env, id});
      if(error){
        return { data: null, error };
      }
      if(!userData){
        return { data: null, error: 'User account not found' };
      }
      await query('user_account')
        .delete()
        .where('id', '=', id)
        .run(env.DB);
      return { data: userData, error: undefined };
    }catch(error){
      console.error('Error deleting user account:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to delete user account';
      return { data: null, error: errorMessage };
    }
  }
}