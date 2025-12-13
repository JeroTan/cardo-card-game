export type ModelUserAccount = {
  id: string,
  name: string,
  username: string,
  email: string,
  password_hash: string,
  created_at: string,
  updated_at: string,
  google_id: string|null,
}

export type ModelUserAccountClean = Omit<ModelUserAccount, 'password_hash'>;

export type ModelUserAccountCreate = Omit<ModelUserAccount, 'id' | 'created_at' | 'updated_at'>;
export type ModelUserAccountUpdate = Partial<ModelUserAccountCreate>;