import type { PageProps, QueryProps } from "@/types/model/filter";

export function convertQueryToQueryProps(query: {
  search?: string;
  filter?: Record<string, string>;
  sort?: string;
}): QueryProps {
  const queryProps: QueryProps = {
    search: query.search || null,
    filter: [],
    sort: [],
  };
  // Process filter parameters
  if (query.filter) {
    for (const [key, value] of Object.entries(query.filter)) {
      const type = key.startsWith('-') ? 'not_in' : 'in';
      const field = key.replace(/^-/, '');
      const values = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
      if (values.length > 0) {
        queryProps.filter.push({ field, values, type });
      }
    }
  }
  // Process sort parameters
  if (query.sort) {
    const sortFields = query.sort.split(',').map(s => s.trim()).filter(s => s.length > 0);
    for (const field of sortFields) {
      const direction = field.startsWith('-') ? 'desc' : 'asc';
      const fieldName = field.replace(/^-/, '');
      queryProps.sort.push({ field: fieldName, direction });
    }
  }
  return queryProps;
}

export function convertPageToPageProps(query: {
  page?: string|number;
  limit?: string|number;
}): PageProps {
  return {
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  };
}


export function convertQueriesToPageAndQueryProps(query: {
  search?: string;
  filter?: Record<string, string>;
  sort?: string;
  page?: string|number;
  limit?: string|number;
}): { queryProps: QueryProps; pageProps: PageProps } {
  const queryProps = convertQueryToQueryProps(query);
  const pageProps = convertPageToPageProps(query);
  return { queryProps, pageProps };
}


export function getQueryTransformer(query: Record<string|number, any>){
  const transformedQuery = {
    search: query?.search,
    filter: {} as Record<string, string>,
    sort: query?.sort,
    page: query?.page ? Number(query?.page) : undefined,
    limit: query?.limit ? Number(query?.limit) : undefined,
  }
  for(const [key, value] of Object.entries(query)) {
    if(key.startsWith('filter[') && key.endsWith(']')) {
      const filterKey = key.slice(7, -1); // Extract field name between 'filter[' and ']'
      transformedQuery.filter[filterKey] = value;
    }
  }
  // We need to undefine all the query to avoid sending unwanted params and add our constructed ones here
  Object.keys(query).forEach(k => {
    delete query[k];
  });
  Object.assign(query, transformedQuery);
  return transformedQuery;
}