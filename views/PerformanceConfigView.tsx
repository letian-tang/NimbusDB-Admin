import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Zap } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { PerformanceConfig } from '../types';

const PerformanceConfigView: React.FC = () => {
  const [config, setConfig] = useState<PerformanceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<keyof PerformanceConfig | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await nimbusService.getPerformanceConfig();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdate = async (key: keyof PerformanceConfig, valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;

    setSaving(key);
    try {
      await nimbusService.updatePerformanceConfig(key, val);
      // Optimistic update handled by refetch or local state in real app
      // Here we just update local state
      if(config) setConfig({ ...config, [key]: val });
    } finally {
      setSaving(null);
    }
  };

  if (!config) return <div className="p-8 text-center text-gray-500">正在加载性能配置...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="text-yellow-500" size={24} />
            性能调优
          </h2>
          <p className="text-gray-500 text-sm mt-1">调整批次大小和刷新间隔以优化吞吐量。</p>
        </div>
        <button 
          onClick={fetchConfig} 
          disabled={loading}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          
          {/* Binlog Batch Size */}
          <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Binlog 批次大小 (Binlog Batch Size)
              </label>
              <p className="text-sm text-gray-500">增量复制期间单次事务处理的事件数量。</p>
            </div>
            <div className="w-48 flex gap-2">
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue={config.binlog_batch_size}
                onBlur={(e) => handleUpdate('binlog_batch_size', e.target.value)}
              />
              {saving === 'binlog_batch_size' && <Save className="text-blue-500 animate-pulse my-auto" size={16} />}
            </div>
          </div>

          {/* Fetch Batch Size */}
          <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                拉取批次大小 (Fetch Batch Size)
              </label>
              <p className="text-sm text-gray-500">全量复制期间每次请求获取的行数。</p>
            </div>
            <div className="w-48 flex gap-2">
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue={config.fetch_batch_size}
                onBlur={(e) => handleUpdate('fetch_batch_size', e.target.value)}
              />
              {saving === 'fetch_batch_size' && <Save className="text-blue-500 animate-pulse my-auto" size={16} />}
            </div>
          </div>

          {/* Flush Interval */}
          <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                刷新间隔 (ms)
              </label>
              <p className="text-sm text-gray-500">数据刷盘频率。数值越小越安全，但速度越慢。</p>
            </div>
            <div className="w-48 flex gap-2">
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue={config.flush_interval_ms}
                onBlur={(e) => handleUpdate('flush_interval_ms', e.target.value)}
              />
              {saving === 'flush_interval_ms' && <Save className="text-blue-500 animate-pulse my-auto" size={16} />}
            </div>
          </div>

        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-500 text-right">
          失去焦点自动保存更改。
        </div>
      </div>
    </div>
  );
};

export default PerformanceConfigView;