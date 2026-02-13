import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Database, Table as TableIcon, AlignLeft, Search, FileText } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { QueryResult } from '../types';

const SqlEditor: React.FC = () => {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Context State
  const [currentDb, setCurrentDb] = useState<string>("");
  const [dbList, setDbList] = useState<string[]>([]);
  const [tableList, setTableList] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(100);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial Load: Get Databases
  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const res = await nimbusService.executeQuery("SHOW DATABASES");
      const dbs = res.rows.map(row => Object.values(row)[0] as string);
      setDbList(dbs);
      // Try to detect current db if not set
      if (!currentDb && res.currentDatabase) {
        setCurrentDb(res.currentDatabase);
        fetchTables(res.currentDatabase);
      }
    } catch (e) {
      console.error("Failed to fetch databases", e);
    }
  };

  const fetchTables = async (dbName: string) => {
    try {
      // We must ensure we are in the right DB context or use FROM syntax if supported
      // Usually SHOW TABLES works on current DB.
      // Let's force context switch first to be safe or just assume USE was run.
      const res = await nimbusService.executeQuery(`SHOW TABLES FROM ${dbName}`);
      const tables = res.rows.map(row => Object.values(row)[0] as string);
      setTableList(tables);
    } catch (e) {
      console.error("Failed to fetch tables", e);
      setTableList([]);
    }
  };

  const handleDbChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDb = e.target.value;
    if (!newDb) return;
    
    setLoading(true);
    try {
      // Execute USE command to switch context on server
      await nimbusService.executeQuery(`USE ${newDb}`);
      setCurrentDb(newDb);
      await fetchTables(newDb);
    } catch (err: any) {
      alert("切换数据库失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = e.target.value;
    if (!table) return;

    // View Structure: Run DESCRIBE
    setLoading(true);
    try {
      const res = await nimbusService.executeQuery(`DESCRIBE ${table}`, currentDb);
      setResult(res);
    } catch (err: any) {
      alert("获取表结构失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (isExplain = false) => {
    setLoading(true);
    setResult(null); 
    
    let sqlToRun = query;
    if (textareaRef.current) {
      const { selectionStart, selectionEnd, value } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        sqlToRun = value.substring(selectionStart, selectionEnd);
      }
    }

    if (!sqlToRun.trim()) {
      setLoading(false);
      return;
    }

    // Apply Explain if requested
    if (isExplain) {
      sqlToRun = `EXPLAIN ${sqlToRun}`;
    }

    try {
      const data = await nimbusService.executeQuery(sqlToRun, currentDb || undefined);
      setResult(data);
      if (data.currentDatabase && data.currentDatabase !== currentDb) {
        setCurrentDb(data.currentDatabase);
        fetchTables(data.currentDatabase);
      }
    } catch (e: any) {
      console.error(e);
      setResult({
        columns: [],
        rows: [],
        duration: 0,
        affectedRows: undefined,
      });
      alert("执行出错: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = () => {
    // Simple basic formatting (Just adding newlines after keywords for now)
    // In a real app, use a library like 'sql-formatter'
    const formatted = query
      .replace(/\s+/g, ' ')
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|LIMIT|INSERT|UPDATE|DELETE)\b/gi, '\n$1')
      .replace(/^\n/, ''); // remove leading newline
    setQuery(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleRun();
    }
  };

  return (
    <div className="flex gap-6 h-full pb-2.5">
      {/* Left Column: Editor & Results */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="bg-white p-0 rounded-xl shadow-sm border border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
             <div className="flex items-center gap-2 text-sm text-gray-500">
               <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">SQL</span>
               {currentDb ? <span>Context: <strong>{currentDb}</strong></span> : <span>未选择数据库</span>}
             </div>
             <div className="text-xs text-gray-400">Ctrl + Enter 执行</div>
          </div>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-48 p-4 font-mono text-sm bg-white outline-none resize-y"
            placeholder="输入 SQL 语句..."
            spellCheck={false}
          />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <FileText size={16} /> 执行结果
            </h3>
            {result && (
              <span className="text-xs text-gray-500 font-mono">
                {result.affectedRows !== undefined ? `受影响行数: ${result.affectedRows}` : `返回 ${result.rows.length} 行`} • 耗时 {result.duration}ms
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto pb-6 relative">
            {loading && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                 <Loader2 className="animate-spin text-blue-600" size={32} />
               </div>
            )}
            
            {result ? (
              <>
                {result.columns.length > 0 ? (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {result.columns.map((col, i) => (
                          <th key={i} className="px-6 py-3 font-medium text-gray-600 border-b border-gray-200 border-r border-gray-100 last:border-r-0 bg-gray-50">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                          {result.columns.map((col, colIdx) => (
                            <td key={colIdx} className="px-6 py-3 text-gray-700 border-r border-gray-50 last:border-r-0 max-w-xs truncate" title={String(row[col])}>
                              {row[col] === null ? <span className="text-gray-400 italic">NULL</span> : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2">
                     <div className="p-3 bg-green-50 text-green-600 rounded-full mb-2">
                        <Database size={24} />
                     </div>
                     <p className="font-medium text-gray-800">语句执行成功</p>
                     {result.affectedRows !== undefined && (
                       <p className="text-xs">受影响行数: {result.affectedRows}</p>
                     )}
                     {result.rows.length === 0 && result.affectedRows === undefined && (
                       <p className="text-xs text-gray-400">无结果集返回</p>
                     )}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center">
                   <Play size={32} className="mx-auto mb-2 opacity-20" />
                   <p>执行查询以查看结果</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Tools */}
      <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">
        
        {/* Connection Info Panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
           <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">选择数据库</label>
              <div className="relative">
                 <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 <select 
                   value={currentDb} 
                   onChange={handleDbChange}
                   className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                 >
                   <option value="" disabled>请选择数据库</option>
                   {dbList.map(db => <option key={db} value={db}>{db}</option>)}
                 </select>
              </div>
           </div>

           <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">查看表结构</label>
              <div className="relative">
                 <TableIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 <select 
                    onChange={handleTableSelect}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    disabled={!currentDb}
                    defaultValue=""
                 >
                   <option value="" disabled>选择表以查看...</option>
                   {tableList.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
           </div>

           <div>
             <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Limit 限制</label>
             <select 
               value={limit}
               onChange={(e) => setLimit(Number(e.target.value))}
               className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
             >
               <option value="10">10</option>
               <option value="50">50</option>
               <option value="100">100</option>
               <option value="500">500</option>
               <option value="1000">1000</option>
             </select>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleFormat}
                  className="flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <AlignLeft size={16} /> 美化
                </button>
                <button 
                  onClick={() => handleRun(true)}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  <Search size={16} /> 执行计划
                </button>
            </div>
            
            <button
                onClick={() => handleRun(false)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg text-sm font-bold transition-colors shadow-md shadow-green-100 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                SQL 查询
            </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-auto">
            <h4 className="text-xs font-bold text-blue-800 mb-2">快捷键提示</h4>
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-blue-600">
                    <span>执行查询</span>
                    <kbd className="font-mono bg-white px-1 rounded border border-blue-200">Ctrl + Enter</kbd>
                </div>
                <div className="flex justify-between text-xs text-blue-600">
                    <span>格式化</span>
                    <kbd className="font-mono bg-white px-1 rounded border border-blue-200">Ctrl + Shift + F</kbd>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SqlEditor;