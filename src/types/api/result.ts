export type PageResult<T> = {
  data: T;
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type RefineValidationData = {
  field: string,
  error: string[],
} 

export type Error422Result = {
  message: string;
  data: Array<RefineValidationData>;
}

