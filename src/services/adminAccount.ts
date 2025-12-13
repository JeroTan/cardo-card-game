import type { PageProps, QueryProps } from "@/types/model/filter";
import type { ServiceResult } from "./types";
import type { ModelAdminAccount, ModelAdminAccountClean } from "@/types/model/admin";
import type { PageResult } from "@/types/api/result";
import { D1Error, query } from "@/lib/querybuilder";


export class AdminAccountService {
  async get({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}): Promise<ServiceResult<PageResult<ModelAdminAccountClean[]>>> {
    const fields = ['id', 'email', 'password_hash', 'created_at', 'updated_at'];
    try{
      // Get total count (without pagination)
      const totalItems = await query('admin_account')
        .selectCount()
        .applyQuery(queryProps, ['id', 'email'])
        .count(env.DB);
      // Get paginated items
      const items = await query('admin_account')
        .select(fields)
        .applyQuery(queryProps, ['id', 'email'])
        .applyPage(pageProps)
        .get<ModelAdminAccount>(env.DB);
      const limit = pageProps?.limit || 10;
      const totalPages = Math.ceil(totalItems / limit);
      // Remove password_hash before returning
      const cleanedItems: ModelAdminAccountClean[] = items.map(({password_hash, ...rest}) => rest);
      return { data:{
        data: cleanedItems,
        totalItems,
        totalPages,
        page: pageProps?.page || 1,
        limit,
      }, error: undefined };  
    }catch(error){
      console.error('Error fetching admin accounts:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch admin accounts';
      return { data: undefined, error: errorMessage };
    }
  }

  async getById({env, id}: {env:Env, id: string}): Promise<ServiceResult<ModelAdminAccount | null>> {
    const fields = ['id', 'email', 'password_hash', 'created_at', 'updated_at'];
    try {
      const data = await query('admin_account')
        .select(fields)
        .where('id', '=', id)
        .first<ModelAdminAccount>(env.DB);
      if(!data) {
        return { data: null, error: undefined };
      }
      // Remove password_hash before returning
      return { data, error: undefined };
    }
    catch(error){
      console.error('Error fetching admin account by ID:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch admin account';
      return { data: null, error: errorMessage };
    }
  }

  async getByEmail({env, email}: {env:Env, email: string}): Promise<ServiceResult<ModelAdminAccount | null>> {
    const fields = ['id', 'email', 'password_hash', 'created_at', 'updated_at'];  
    try {
      const data = await query('admin_account')
        .select(fields)
        .where('email', '=', email)
        .first<ModelAdminAccount>(env.DB);
      return { data, error: undefined };
    }
    catch(error){
      console.error('Error fetching admin account by email:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to fetch admin account';
      return { data: null, error: errorMessage };
    }
  }

  async create({env, adminData}: {env:Env, adminData: Omit<ModelAdminAccount, 'id' | 'created_at' | 'updated_at'>}): Promise<ServiceResult<ModelAdminAccount>> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const toInsert = {
          id,
          email: adminData.email,
          password_hash: adminData.password_hash,
          created_at: now,
          updated_at: now,
        }
      await query('admin_account')
        .insert(toInsert)
        .run(env.DB);

      return { data: toInsert, error: undefined };
    } catch (error) {
      console.error('Error creating admin account:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to create admin account';
      return { data: null, error: errorMessage };
    }
  }

  async update({env, id, adminData}: {env:Env, id: string, adminData: Partial<Omit<ModelAdminAccount, 'id' | 'created_at' | 'updated_at'>>}): Promise<ServiceResult<ModelAdminAccount | null>> {
    try {
      const dataBeforeUpdate = await this.getById({env, id});
      if(dataBeforeUpdate.error){
        return { data: null, error: dataBeforeUpdate.error };
      }
      if(!dataBeforeUpdate.data){
        return { data: null, error: "Admin account not found" };
      }

      const toUpdateData = {
        ...adminData,
        updated_at: new Date().toISOString(),
      }

      const result = await query('admin_account')
        .update(toUpdateData)
        .where('id', '=', id)
        .run(env.DB); 
      if(result.error) {
        return { data: null, error: result.error };
      }
      return {data: {...dataBeforeUpdate.data, ...toUpdateData} as ModelAdminAccount, error: undefined};
    } catch (error) {
      console.error('Error updating admin account:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to update admin account';
      return { data: null, error: errorMessage };
    }
  }

  async delete({env, id}: {env:Env, id: string}): Promise<ServiceResult<ModelAdminAccount|null>> {
    try {
      const dataToDeleteResult = await this.getById({env, id});
      if(dataToDeleteResult.error){
        return { data: null, error: dataToDeleteResult.error };
      }
      if(!dataToDeleteResult.data){
        return { data: null, error: undefined };
      }
      const result = await query('admin_account')
        .delete()
        .where('id', '=', id)
        .run(env.DB);
      if(result.error) {
        return { data: null, error: result.error };
      }
      return { data: dataToDeleteResult.data as ModelAdminAccount, error: undefined };
    } catch (error) {
      console.error('Error deleting admin account:', error);
      const errorMessage = error instanceof D1Error ? error.message : 'Failed to delete admin account';
      return { data: null, error: errorMessage };
    }
  }
}