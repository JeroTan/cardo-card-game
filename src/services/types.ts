export type ServiceResult<T> = 
  | { data: T; error: undefined|null }
  | { data: undefined|null; error: string };