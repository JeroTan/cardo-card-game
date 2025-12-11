import type { QueryProps, FilterData, SortData, PageProps } from "@/types/model/filter";

type QueryType = 'select' | 'insert' | 'update' | 'delete';

export class QueryBuilder {
  private queryType: QueryType = 'select';
  private tableName: string = '';
  private selectFields: string[] = ['*'];
  private tableAlias?: string;
  private insertData: Record<string, any> = {};
  private updateData: Record<string, any> = {};
  private params: any[] = [];
  private paramIndex: number = 1;
  private whereClauses: string[] = [];
  private sortClauses: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Start a SELECT query
   */
  select(fields: string[] = ['*'], tableAlias?: string): this {
    this.queryType = 'select';
    this.selectFields = fields;
    if (tableAlias) this.tableAlias = tableAlias;
    return this;
  }

  /**
   * Set table alias (can be chained at any point)
   */
  alias(tableAlias: string): this {
    this.tableAlias = tableAlias;
    return this;
  }

  /**
   * Start an INSERT query
   */
  insert(data: Record<string, any>): this {
    this.queryType = 'insert';
    this.insertData = { ...this.insertData, ...data };
    return this;
  }

  /**
   * Start an UPDATE query
   */
  update(data: Record<string, any>): this {
    this.queryType = 'update';
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Start a DELETE query
   */
  delete(): this {
    this.queryType = 'delete';
    return this;
  }

  /**
   * Add values for INSERT
   */
  values(data: Record<string, any>): this {
    this.insertData = { ...this.insertData, ...data };
    return this;
  }

  /**
   * Add/update fields for UPDATE
   */
  set(data: Record<string, any>): this {
    this.updateData = { ...this.updateData, ...data };
    return this;
  }

  /**
   * Add a search condition (LIKE on multiple fields)
   * SQL: field LIKE ?1 OR field LIKE ?2
   * Params: ['%searchTerm%', '%searchTerm%'] - wildcards are in the parameter values
   */
  search(searchTerm: string | null, fields: string[]): this {
    if (!searchTerm || fields.length === 0) return this;

    // Each field needs its own parameter index
    const conditions = fields.map((field, i) => `${field} LIKE ?${this.paramIndex + i}`);
    this.whereClauses.push(`(${conditions.join(' OR ')})`);
    
    // Add % wildcards to parameter values for "match anywhere" behavior
    fields.forEach(() => {
      this.params.push(`%${searchTerm}%`);
    });
    
    // Increment by the number of fields added
    this.paramIndex += fields.length;
    return this;
  }

  /**
   * Add WHERE IN or NOT IN filter
   * Optimizes single-value IN/NOT IN to use = or != for better D1 compatibility
   */
  filter(filter: FilterData): this {
    if (!filter.values || filter.values.length === 0) return this;

    // Optimize single-value IN/NOT IN to use simple equality
    if (filter.values.length === 1) {
      const operator = filter.type === 'in' ? '=' : '!=';
      this.whereClauses.push(`${filter.field} ${operator} ?${this.paramIndex}`);
      this.params.push(filter.values[0]);
      this.paramIndex++;
    } else {
      // Multiple values: use IN/NOT IN
      const placeholders = filter.values.map((_, i) => `?${this.paramIndex + i}`).join(', ');
      const operator = filter.type === 'in' ? 'IN' : 'NOT IN';
      
      this.whereClauses.push(`${filter.field} ${operator} (${placeholders})`);
      this.params.push(...filter.values);
      this.paramIndex += filter.values.length;
    }
    
    return this;
  }

  /**
   * Add multiple filters
   */
  filters(filters: FilterData[] | undefined): this {
    if (!filters || filters.length === 0) return this;
    
    filters.forEach(f => this.filter(f));
    return this;
  }

  /**
   * Add WHERE condition
   */
  where(field: string, operator: string, value: any): this {
    this.whereClauses.push(`${field} ${operator} ?${this.paramIndex}`);
    this.params.push(value);
    this.paramIndex++;
    return this;
  }

  /**
   * Add custom WHERE clause
   */
  whereRaw(clause: string, ...values: any[]): this {
    const clauseWithParams = clause.replace(/\?/g, () => `?${this.paramIndex++}`);
    this.whereClauses.push(clauseWithParams);
    this.params.push(...values);
    return this;
  }

  /**
   * Add ORDER BY
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortClauses.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Add multiple sorts
   */
  sorts(sorts: SortData[] | undefined): this {
    if (!sorts || sorts.length === 0) return this;
    
    sorts.forEach(s => this.orderBy(s.field, s.direction));
    return this;
  }

  /**
   * Apply QueryProps (search, filter, sort)
   * If a table alias is set, it will be prepended to filter and sort fields if not already present
   */
  applyQuery(query: QueryProps | undefined, searchFields: string[] = []): this {
    if (!query) return this;

    // Apply search
    if (query.search && searchFields.length > 0) {
      this.search(query.search, searchFields);
    }

    // Apply filters (with alias prefix if needed)
    if (query.filter) {
      const aliasedFilters = query.filter.map(f => ({
        ...f,
        field: this.addAliasPrefix(f.field)
      }));
      this.filters(aliasedFilters);
    }

    // Apply sorts (with alias prefix if needed)
    if (query.sort) {
      const aliasedSorts = query.sort.map(s => ({
        ...s,
        field: this.addAliasPrefix(s.field)
      }));
      this.sorts(aliasedSorts);
    }

    return this;
  }

  /**
   * Add table alias prefix to field if alias exists and field doesn't already have it
   */
  private addAliasPrefix(field: string): string {
    if (!this.tableAlias) return field;
    if (field.includes('.')) return field; // Already has a prefix
    return `${this.tableAlias}.${field}`;
  }

  /**
   * Apply PageProps (pagination)
   */
  applyPage(page: PageProps | undefined): this {
    if (!page) return this;

    const offset = (page.page - 1) * page.limit;
    this.limit(page.limit);
    this.offset(offset);

    return this;
  }

  /**
   * Add LIMIT
   */
  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Add OFFSET
   */
  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Build the final SQL query
   */
  build(): { sql: string; params: any[] } {
    switch (this.queryType) {
      case 'select':
        return this.buildSelect();
      case 'insert':
        return this.buildInsert();
      case 'update':
        return this.buildUpdate();
      case 'delete':
        return this.buildDelete();
      default:
        throw new Error(`Unknown query type: ${this.queryType}`);
    }
  }

  private buildSelect(): { sql: string; params: any[] } {
    const alias = this.tableAlias || '';
    const fields = this.selectFields.join(', ');
    let sql = `SELECT ${fields} FROM ${this.tableName}${alias ? ` ${alias}` : ''}`;

    if (this.whereClauses.length > 0) {
      sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
    }

    if (this.sortClauses.length > 0) {
      sql += ` ORDER BY ${this.sortClauses.join(', ')}`;
    }

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params: this.params };
  }

  private buildInsert(): { sql: string; params: any[] } {
    const fields = Object.keys(this.insertData);
    const placeholders = fields.map((_, i) => `?${i + 1}`).join(', ');
    const params = Object.values(this.insertData);

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    return { sql, params };
  }

  private buildUpdate(): { sql: string; params: any[] } {
    const fields = Object.keys(this.updateData);
    const setClauses = fields.map((field, i) => `${field} = ?${i + 1}`).join(', ');
    const updateParams = Object.values(this.updateData);
    
    // Adjust WHERE clause parameter indices
    const adjustedWhereClauses = this.whereClauses.map(clause => {
      return clause.replace(/\?(\d+)/g, (_, num) => `?${parseInt(num) + fields.length}`);
    });
    
    const allParams = [...updateParams, ...this.params];

    let sql = `UPDATE ${this.tableName} SET ${setClauses}`;

    if (adjustedWhereClauses.length > 0) {
      sql += ` WHERE ${adjustedWhereClauses.join(' AND ')}`;
    }

    return { sql, params: allParams };
  }

  private buildDelete(): { sql: string; params: any[] } {
    let sql = `DELETE FROM ${this.tableName}`;

    if (this.whereClauses.length > 0) {
      sql += ` WHERE ${this.whereClauses.join(' AND ')}`;
    } else {
      throw new Error('DELETE without WHERE clause is not allowed. Use whereRaw("1=1") if you really want to delete all rows.');
    }

    return { sql, params: this.params };
  }

  /**
   * Execute query on D1 database (returns full D1Result or array)
   */
  async execute<T = any>(db: D1Database): Promise<T[] | D1Result> {
    const { sql, params } = this.build();
    try {
      if (this.queryType === 'select') {
        const result = await db.prepare(sql).bind(...params).all<T>();
        return result.results || [];
      } else {
        // INSERT, UPDATE, DELETE return D1Result
        return await db.prepare(sql).bind(...params).run();
      }
    } catch (error: any) {
      console.error('QueryBuilder execute error:', error);
      throw new D1Error(
        error?.message || 'Failed to execute query',
        error?.code || 'EXECUTE_ERROR'
      );
    }
  }

  /**
   * Execute and get results array (for SELECT queries)
   */
  async get<T = any>(db: D1Database): Promise<T[]> {
    const { sql, params } = this.build();
    try {
      const result = await db.prepare(sql).bind(...params).all<T>();
      return result.results || [];
    } catch (error: any) {
      console.error('QueryBuilder get error:', error);
      throw new D1Error(
        error?.message || 'Failed to get query results',
        error?.code || 'GET_ERROR'
      );
    }
  }

  /**
   * Execute and get first result
   */
  async first<T = any>(db: D1Database): Promise<T | null> {
    const { sql, params } = this.build();
    try {
      const result = await db.prepare(sql).bind(...params).first<T>();
      return result || null;
    } catch (error: any) {
      console.error('QueryBuilder first error:', error);
      throw new D1Error(
        error?.message || 'Failed to get first result',
        error?.code || 'FIRST_ERROR'
      );
    }
  }

  /**
   * Execute COUNT query and return total count
   * Usage: await query('card').selectCount('c').applyQuery(...).count(db)
   */
  async count(db: D1Database): Promise<number> {
    // Temporarily override select fields with COUNT(*)
    const originalFields = this.selectFields;
    const originalLimit = this.limitValue;
    const originalOffset = this.offsetValue;
    
    this.selectFields = ['COUNT(*) as count'];
    this.limitValue = undefined;
    this.offsetValue = undefined;

    try {
      const { sql, params } = this.build();
      const result = await db.prepare(sql).bind(...params).first<{ count: number }>();
      
      // Restore original values
      this.selectFields = originalFields;
      this.limitValue = originalLimit;
      this.offsetValue = originalOffset;
      
      return result?.count || 0;
    } catch (error: any) {
      console.error('QueryBuilder count error:', error);
      throw new D1Error(
        error?.message || 'Failed to count results',
        error?.code || 'COUNT_ERROR'
      );
    }
  }

  /**
   * Set up for COUNT query (alias for select with COUNT(*))
   */
  selectCount(tableAlias?: string): this {
    return this.select(['COUNT(*) as count'], tableAlias);
  }

  /**
   * Execute mutation (INSERT, UPDATE, DELETE) and return D1Result
   */
  async run(db: D1Database): Promise<D1Result> {
    const { sql, params } = this.build();
    try {
      return await db.prepare(sql).bind(...params).run();
    } catch (error: any) {
      console.error('QueryBuilder run error:', error);
      throw new D1Error(
        error?.message || 'Failed to run query',
        error?.code || 'RUN_ERROR'
      );
    }
  }
}

/**
 * Helper function to create a new QueryBuilder
 */
export function query(tableName: string): QueryBuilder {
  return new QueryBuilder(tableName);
}

// Convenience exports for clearer syntax
export const from = query;
export const table = query;

/**
 * Debug: List all tables in the database
 */
export async function listTables(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    console.log('📊 Database Tables:');
    console.log(result.results);
    return result.results;
  } catch (error: any) {
    console.error('Error listing tables:', error);
    throw new D1Error(
      error?.message || 'Failed to list tables',
      error?.code || 'LIST_TABLES_ERROR'
    );
  }
}



export class D1Error {
  constructor(
    public message: string,
    public code?: string,
  )
  {}
}