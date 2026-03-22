import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Database,
  Upload,
  Download,
  Play,
  Table2,
  FileJson,
  Trash2,
  Plus,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  History,
  Clock,
  Trash
} from 'lucide-react';
import { TableInfo, QueryResult, SQLError } from '../types';
import {
  initDatabase,
  loadDatabase,
  createEmptyDatabase,
  exportDatabase,
  closeDatabase,
  isDatabaseOpen,
  getAllTables,
  getTableData,
  executeSQL,
  executeNonQuery
} from '../dbUtils';

interface ImportHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  importTime: number;
}

// IndexedDB 工具函数
const DB_NAME = 'SqlEditorDB';
const STORE_NAME = 'fileHistory';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveFileToDB = async (id: string, arrayBuffer: ArrayBuffer): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(arrayBuffer, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getFileFromDB = async (id: string): Promise<ArrayBuffer | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteFileFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearFilesFromDB = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 字段类型选项
const FIELD_TYPES = [
  { value: 'INTEGER', label: 'INTEGER (整数)' },
  { value: 'REAL', label: 'REAL (浮点数)' },
  { value: 'TEXT', label: 'TEXT (文本)' },
  { value: 'BLOB', label: 'BLOB (二进制)' },
  { value: 'NUMERIC', label: 'NUMERIC (数值)' },
  { value: 'BOOLEAN', label: 'BOOLEAN (布尔)' },
  { value: 'DATE', label: 'DATE (日期)' },
  { value: 'DATETIME', label: 'DATETIME (日期时间)' },
];

interface TableField {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  defaultValue: string;
}

const SQLEditorView: React.FC = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(() => {
    return localStorage.getItem('sqlEditor_dbLoaded') === 'true';
  });
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(() => {
    return localStorage.getItem('sqlEditor_selectedTable') || null;
  });
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [sqlQuery, setSqlQuery] = useState(() => {
    return localStorage.getItem('sqlEditor_sqlQuery') || '';
  });
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sqlEditor_expandedTables');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [activeTab, setActiveTab] = useState<'data' | 'query'>(() => {
    return (localStorage.getItem('sqlEditor_activeTab') as 'data' | 'query') || 'data';
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sqlEditor_importHistory');
      console.log('初始化时读取历史记录:', saved ? '有数据' : '无数据');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('历史记录条数:', parsed.length);
        return parsed;
      }
    } catch (err) {
      console.error('读取历史记录失败:', err);
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新建表对话框状态
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableFields, setNewTableFields] = useState<TableField[]>([
    { name: '', type: 'INTEGER', primaryKey: true, notNull: false, defaultValue: '' }
  ]);

  // 新建字段对话框状态
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('TEXT');
  const [newColumnNotNull, setNewColumnNotNull] = useState(false);
  const [newColumnDefault, setNewColumnDefault] = useState('');

  // 保存文件输入框引用（用于 HTTP 环境下的保存）
  const saveFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log('Database initialized successfully in component');
        setDbInitialized(true);
        if (dbLoaded && isDatabaseOpen()) {
          refreshTables();
          if (selectedTable) {
            try {
              const data = getTableData(selectedTable);
              setTableData(data);
            } catch (err) {
              console.error('Failed to load table data:', err);
            }
          }
        }
      })
      .catch(err => {
        console.error('Failed to initialize database:', err);
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        setError(`数据库引擎初始化失败: ${errorMessage}。请检查网络连接或刷新页面重试`);
      });
  }, []);

  const refreshTables = useCallback(() => {
    if (!isDatabaseOpen()) return;
    const tableList = getAllTables();
    setTables(tableList);
  }, []);

  const addToHistory = useCallback(async (file: File, arrayBuffer: ArrayBuffer) => {
    try {
      console.log('开始保存到历史记录:', file.name, '大小:', file.size);
      
      const newItem: ImportHistoryItem = {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize: file.size,
        importTime: Date.now()
      };
      
      // 保存文件内容到 IndexedDB
      await saveFileToDB(newItem.id, arrayBuffer);
      console.log('文件已保存到 IndexedDB');
      
      setImportHistory(prev => {
        // 去重：如果文件名相同，删除旧的文件数据
        const existingItem = prev.find(item => item.fileName === file.name);
        if (existingItem) {
          deleteFileFromDB(existingItem.id).catch(console.error);
        }
        
        const filtered = prev.filter(item => item.fileName !== file.name);
        const newHistory = [newItem, ...filtered].slice(0, 10); // 最多保留10条
        
        // 如果超过10条，删除旧的文件数据
        if (filtered.length >= 10) {
          const itemsToRemove = filtered.slice(9);
          itemsToRemove.forEach(item => {
            deleteFileFromDB(item.id).catch(console.error);
          });
        }
        
        localStorage.setItem('sqlEditor_importHistory', JSON.stringify(newHistory));
        console.log('历史记录已保存，共', newHistory.length, '条');
        
        return newHistory;
      });
    } catch (err) {
      console.error('保存到历史记录失败:', err);
    }
  }, []);

  const loadFromHistory = useCallback(async (item: ImportHistoryItem) => {
    try {
      console.log('从历史记录加载文件:', item.fileName, 'ID:', item.id);
      
      // 从 IndexedDB 读取文件内容
      const arrayBuffer = await getFileFromDB(item.id);
      
      if (!arrayBuffer) {
        setError('文件数据已丢失，请重新导入');
        // 从历史记录中移除
        setImportHistory(prev => {
          const newHistory = prev.filter(i => i.id !== item.id);
          localStorage.setItem('sqlEditor_importHistory', JSON.stringify(newHistory));
          return newHistory;
        });
        return;
      }
      
      loadDatabase(arrayBuffer);
      setDbLoaded(true);
      localStorage.setItem('sqlEditor_dbLoaded', 'true');
      refreshTables();
      setSuccess(`数据库 "${item.fileName}" 从历史记录加载成功`);
      setError(null);
      setShowHistory(false);
    } catch (err: any) {
      console.error('从历史记录加载失败:', err);
      setError('从历史记录加载失败: ' + (err.message || '未知错误'));
    }
  }, [refreshTables]);

  const removeFromHistory = useCallback((id: string) => {
    // 同时删除 IndexedDB 中的文件数据
    deleteFileFromDB(id).catch(console.error);
    
    setImportHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem('sqlEditor_importHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);
  
  const clearHistory = useCallback(() => {
    // 清空 IndexedDB
    clearFilesFromDB().catch(console.error);
    
    setImportHistory([]);
    localStorage.removeItem('sqlEditor_importHistory');
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!dbInitialized) {
      setError('数据库引擎正在初始化，请稍后再试');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      loadDatabase(arrayBuffer);
      setDbLoaded(true);
      localStorage.setItem('sqlEditor_dbLoaded', 'true');
      await addToHistory(file, arrayBuffer);
      refreshTables();
      setSuccess(`数据库 "${file.name}" 加载成功`);
      setError(null);
    } catch (err: any) {
      setError('加载数据库失败: ' + (err.message || '未知错误'));
      setSuccess(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [dbInitialized, refreshTables, addToHistory]);

  const handleCreateNewDb = useCallback(async () => {
    try {
      // 创建空数据库
      createEmptyDatabase();
      setDbLoaded(true);
      localStorage.setItem('sqlEditor_dbLoaded', 'true');
      refreshTables();

      // 导出数据库数据
      const data = exportDatabase();
      const arrayBuffer = new Uint8Array(data).buffer;

      // 检查是否可以使用 File System Access API
      // 要求：浏览器支持 + HTTPS 或 localhost
      const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const hasFileSystemAccessAPI = 'showSaveFilePicker' in window;
      console.log('浏览器是否支持 File System Access API:', hasFileSystemAccessAPI);
      console.log('是否为安全上下文 (HTTPS/localhost):', isSecureContext);

      if (hasFileSystemAccessAPI && isSecureContext) {
        try {
          console.log('尝试使用 showSaveFilePicker...');
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: 'new_database.db',
            types: [
              {
                description: 'SQLite Database',
                accept: {
                  'application/x-sqlite3': ['.db'],
                  'application/x-sqlite': ['.sqlite'],
                  'application/vnd.sqlite3': ['.sqlite3'],
                },
              },
            ],
          });

          console.log('文件句柄获取成功:', fileHandle);
          const writable = await fileHandle.createWritable();
          await writable.write(arrayBuffer);
          await writable.close();
          console.log('文件保存成功');

          // 添加到历史记录
          const file = new File([arrayBuffer], 'new_database.db', { type: 'application/x-sqlite3' });
          await addToHistory(file, arrayBuffer);

          setSuccess('新数据库创建并保存成功');
          setError(null);
          return;
        } catch (err: any) {
          console.error('使用 File System Access API 保存失败:', err);
          if (err.name === 'AbortError') {
            return;
          }
          console.log('回退到传统下载方式');
        }
      } else {
        if (!hasFileSystemAccessAPI) {
          console.log('浏览器不支持 File System Access API，使用传统下载方式');
        } else {
          console.log('当前不是安全上下文 (HTTP)，触发文件选择框');
          // 在 HTTP 环境下，触发文件选择框让用户选择保存位置
          if (saveFileInputRef.current) {
            setSuccess('请选择一个文件来保存数据库（可以新建或覆盖现有文件）');
            setTimeout(() => {
              saveFileInputRef.current?.click();
            }, 500);
          }
          return;
        }
      }

      // 使用传统下载方式
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = 'new_database.db';
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // 触发下载
      a.click();
      
      // 延迟清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // 添加到历史记录
      const file = new File([arrayBuffer], 'new_database.db', { type: 'application/x-sqlite3' });
      await addToHistory(file, arrayBuffer);

      setSuccess('新数据库创建成功，已下载到本地');
      setError(null);
    } catch (err: any) {
      console.error('创建数据库失败:', err);
      setError('创建数据库失败: ' + (err.message || '未知错误'));
    }
  }, [refreshTables, addToHistory]);

  // 处理保存文件选择（用于 HTTP 环境）
  const handleSaveFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 获取数据库数据
      const data = exportDatabase();
      const arrayBuffer = new Uint8Array(data).buffer;

      // 写入到用户选择的文件
      const arrayBufferView = new Uint8Array(arrayBuffer);
      const blob = new Blob([arrayBufferView], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // 触发下载
      a.click();
      
      // 延迟清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // 添加到历史记录
      await addToHistory(file, arrayBuffer);

      setSuccess(`数据库已保存到 "${file.name}"`);
      setError(null);
    } catch (err: any) {
      console.error('保存文件失败:', err);
      setError('保存文件失败: ' + (err.message || '未知错误'));
    }

    if (saveFileInputRef.current) {
      saveFileInputRef.current.value = '';
    }
  }, [addToHistory]);

  const handleExportDb = useCallback(() => {
    try {
      const data = exportDatabase();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database.db';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('数据库导出成功');
    } catch (err: any) {
      setError('导出失败: ' + (err.message || '未知错误'));
    }
  }, []);

  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    localStorage.setItem('sqlEditor_selectedTable', tableName);
    setActiveTab('data');
    localStorage.setItem('sqlEditor_activeTab', 'data');
    try {
      const data = getTableData(tableName);
      setTableData(data);
      setError(null);
    } catch (err: any) {
      setError('获取表数据失败: ' + (err.message || '未知错误'));
      setTableData(null);
    }
  }, []);

  const toggleTableExpand = useCallback((tableName: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      localStorage.setItem('sqlEditor_expandedTables', JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const removeComments = (sql: string): string => {
    const lines = sql.split('\n');
    const cleanedLines = lines.map(line => {
      const hashIndex = line.indexOf('#');
      const doubleSlashIndex = line.indexOf('//');
      const dashIndex = line.indexOf('--');
      
      let commentStart = -1;
      if (hashIndex !== -1) {
        commentStart = hashIndex;
      }
      if (doubleSlashIndex !== -1 && (commentStart === -1 || doubleSlashIndex < commentStart)) {
        commentStart = doubleSlashIndex;
      }
      if (dashIndex !== -1 && (commentStart === -1 || dashIndex < commentStart)) {
        commentStart = dashIndex;
      }
      
      if (commentStart !== -1) {
        return line.substring(0, commentStart).trimEnd();
      }
      return line;
    });
    
    return cleanedLines.filter(line => line.trim().length > 0).join('\n');
  };

  const handleExecuteSQL = useCallback(() => {
    if (!dbLoaded) {
      setError('请先导入或创建数据库');
      return;
    }

    const cleanedQuery = removeComments(sqlQuery);
    if (!cleanedQuery.trim()) {
      setError('没有可执行的 SQL 语句（所有行都被注释掉了）');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedQuery = cleanedQuery.trim().toUpperCase();
      
      if (trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('PRAGMA')) {
        const results = executeSQL(cleanedQuery);
        setQueryResults(results);
        setActiveTab('query');
        localStorage.setItem('sqlEditor_activeTab', 'query');
        setSuccess(`查询成功，返回 ${results.length} 个结果集`);
      } else {
        const result = executeNonQuery(cleanedQuery);
        refreshTables();
        if (selectedTable) {
          const data = getTableData(selectedTable);
          setTableData(data);
        }
        setSuccess(`执行成功，影响 ${result.changes} 行`);
      }
    } catch (err: any) {
      setError('SQL 执行错误: ' + (err.message || '未知错误'));
      setQueryResults([]);
    } finally {
      setIsExecuting(false);
    }
  }, [sqlQuery, selectedTable, refreshTables]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleDataUpdated = useCallback(() => {
    // 刷新表数据
    if (selectedTable) {
      try {
        const data = getTableData(selectedTable);
        setTableData(data);
      } catch (err) {
        console.error('Failed to reload table data:', err);
      }
    }
    
    // 如果有查询结果，重新执行SQL查询来刷新结果
    if (queryResults.length > 0 && sqlQuery.trim()) {
      try {
        const cleanedQuery = removeComments(sqlQuery);
        if (cleanedQuery.trim()) {
          const trimmedQuery = cleanedQuery.trim().toUpperCase();
          if (trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('PRAGMA')) {
            const results = executeSQL(cleanedQuery);
            setQueryResults(results);
          }
        }
      } catch (err) {
        console.error('Failed to refresh query results:', err);
      }
    }
  }, [selectedTable, queryResults.length, sqlQuery]);

  // 新建表
  const handleCreateTable = useCallback(() => {
    if (!newTableName.trim()) {
      setError('请输入表名');
      return;
    }

    // 验证字段
    const validFields = newTableFields.filter(f => f.name.trim());
    if (validFields.length === 0) {
      setError('请至少添加一个字段');
      return;
    }

    // 检查主键
    const primaryKeys = validFields.filter(f => f.primaryKey);
    if (primaryKeys.length === 0) {
      setError('请至少设置一个主键字段');
      return;
    }

    try {
      // 构建 CREATE TABLE SQL
      let sql = `CREATE TABLE "${newTableName.trim()}" (`;
      const fieldDefs = validFields.map(field => {
        let def = `"${field.name.trim()}" ${field.type}`;
        if (field.primaryKey) {
          def += ' PRIMARY KEY';
        }
        if (field.notNull) {
          def += ' NOT NULL';
        }
        if (field.defaultValue) {
          def += ` DEFAULT ${field.defaultValue}`;
        }
        return def;
      });
      sql += fieldDefs.join(', ');
      sql += ')';

      console.log('创建表 SQL:', sql);
      executeNonQuery(sql);

      // 刷新表列表
      refreshTables();
      
      // 重置表单
      setNewTableName('');
      setNewTableFields([{ name: '', type: 'INTEGER', primaryKey: true, notNull: false, defaultValue: '' }]);
      setShowCreateTable(false);
      
      setSuccess(`表 "${newTableName.trim()}" 创建成功`);
    } catch (err: any) {
      setError('创建表失败: ' + (err.message || '未知错误'));
    }
  }, [newTableName, newTableFields, refreshTables]);

  // 添加字段到新建表
  const addFieldToNewTable = useCallback(() => {
    setNewTableFields(prev => [...prev, { name: '', type: 'TEXT', primaryKey: false, notNull: false, defaultValue: '' }]);
  }, []);

  // 移除字段
  const removeFieldFromNewTable = useCallback((index: number) => {
    setNewTableFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 更新字段
  const updateField = useCallback((index: number, updates: Partial<TableField>) => {
    setNewTableFields(prev => prev.map((field, i) => i === index ? { ...field, ...updates } : field));
  }, []);

  // 添加字段到现有表
  const handleAddColumn = useCallback(() => {
    if (!selectedTable) {
      setError('请先选择一个表');
      return;
    }
    if (!newColumnName.trim()) {
      setError('请输入字段名');
      return;
    }

    try {
      let sql = `ALTER TABLE "${selectedTable}" ADD COLUMN "${newColumnName.trim()}" ${newColumnType}`;
      if (newColumnNotNull) {
        sql += ' NOT NULL';
      }
      if (newColumnDefault) {
        sql += ` DEFAULT '${newColumnDefault.replace(/'/g, "''")}'`;
      }

      console.log('添加字段 SQL:', sql);
      executeNonQuery(sql);

      // 刷新表列表和表数据
      refreshTables();
      if (selectedTable) {
        const data = getTableData(selectedTable);
        setTableData(data);
      }
      
      // 重置表单
      setNewColumnName('');
      setNewColumnType('TEXT');
      setNewColumnNotNull(false);
      setNewColumnDefault('');
      setShowAddColumn(false);
      
      setSuccess(`字段 "${newColumnName.trim()}" 添加成功`);
    } catch (err: any) {
      setError('添加字段失败: ' + (err.message || '未知错误'));
    }
  }, [selectedTable, newColumnName, newColumnType, newColumnNotNull, newColumnDefault, refreshTables]);

  return (
    <div className="flex h-full bg-slate-50">
      {/* 左侧边栏 */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        {/* 数据库操作区 */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            数据库
          </h3>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3,.sql"
              onChange={handleFileUpload}
              className="hidden"
            />
            {/* 隐藏的保存文件输入框（用于 HTTP 环境） */}
            <input
              ref={saveFileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={handleSaveFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              导入数据库
            </button>
            <button
              onClick={() => importHistory.length > 0 && setShowHistory(!showHistory)}
              disabled={importHistory.length === 0}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                importHistory.length === 0 
                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  : showHistory 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              导入历史 ({importHistory.length})
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCreateNewDb}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建
              </button>
              <button
                onClick={handleExportDb}
                disabled={!dbLoaded}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
          </div>
        </div>

        {/* 表列表 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              数据表
              {tables.length > 0 && (
                <span className="text-xs text-slate-500">({tables.length})</span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {dbLoaded && (
                <>
                  <button
                    onClick={() => setShowCreateTable(true)}
                    className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded transition-colors"
                    title="新建表"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={refreshTables}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                    title="刷新"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                  </button>
                </>
              )}
            </div>
          </div>

          {showHistory ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-slate-500 uppercase">导入历史</h4>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash className="w-3 h-3" />
                  清空
                </button>
              </div>
              {importHistory.map(item => (
                <div
                  key={item.id}
                  className="group p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {item.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{formatFileSize(item.fileSize)}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.importTime)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !dbLoaded ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              请先导入或创建数据库
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              数据库中没有表
            </div>
          ) : (
            <div className="space-y-1">
              {tables.map(table => (
                <div key={table.name}>
                  <div
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      selectedTable === table.name
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTableExpand(table.name);
                      }}
                      className="p-0.5 hover:bg-slate-200 rounded"
                    >
                      {expandedTables.has(table.name) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    <div 
                      className="flex-1 flex items-center gap-2"
                      onClick={() => handleTableSelect(table.name)}
                    >
                      <Table2 className="w-4 h-4 text-slate-400" />
                      <span className="flex-1 text-left truncate">{table.name}</span>
                      <span className="text-xs text-slate-400">{table.rowCount}</span>
                    </div>
                  </div>
                  
                  {expandedTables.has(table.name) && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {table.columns.map(col => (
                        <div
                          key={col.name}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600"
                        >
                          <span className="font-medium">{col.name}</span>
                          <span className="text-slate-400">{col.type}</span>
                          {col.primaryKey && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                              PK
                            </span>
                          )}
                        </div>
                      ))}
                      {selectedTable === table.name && (
                        <button
                          onClick={() => setShowAddColumn(true)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          添加字段
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 消息提示 */}
        {(error || success) && (
          <div
            className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
              error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
          >
            {error ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="flex-1 text-sm">{error || success}</span>
            {error && !dbInitialized && (
              <button
                onClick={() => {
                  setError(null);
                  initDatabase()
                    .then(() => {
                      setDbInitialized(true);
                      setSuccess('数据库引擎初始化成功');
                    })
                    .catch(err => {
                      const errorMessage = err instanceof Error ? err.message : '未知错误';
                      setError(`数据库引擎初始化失败: ${errorMessage}`);
                    });
                }}
                className="px-3 py-1 bg-white text-red-600 rounded text-xs font-medium hover:bg-red-50 transition-colors"
              >
                重试
              </button>
            )}
            <button
              onClick={clearMessages}
              className="p-1 hover:bg-black/5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SQL 编辑器 */}
        <div className="p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  SQL 编辑器
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">支持 # 或 -- 注释语法</p>
              </div>
              <button
                onClick={handleExecuteSQL}
                disabled={!dbLoaded || isExecuting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {isExecuting ? '执行中...' : '执行'}
              </button>
            </div>
            <textarea
              value={sqlQuery}
              onChange={(e) => {
                setSqlQuery(e.target.value);
                localStorage.setItem('sqlEditor_sqlQuery', e.target.value);
              }}
              placeholder={dbLoaded ? "输入 SQL 语句，例如：SELECT * FROM table_name" : "请先导入或创建数据库"}
              disabled={!dbLoaded}
              className="w-full h-32 p-4 font-mono text-sm text-slate-700 bg-slate-50 resize-none focus:outline-none focus:bg-white disabled:opacity-50"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 标签页 */}
        <div className="px-4 border-b border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab('data');
                localStorage.setItem('sqlEditor_activeTab', 'data');
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'data'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              表数据
            </button>
            <button
              onClick={() => {
                setActiveTab('query');
                localStorage.setItem('sqlEditor_activeTab', 'query');
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'query'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              查询结果
              {queryResults.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                  {queryResults.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 数据展示区域 */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'data' ? (
            selectedTable && tableData ? (
              <DataTable data={tableData} tableName={selectedTable} onDataUpdated={handleDataUpdated} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Table2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>选择左侧的表查看数据</p>
                </div>
              </div>
            )
          ) : (
            queryResults.length > 0 ? (
              <div className="space-y-4">
                {queryResults.map((result, index) => (
                  <div key={index} className="bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-700">
                      结果集 {index + 1} ({result.values.length} 行)
                    </div>
                    <DataTable 
                      data={result} 
                      tableName={selectedTable}
                      onDataUpdated={handleDataUpdated}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileJson className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>执行 SQL 查询查看结果</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* 新建表对话框 */}
        {showCreateTable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">新建表</h3>
                <button
                  onClick={() => setShowCreateTable(false)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 overflow-auto flex-1">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">表名</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="输入表名"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">字段</label>
                    <button
                      onClick={addFieldToNewTable}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加字段
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newTableFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value })}
                          placeholder="字段名"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={field.primaryKey}
                            onChange={(e) => updateField(index, { primaryKey: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          主键
                        </label>
                        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={field.notNull}
                            onChange={(e) => updateField(index, { notNull: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          非空
                        </label>
                        {newTableFields.length > 1 && (
                          <button
                            onClick={() => removeFieldFromNewTable(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                <button
                  onClick={() => setShowCreateTable(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateTable}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加字段对话框 */}
        {showAddColumn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[400px]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  添加字段到 "{selectedTable}"
                </h3>
                <button
                  onClick={() => setShowAddColumn(false)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">字段名</label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="输入字段名"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">字段类型</label>
                  <select
                    value={newColumnType}
                    onChange={(e) => setNewColumnType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newColumnNotNull}
                      onChange={(e) => setNewColumnNotNull(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">非空 (NOT NULL)</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">默认值（可选）</label>
                  <input
                    type="text"
                    value={newColumnDefault}
                    onChange={(e) => setNewColumnDefault(e.target.value)}
                    placeholder="输入默认值"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddColumn(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddColumn}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Toast 提示组件
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 数据表格组件
interface DataTableProps {
  data: QueryResult;
  tableName?: string;
  onDataUpdated?: () => void;
}

interface EditState {
  rowIndex: number;
  columnIndex: number;
  originalValue: any;
  newValue: string;
}

const ROWS_PER_PAGE = 100;
const MAX_ROWS_WITHOUT_PAGINATION = 500;

const DataTable: React.FC<DataTableProps> = ({ data, tableName, onDataUpdated }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayMode, setDisplayMode] = useState<'paginated' | 'all'>('paginated');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  if (!data.columns || data.columns.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        无数据
      </div>
    );
  }

  const totalRows = data.values.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const needsPagination = totalRows > MAX_ROWS_WITHOUT_PAGINATION;

  // 如果数据量不大，直接显示所有
  const displayData = (!needsPagination || displayMode === 'all')
    ? data.values
    : data.values.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setEditState(null); // 切换页码时取消编辑
      setError(null);
      setToast(null);
    }
  };

  const handleCellClick = (rowIndex: number, columnIndex: number, value: any) => {
    if (!tableName) return;
    setEditState({
      rowIndex,
      columnIndex,
      originalValue: value,
      newValue: value === null ? '' : String(value)
    });
    setError(null);
    setToast(null);
  };

  const handleCancelEdit = () => {
    setEditState(null);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editState || !tableName) return;
    
    try {
      // 构建 UPDATE SQL 语句
      const columnName = data.columns[editState.columnIndex];
      const rowData = displayData[editState.rowIndex];
      
      // 找到主键列
      let primaryKeyColumn: string | undefined;
      for (let i = 0; i < data.columns.length; i++) {
        // 简单判断：通常 ID 或主键列在前面，且名称可能包含 "id" 或 "primary"
        const colName = data.columns[i].toLowerCase();
        if (colName.includes('id') || colName.includes('primary') || i === 0) {
          primaryKeyColumn = data.columns[i];
          break;
        }
      }
      
      if (!primaryKeyColumn) {
        throw new Error('无法找到主键列，无法更新数据');
      }
      
      const primaryKeyValue = rowData[data.columns.indexOf(primaryKeyColumn)];
      if (primaryKeyValue === null) {
        throw new Error('主键值为空，无法更新数据');
      }
      
      // 处理值类型
      let newValue: any = editState.newValue;
      if (newValue === '') {
        newValue = null;
      } else if (!isNaN(newValue) && !isNaN(parseFloat(newValue))) {
        newValue = parseFloat(newValue);
      }
      
      // 构建 SQL
      let sql = `UPDATE "${tableName}" SET "${columnName}" = `;
      if (newValue === null) {
        sql += 'NULL';
      } else if (typeof newValue === 'string') {
        sql += `'${newValue.replace(/'/g, "''")}'`;
      } else {
        sql += newValue;
      }
      sql += ` WHERE "${primaryKeyColumn}" = `;
      if (typeof primaryKeyValue === 'string') {
        sql += `'${primaryKeyValue.replace(/'/g, "''")}'`;
      } else {
        sql += primaryKeyValue;
      }
      
      console.log('执行更新 SQL:', sql);
      
      // 执行更新
      const result = executeNonQuery(sql);
      
      if (result.changes > 0) {
        setToast({ message: '数据更新成功，记得导出数据库保存到本地', type: 'success' });
        setEditState(null);
        // 通知父组件数据已更新
        if (onDataUpdated) {
          onDataUpdated();
        }
      } else {
        setToast({ message: '数据更新失败：未找到匹配的记录', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: '更新失败: ' + (err.message || '未知错误'), type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toast 提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 数据信息提示 */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4" />
          <span>
            共 {totalRows.toLocaleString()} 行数据
            {needsPagination && displayMode === 'paginated' && (
              <span className="ml-2">
                (显示第 {(currentPage - 1) * ROWS_PER_PAGE + 1} - {Math.min(currentPage * ROWS_PER_PAGE, totalRows)} 行)
              </span>
            )}
          </span>
        </div>
        {needsPagination && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDisplayMode(displayMode === 'paginated' ? 'all' : 'paginated')}
              className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
            >
              {displayMode === 'paginated' ? '显示全部（可能卡顿）' : '分页显示'}
            </button>
          </div>
        )}
      </div>

      {/* 编辑错误提示 */}
      {error && (
        <div
          className="mx-4 my-2 p-2 rounded-lg flex items-center gap-2 bg-red-50 text-red-700"
        >
          <span className="text-xs flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              {data.columns.map((col, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200 whitespace-nowrap"
                >
                  {col}
                  {tableName && <span className="ml-1 text-xs text-slate-400">(点击编辑)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={data.columns.length}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  表中暂无数据
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const actualIndex = displayMode === 'paginated' 
                  ? (currentPage - 1) * ROWS_PER_PAGE + rowIndex 
                  : rowIndex;
                return (
                  <tr
                    key={actualIndex}
                    className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                  >
                    {row.map((cell, cellIndex) => {
                      const isEditing = editState?.rowIndex === rowIndex && editState?.columnIndex === cellIndex;
                      
                      if (isEditing) {
                        return (
                          <td key={cellIndex} className="px-4 py-2.5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editState.newValue}
                                onChange={(e) => setEditState({ ...editState, newValue: e.target.value })}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 bg-slate-500 text-white rounded text-xs hover:bg-slate-600 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </td>
                        );
                      }
                      
                      return (
                        <td
                          key={cellIndex}
                          className={`px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-xs truncate cursor-pointer hover:bg-slate-100 ${tableName ? 'hover:bg-slate-100' : ''}`}
                          title={cell !== null ? String(cell) : 'NULL'}
                          onClick={() => tableName && handleCellClick(rowIndex, cellIndex, cell)}
                        >
                          {cell === null ? (
                            <span className="text-slate-400 italic">NULL</span>
                          ) : typeof cell === 'object' ? (
                            JSON.stringify(cell)
                          ) : (
                            String(cell)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      {needsPagination && displayMode === 'paginated' && (
        <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-sm text-slate-600">
            第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              首页
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              末页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLEditorView;