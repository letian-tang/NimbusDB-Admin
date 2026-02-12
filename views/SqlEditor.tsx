import React, { useState, useRef } from 'react';
import { Play, Loader2, Database } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { QueryResult } from '../types';

const SqlEditor: React.FC = () => {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDb, setCurrentDb] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null); // Clear previous result
    
    // Check for selected text
    let sqlToRun = query;
    if (textareaRef.current) {
      const { selectionStart, selectionEnd, value } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        sqlToRun = value.substring(selectionStart, selectionEnd);
      }
    }

    // Don't run empty queries
    if (!sqlToRun.trim()) {
      setLoading(false);
      return;
    }

    try {
      // Pass the current database context to the service
      const data = await nimbusService.executeQuery(sqlToRun, currentDb || undefined);
      
      setResult(data);
      
      // Update local database context if it changed on the server (e.g., via "USE dbname")
      if (data.currentDatabase) {
        setCurrentDb(data.currentDatabase);
      }
    } catch (e: any) {
      // Show error in the result area or via alert
      // For now, mocking an error result to show in UI
      console.error(e);
      setResult({ // Create a pseudo-result to show error
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleRun();
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-full pb-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <label className="text-sm font-bold text-gray-700">SQL 编辑器</label>
             {currentDb && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                  <Database size={12} />
                  <span>当前库: <strong>{currentDb}</strong></span>
                </div>
             )}
          </div>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            执行查询
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-40 p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
          placeholder="在此输入 SQL (例如: USE my_db; SELECT * FROM my_table;)"
          spellCheck={false}
        />
        <div className="text-xs text-gray-500 flex gap-4 justify-between">
          <span>快捷键: <kbd className="font-sans bg-gray-100 px-1 rounded border border-gray-300">Ctrl</kbd> + <kbd className="font-sans bg-gray-100 px-1 rounded border border-gray-300">Enter</kbd> 执行</span>
          <span className="text-gray-400">选中特定文本以仅执行该部分</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="font-semibold text-gray-700 text-sm">执行结果</h3>
          {result && (
            <span className="text-xs text-gray-500 font-mono">
              {result.affectedRows !== undefined ? `受影响行数: ${result.affectedRows}` : `返回 ${result.rows.length} 行`} • 耗时 {result.duration}ms
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-auto pb-6">
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
                          <td key={colIdx} className="px-6 py-3 text-gray-700 border-r border-gray-50 last:border-r-0">
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
  );
};

export default SqlEditor;