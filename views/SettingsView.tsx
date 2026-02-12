import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, Play, Pause, Activity, 
  Save, Zap, HardDrive, Eye, EyeOff, 
  Sliders, AlertTriangle, Server, Database 
} from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { 
  ReplicationStatus, ReplicationState, RunningState, 
  PerformanceConfig, MySqlSourceConfig, BinlogPosition 
} from '../types';

// --- Sub-components ---

const ReplicationPanel: React.FC = () => {
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

  useEffect(() => { fetchStatus(); }, []);

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

  if (!status) return <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">正在加载状态...</div>;

  return (
    <div className="relative">
      <button 
        onClick={fetchStatus} 
        disabled={loading} 
        className="absolute -top-12 right-0 text-gray-400 hover:text-blue-600 transition-colors p-2"
        title="刷新状态"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Replication */}
        <div className={`border rounded-xl p-6 shadow-sm transition-all ${status.full_replication === ReplicationState.ON ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.full_replication === ReplicationState.ON ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <RefreshCw size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">全量复制</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.full_running === RunningState.Running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {status.full_running === RunningState.Running ? '运行中' : '已停止'}
                </span>
              </div>
            </div>
            <span className={`text-sm font-bold ${status.full_replication === ReplicationState.ON ? 'text-blue-600' : 'text-gray-400'}`}>
              {status.full_replication === ReplicationState.ON ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-6 h-10">从 MySQL 进行初始数据加载。</p>
          <button
            onClick={toggleFull}
            disabled={!!actionLoading}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm ${
              status.full_replication === ReplicationState.ON
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-md'
            }`}
          >
             {actionLoading === 'full' ? <RefreshCw className="animate-spin" size={16} /> : status.full_replication === ReplicationState.ON ? <><Pause size={16} /> 停止</> : <><Play size={16} /> 启动</>}
          </button>
        </div>

        {/* Incremental Replication */}
        <div className={`border rounded-xl p-6 shadow-sm transition-all ${status.incremental_replication === ReplicationState.ON ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200 bg-white'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.incremental_replication === ReplicationState.ON ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">增量复制</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.incremental_running === RunningState.Running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {status.incremental_running === RunningState.Running ? '运行中' : '已停止'}
                </span>
              </div>
            </div>
            <span className={`text-sm font-bold ${status.incremental_replication === ReplicationState.ON ? 'text-purple-600' : 'text-gray-400'}`}>
              {status.incremental_replication === ReplicationState.ON ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-6 h-10">持续的 Binlog 同步。</p>
          <button
            onClick={toggleIncremental}
            disabled={!!actionLoading}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all text-sm ${
              status.incremental_replication === ReplicationState.ON
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200 shadow-md'
            }`}
          >
             {actionLoading === 'inc' ? <RefreshCw className="animate-spin" size={16} /> : status.incremental_replication === ReplicationState.ON ? <><Pause size={16} /> 停止</> : <><Play size={16} /> 启动</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const PerformancePanel: React.FC = () => {
  const [config, setConfig] = useState<PerformanceConfig | null>(null);
  const [saving, setSaving] = useState<keyof PerformanceConfig | null>(null);

  useEffect(() => {
    nimbusService.getPerformanceConfig().then(setConfig);
  }, []);

  const handleUpdate = async (key: keyof PerformanceConfig, valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    setSaving(key);
    try {
      await nimbusService.updatePerformanceConfig(key, val);
      if(config) setConfig({ ...config, [key]: val });
    } finally {
      setSaving(null);
    }
  };

  if (!config) return <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">正在加载配置...</div>;

  const fields = [
    { key: 'binlog_batch_size', label: 'Binlog 批次大小', desc: '增量复制单次事务事件数' },
    { key: 'fetch_batch_size', label: '全量拉取批次', desc: '全量复制每次获取行数' },
    { key: 'flush_interval_ms', label: '刷新间隔 (ms)', desc: '数据持久化刷盘频率' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {fields.map((f) => (
          <div key={f.key} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">{f.label}</label>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
            <div className="w-40 flex gap-2 relative">
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                defaultValue={config[f.key as keyof PerformanceConfig]}
                onBlur={(e) => handleUpdate(f.key as keyof PerformanceConfig, e.target.value)}
              />
              {saving === f.key && <Save className="text-blue-500 animate-pulse absolute right-[-30px] top-2" size={18} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SourcePanel: React.FC = () => {
  const [formData, setFormData] = useState<Partial<MySqlSourceConfig>>({});
  const [config, setConfig] = useState<MySqlSourceConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    nimbusService.getSourceConfig().then(data => {
      setConfig(data);
      setFormData(data);
    });
  }, []);

  const handleChange = (key: keyof MySqlSourceConfig, val: string | number) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await nimbusService.updateSourceConfig(formData);
      setConfig(formData as MySqlSourceConfig);
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">正在加载配置...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">主机地址 (Host)</label>
          <input type="text" required value={formData.mysql_host || ''} onChange={(e) => handleChange('mysql_host', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="col-span-1 space-y-2">
          <label className="block text-sm font-medium text-gray-700">端口 (Port)</label>
          <input type="number" required value={formData.mysql_port || 3306} onChange={(e) => handleChange('mysql_port', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">用户名</label>
          <input type="text" required value={formData.mysql_user || ''} onChange={(e) => handleChange('mysql_user', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-gray-700">密码</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} value={formData.mysql_password || ''} onChange={(e) => handleChange('mysql_password', e.target.value)} placeholder={config.mysql_password ? "********" : "未设置"} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Server ID</label>
        <input type="number" required value={formData.mysql_server_id || 0} onChange={(e) => handleChange('mysql_server_id', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="pt-2 flex justify-end">
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 text-sm">
          {saving ? <Save className="animate-spin" size={16} /> : <Save size={16} />} 保存配置
        </button>
      </div>
    </form>
  );
};

const AdvancedPanel: React.FC = () => {
  const [binlog, setBinlog] = useState<BinlogPosition | null>(null);
  const [includedDbs, setIncludedDbs] = useState<string>('');
  const [newBinlogFile, setNewBinlogFile] = useState('');
  const [newBinlogPos, setNewBinlogPos] = useState(0);
  const [dbsInput, setDbsInput] = useState('');

  useEffect(() => {
    Promise.all([nimbusService.getBinlogPosition(), nimbusService.getIncludedDbs()]).then(([b, d]) => {
      setBinlog(b);
      setNewBinlogFile(b.file);
      setNewBinlogPos(b.position);
      setIncludedDbs(d);
      setDbsInput(d);
    });
  }, []);

  const handleBinlogSave = async () => {
    if(confirm("警告：手动修改位点可能导致数据不一致。是否继续？")) {
      await nimbusService.setBinlogPosition(newBinlogFile, newBinlogPos);
      const updated = await nimbusService.getBinlogPosition();
      setBinlog(updated);
    }
  };

  const handleDbsSave = async () => {
    await nimbusService.setIncludedDbs(dbsInput);
    setIncludedDbs(dbsInput);
  };

  return (
    <div className="space-y-6">
      {/* Included DBs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-2">白名单数据库</h3>
        <p className="text-sm text-gray-500 mb-4">仅复制以下数据库（逗号分隔）。留空则复制所有。</p>
        <div className="flex gap-4">
          <input type="text" value={dbsInput} onChange={(e) => setDbsInput(e.target.value)} placeholder="db1,db2" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <button onClick={handleDbsSave} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">更新</button>
        </div>
        <div className="mt-2 text-xs text-gray-400">当前生效: {includedDbs || 'ALL'}</div>
      </div>

      {/* Binlog Danger Zone */}
      <div className="bg-red-50/50 rounded-xl shadow-sm border border-red-200 p-6 relative">
        <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Binlog 位点覆写</h3>
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div><span className="text-gray-500 text-xs uppercase">File</span> <div className="font-mono">{binlog?.file}</div></div>
          <div><span className="text-gray-500 text-xs uppercase">Position</span> <div className="font-mono">{binlog?.position}</div></div>
        </div>
        <div className="flex items-end gap-3 pt-3 border-t border-red-100">
          <div className="flex-1"><label className="text-xs text-gray-500">新文件名</label><input type="text" value={newBinlogFile} onChange={(e) => setNewBinlogFile(e.target.value)} className="w-full px-2 py-1.5 border border-red-200 rounded text-sm font-mono" /></div>
          <div className="w-32"><label className="text-xs text-gray-500">新位置</label><input type="number" value={newBinlogPos} onChange={(e) => setNewBinlogPos(parseInt(e.target.value))} className="w-full px-2 py-1.5 border border-red-200 rounded text-sm font-mono" /></div>
          <button onClick={handleBinlogSave} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 h-[34px]">强制设置</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Settings View ---

const SettingsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10 border-b border-gray-200 pb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Database className="text-blue-600" size={32} />
          实例设置
        </h2>
        <p className="text-gray-500 mt-2 ml-1">
          全览并管理当前实例的所有配置项。
        </p>
      </div>

      <div className="space-y-16">
        {/* Replication */}
        <section id="replication">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Server size={20} />
              </div>
              复制控制
             </h3>
           </div>
           <ReplicationPanel />
        </section>

        {/* Source */}
        <section id="source">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                <HardDrive size={20} />
              </div>
              源库配置
             </h3>
           </div>
           <SourcePanel />
        </section>

        {/* Performance */}
        <section id="performance">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                <Zap size={20} />
              </div>
              性能配置
             </h3>
           </div>
           <PerformancePanel />
        </section>

        {/* Advanced */}
        <section id="advanced">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                <Sliders size={20} />
              </div>
              高级设置
             </h3>
           </div>
           <AdvancedPanel />
        </section>
      </div>
    </div>
  );
};

export default SettingsView;