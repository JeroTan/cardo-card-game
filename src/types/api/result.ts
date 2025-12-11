export type PageResult<T> = {
  data: T;
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
};