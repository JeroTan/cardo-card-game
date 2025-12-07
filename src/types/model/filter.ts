export type FilterData = {
  field: string,
  values: Array<string>,
  type: "in"|"not_in",
}

export type SortData = {
  field: string,
  direction: "asc" | "desc",
}

export type QueryProps = {
  search: string|null,
  filter: Array<FilterData>,
  sort: Array<SortData>,
}

/**
 * Sample Query Params
 * ?search=dragon&filter[status]=active&-filter[type]=fire,ghost&sort=-level,name,-created_at
 */