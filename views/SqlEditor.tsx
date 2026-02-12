import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { QueryResult } from '../types';

const SqlEditor: React.FC = () => {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const data = await nimbusService.executeQuery(query);
      const end = performance.now();
      setResult({ ...data, duration: Math.round(end - start) });
    } catch (e) {
      console.error(e);
      // In a real app, handle error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-gray-700">SQL 编辑器</label>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            执行查询
          </button>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-40 p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="在此输入 SQL..."
        />
        <div className="text-xs text-gray-500 flex gap-4">
          <span>快捷键: Ctrl+Enter 执行</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700 text-sm">执行结果</h3>
          {result && (
            <span className="text-xs text-gray-500">
              {result.rows.length} 行数据，耗时 {result.duration}ms
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-auto">
          {result ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {result.columns.map((col, i) => (
                    <th key={i} className="px-6 py-3 font-medium text-gray-600 border-b border-gray-200">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {result.columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-6 py-3 text-gray-700">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              执行查询以查看结果
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SqlEditor;