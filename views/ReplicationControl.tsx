import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Pause, Activity } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { ReplicationStatus, ReplicationState, RunningState } from '../types';

const ReplicationControl: React.FC = () => {
  const [status, setStatus] = useState<ReplicationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await nimbusService.getReplicationStatus();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleFull = async () => {
    if (!status) return;
    const newState = status.full_replication === ReplicationState.OFF;
    setActionLoading('full');
    try {
      await nimbusService.setFullReplication(newState);
      await fetchStatus();
    } finally {
      setActionLoading(null);
    }
  };

  const toggleIncremental = async () => {
    if (!status) return;
    const newState = status.incremental_replication === ReplicationState.OFF;
    setActionLoading('inc');
    try {
      await nimbusService.setIncrementalReplication(newState);
      await fetchStatus();
    } finally {
      setActionLoading(null);
    }
  };

  const getRunningStateLabel = (state: RunningState) => {
    return state === RunningState.Running ? '运行中' : '已停止';
  };

  const getReplicationStateLabel = (state: ReplicationState) => {
    return state === ReplicationState.ON ? '已启用' : '已关闭';
  };

  if (!status) return <div className="p-8 text-center text-gray-500">正在加载复制状态...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">复制控制</h2>
          <p className="text-gray-500 text-sm mt-1">直接管理数据同步任务。</p>
        </div>
        <button 
          onClick={fetchStatus} 
          disabled={loading}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Replication Card */}
        <div className={`border rounded-xl p-6 shadow-sm transition-all ${status.full_replication === ReplicationState.ON ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.full_replication === ReplicationState.ON ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <RefreshCw size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">全量复制</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.full_running === RunningState.Running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  任务: {getRunningStateLabel(status.full_running)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-sm font-bold ${status.full_replication === ReplicationState.ON ? 'text-blue-600' : 'text-gray-400'}`}>
                {getReplicationStateLabel(status.full_replication)}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6 h-10">
            从 MySQL 进行初始数据加载。通常只需运行一次以引导数据库。
          </p>

          <button
            onClick={toggleFull}
            disabled={!!actionLoading}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
              status.full_replication === ReplicationState.ON
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-lg'
            }`}
          >
             {actionLoading === 'full' ? (
               <RefreshCw className="animate-spin" size={18} />
             ) : status.full_replication === ReplicationState.ON ? (
               <>
                 <Pause size={18} fill="currentColor" /> 停止任务
               </>
             ) : (
               <>
                 <Play size={18} fill="currentColor" /> 启动全量同步
               </>
             )}
          </button>
        </div>

        {/* Incremental Replication Card */}
        <div className={`border rounded-xl p-6 shadow-sm transition-all ${status.incremental_replication === ReplicationState.ON ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-white'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.incremental_replication === ReplicationState.ON ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">增量复制</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.incremental_running === RunningState.Running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  任务: {getRunningStateLabel(status.incremental_running)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-sm font-bold ${status.incremental_replication === ReplicationState.ON ? 'text-purple-600' : 'text-gray-400'}`}>
                {getReplicationStateLabel(status.incremental_replication)}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6 h-10">
            持续的 Binlog 同步。保持数据实时更新。
          </p>

          <button
            onClick={toggleIncremental}
            disabled={!!actionLoading}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
              status.incremental_replication === ReplicationState.ON
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200 shadow-lg'
            }`}
          >
             {actionLoading === 'inc' ? (
               <RefreshCw className="animate-spin" size={18} />
             ) : status.incremental_replication === ReplicationState.ON ? (
               <>
                 <Pause size={18} fill="currentColor" /> 停止任务
               </>
             ) : (
               <>
                 <Play size={18} fill="currentColor" /> 启动增量同步
               </>
             )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        <h4 className="font-semibold mb-1 flex items-center gap-2">使用指南</h4>
        <ul className="list-disc pl-5 space-y-1 opacity-80">
          <li><strong>初始化:</strong> 启动全量复制。完成后停止，再启动增量复制。</li>
          <li><strong>维护:</strong> 在升级或重启 NimbusDB 前停止所有服务。</li>
          <li><strong>恢复:</strong> 如果 Binlog 过期，请重新执行全量复制。</li>
        </ul>
      </div>
    </div>
  );
};

export default ReplicationControl;