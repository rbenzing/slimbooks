export interface DatabaseConfig {
    path: string;
    options?: DatabaseOptions;
}
export interface DatabaseOptions {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: any, ...additionalArgs: any[]) => void;
}
export interface QueryResult {
    changes: number;
    lastInsertRowid: number;
}
export interface SelectResult<T = any> {
    data: T[];
    total?: number;
}
export interface PaginationOptions {
    limit?: number;
    offset?: number;
    page?: number;
}
export interface SortOptions {
    column: string;
    direction: 'ASC' | 'DESC';
}
export interface FilterOptions {
    [key: string]: any;
}
export interface QueryOptions extends PaginationOptions {
    sort?: SortOptions[];
    filters?: FilterOptions;
}
export interface TransactionCallback<T = any> {
    (): T;
}
export interface IDatabase {
    connect(config: DatabaseConfig): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    executeQuery(query: string, params?: any[]): QueryResult;
    getOne<T = any>(query: string, params?: any[]): T | null;
    getMany<T = any>(query: string, params?: any[]): T[];
    getWithPagination<T = any>(query: string, params?: any[], options?: QueryOptions): SelectResult<T>;
    beginTransaction(): void;
    commit(): void;
    rollback(): void;
    transaction<T>(callback: TransactionCallback<T>): T;
    createTable(tableName: string, definition: string): void;
    dropTable(tableName: string): void;
    tableExists(tableName: string): boolean;
    backup(path: string): void;
    vacuum(): void;
    pragma(setting: string, value?: string | number): any;
}
export interface ServiceOptions extends QueryOptions {
    includeDeleted?: boolean;
    includeArchived?: boolean;
}
export interface Migration {
    version: number;
    name: string;
    up: (db: IDatabase) => void;
    down: (db: IDatabase) => void;
}
export interface TableSchema {
    name: string;
    columns: ColumnDefinition[];
    constraints?: string[];
    indexes?: IndexDefinition[];
}
export interface ColumnDefinition {
    name: string;
    type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NUMERIC';
    constraints?: string[];
}
export interface IndexDefinition {
    name: string;
    columns: string[];
    unique?: boolean;
}
export interface SeedData {
    table: string;
    data: Record<string, any>[];
    truncate?: boolean;
}
export interface DatabaseHealth {
    isConnected: boolean;
    uptime: number;
    totalQueries: number;
    avgQueryTime: number;
    lastBackup?: string;
    diskUsage: number;
}
//# sourceMappingURL=database.types.d.ts.map