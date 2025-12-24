import { t, type Static } from "elysia";


export const tboxQueryParams = t.Object({
  search: t.Optional(t.String({
    description: 'Search text to match in card name or description'
  })),
  sort: t.Optional(t.String({
    description: 'Comma-separated list of fields to sort by. Prefix with - for descending order',
    examples: ['created_at']
  })),
  filter: t.Optional(t.Record(t.String(), t.String(), {
    description: 'Filter object with field names as keys. Use filter[fieldName]=value1,value2 or -filter[fieldName]=value1,value2 for exclusion filters',
  })),
});

// Enhanced TypeScript type with template literal for filter keys
export type typeQueryParams = Static<typeof tboxQueryParams>;

export const tboxPaginationParams = t.Object({
  page: t.Optional(t.Numeric({default: 1})),
  limit: t.Optional(t.Numeric({default: 10})),
});

export type typePaginationParams = Static<typeof tboxPaginationParams>;