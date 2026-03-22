import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { TableInfo, ColumnInfo, QueryResult, SQLError } from './types';

let SQL: SqlJsStatic | null = null;
let currentDb: Database | null = null;
let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }
  
  if (SQL) {
    return Promise.resolve();
  }
  
  initPromise = (async () => {
    try {
      console.log('Initializing sql.js...');
      
      SQL = await initSqlJs({
        locateFile: (filename: string) => {
          const path = `/sql-wasm.wasm`;
          console.log(`Loading sql.js file: ${filename} from ${path}`);
          return path;
        }
      });
      
      console.log('sql.js initialized successfully');
      console.log('SQL version:', SQL.version);
    } catch (error) {
      console.error('Failed to initialize sql.js:', error);
      SQL = null;
      initPromise = null;
      throw new Error(`sql.js 初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  })();
  
  return initPromise;
}

export function loadDatabase(arrayBuffer: ArrayBuffer): void {
  if (!SQL) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  currentDb = new SQL.Database(new Uint8Array(arrayBuffer));
}

export function createEmptyDatabase(): void {
  if (!SQL) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  currentDb = new SQL.Database();
}

export function exportDatabase(): ArrayBuffer | null {
  if (!currentDb) return null;
  const data = currentDb.export();
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

export function closeDatabase(): void {
  if (currentDb) {
    currentDb.close();
    currentDb = null;
  }
}

export function isDatabaseOpen(): boolean {
  return currentDb !== null;
}

export function getAllTables(): TableInfo[] {
  if (!currentDb) return [];
  
  const result: TableInfo[] = [];
  const tables = currentDb.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  
  if (tables.length === 0) return result;
  
  const tableNames = tables[0].values.map((row: any[]) => row[0] as string);
  
  for (const tableName of tableNames) {
    const columns = getTableColumns(tableName);
    const rowCount = getTableRowCount(tableName);
    result.push({
      name: tableName,
      columns,
      rowCount
    });
  }
  
  return result;
}

export function getTableColumns(tableName: string): ColumnInfo[] {
  if (!currentDb) return [];
  
  const result = currentDb.exec(`PRAGMA table_info("${tableName}")`);
  if (result.length === 0) return [];
  
  return result[0].values.map((row: any[]) => ({
    name: row[1] as string,
    type: row[2] as string,
    notNull: row[3] === 1,
    defaultValue: row[4] as string | null,
    primaryKey: row[5] === 1
  }));
}

export function getTableRowCount(tableName: string): number {
  if (!currentDb) return 0;
  
  try {
    const result = currentDb.exec(`SELECT COUNT(*) FROM "${tableName}"`);
    if (result.length === 0) return 0;
    return result[0].values[0][0] as number;
  } catch {
    return 0;
  }
}

export function getTableData(tableName: string, limit: number = 5000, offset: number = 0): QueryResult {
  if (!currentDb) {
    return { columns: [], values: [] };
  }
  
  try {
    const result = currentDb.exec(
      `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`
    );
    
    if (result.length === 0) {
      const columns = getTableColumns(tableName).map(col => col.name);
      return { columns, values: [] };
    }
    
    return {
      columns: result[0].columns,
      values: result[0].values
    };
  } catch (error: any) {
    throw { message: error.message || 'Failed to get table data' } as SQLError;
  }
}

export function executeSQL(sql: string, maxRows: number = 5000): QueryResult[] {
  if (!currentDb) {
    throw { message: 'No database loaded' } as SQLError;
  }
  
  try {
    // 检查是否需要添加 LIMIT
    const trimmedSql = sql.trim().toUpperCase();
    const isSelect = trimmedSql.startsWith('SELECT');
    const hasLimit = /\bLIMIT\s+\d+/i.test(sql);
    
    let finalSql = sql;
    if (isSelect && !hasLimit) {
      // 自动添加 LIMIT 以防止大数据量查询
      finalSql = `${sql} LIMIT ${maxRows}`;
    }
    
    const results = currentDb.exec(finalSql);
    
    if (!results || results.length === 0) {
      return [];
    }
    
    return results.map((result: any) => ({
      columns: result.columns,
      values: result.values
    }));
  } catch (error: any) {
    throw { message: error.message || 'SQL execution failed' } as SQLError;
  }
}

export function executeNonQuery(sql: string): { changes: number; lastInsertRowId: number } {
  if (!currentDb) {
    throw { message: 'No database loaded' } as SQLError;
  }
  
  try {
    currentDb.run(sql);
    const changes = currentDb.getRowsModified();
    return { changes, lastInsertRowId: -1 };
  } catch (error: any) {
    throw { message: error.message || 'SQL execution failed' } as SQLError;
  }
}

export function getTableSchema(tableName: string): string {
  if (!currentDb) return '';
  
  try {
    const result = currentDb.exec(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return '';
    }
    
    return result[0].values[0][0] as string;
  } catch {
    return '';
  }
}

export function getTableIndexes(tableName: string): string[] {
  if (!currentDb) return [];
  
  try {
    const result = currentDb.exec(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='${tableName}'`
    );
    
    if (result.length === 0) return [];
    return result[0].values.map((row: any[]) => row[0] as string);
  } catch {
    return [];
  }
}
