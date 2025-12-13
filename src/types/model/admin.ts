export type ModelAdminAccount = {
  id: string,
  email: string,
  password_hash: string,
  created_at: string,
  updated_at: string,
}

export type ModelAdminAccountClean = Omit<ModelAdminAccount, 'password_hash'>;

export type ModelAdminAccountCreate = Omit<ModelAdminAccount, 'id' | 'created_at' | 'updated_at'>;
export type ModelAdminAccountUpdate = Partial<ModelAdminAccountCreate>;