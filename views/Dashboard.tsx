import React, { useEffect, useState } from 'react';
import { nimbusService } from '../services/nimbusService';
import { ReplicationStatus, ReplicationState, RunningState } from '../types';
import { Activity, Database, Server, CheckCircle2, XCircle, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [repStatus, setRepStatus] = useState<ReplicationStatus | null>(null);

  useEffect(() => {
    nimbusService.getReplicationStatus().then(setRepStatus);
  }, []);

  const StatusBadge = ({ active }: { active: boolean }) => (
    active 
      ? <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle2 size={16} /> 已启用</span> 
      : <span className="flex items-center gap-1 text-gray-400 text-sm font-medium"><XCircle size={16} /> 未启用</span>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Connection Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">数据库状态</h3>
              <p className="text-xl font-bold text-gray-800">已连接</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Clock size={12} /> 运行时间: 4天 12小时
          </div>
        </div>

        {/* Full Replication Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <Server size={24} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">全量同步</h3>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-800">
                  {repStatus?.full_running === RunningState.Running ? '运行中' : '已停止'}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge active={repStatus?.full_replication === ReplicationState.ON} />
        </div>

        {/* Inc Replication Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">增量同步</h3>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-800">
                  {repStatus?.incremental_running === RunningState.Running ? '运行中' : '已停止'}
                </span>
              </div>
            </div>
          </div>
           <StatusBadge active={repStatus?.incremental_replication === ReplicationState.ON} />
        </div>
      </div>

      {/* Quick Actions / Getting Started */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">欢迎使用 NimbusDB 管理后台</h2>
        <p className="text-slate-300 mb-6 max-w-2xl">
          直接控制复制任务，调整性能参数，并执行 SQL 查询。
          在此处所做的更改将立即持久化到 NimbusDB 的 sled 存储中。
        </p>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors text-sm">
            查看文档
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;