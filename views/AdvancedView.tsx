import React, { useEffect, useState } from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { BinlogPosition } from '../types';

const AdvancedView: React.FC = () => {
  const [binlog, setBinlog] = useState<BinlogPosition | null>(null);
  const [includedDbs, setIncludedDbs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Edit states
  const [newBinlogFile, setNewBinlogFile] = useState('');
  const [newBinlogPos, setNewBinlogPos] = useState(0);
  const [dbsInput, setDbsInput] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [bData, dData] = await Promise.all([
        nimbusService.getBinlogPosition(),
        nimbusService.getIncludedDbs()
      ]);
      setBinlog(bData);
      setNewBinlogFile(bData.file);
      setNewBinlogPos(bData.position);
      setIncludedDbs(dData);
      setDbsInput(dData);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleBinlogSave = async () => {
    if(confirm("警告：手动修改 Binlog 位点可能导致数据不一致。是否继续？")) {
      await nimbusService.setBinlogPosition(newBinlogFile, newBinlogPos);
      const updated = await nimbusService.getBinlogPosition();
      setBinlog(updated);
    }
  };

  const handleDbsSave = async () => {
    await nimbusService.setIncludedDbs(dbsInput);
    setIncludedDbs(dbsInput);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">正在加载高级设置...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Sliders className="text-gray-600" size={24} />
          高级设置
        </h2>
        <p className="text-gray-500 text-sm mt-1">管理底层配置。请谨慎操作。</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Included DBs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">包含的数据库</h3>
          <p className="text-sm text-gray-600 mb-4">逗号分隔的数据库列表。留空则复制所有库。</p>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={dbsInput}
              onChange={(e) => setDbsInput(e.target.value)}
              placeholder="db1,db2,db3"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              onClick={handleDbsSave}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              更新列表
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            当前生效列表: <span className="font-mono bg-gray-100 px-1 rounded">{includedDbs || '(全部)'}</span>
          </div>
        </div>

        {/* Binlog Position */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle size={100} className="text-red-500" />
          </div>
          
          <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle size={18} />
            Binlog 位点
          </h3>
          <p className="text-sm text-red-600/80 mb-6 max-w-lg">
            手动设置 Binlog 位点非常危险。仅用于恢复或跳过特定错误事件。
          </p>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">当前文件</label>
              <div className="font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-200">{binlog?.file}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">当前位置</label>
              <div className="font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-200">{binlog?.position}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-red-100">
            <h4 className="text-sm font-medium text-gray-800 mb-3">手动覆盖</h4>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">新文件名</label>
                <input 
                  type="text" 
                  value={newBinlogFile}
                  onChange={(e) => setNewBinlogFile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs text-gray-500 mb-1">新位置</label>
                <input 
                  type="number" 
                  value={newBinlogPos}
                  onChange={(e) => setNewBinlogPos(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
                />
              </div>
              <button 
                onClick={handleBinlogSave}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                设置位点
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdvancedView;