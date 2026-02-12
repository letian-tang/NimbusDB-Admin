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

// --- Shared Components ---

const SectionHeader: React.FC<{ icon: React.ElementType, title: string, colorClass: string }> = ({ icon: Icon, title, colorClass }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`p-1.5 rounded-md ${colorClass}`}>
      <Icon size={16} />
    </div>
    <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
  </div>
);

// --- Sub-components ---

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

  if (!config) return <div className="p-4 text-center text-xs text-gray-400">加载中...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-fade-in">
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-6 md:col-span-5">
          <label className="block text-xs font-medium text-gray-500 mb-1">主机地址 (Host)</label>
          <input type="text" required value={formData.mysql_host || ''} onChange={(e) => handleChange('mysql_host', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="col-span-3 md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">端口</label>
          <input type="number" required value={formData.mysql_port || 3306} onChange={(e) => handleChange('mysql_port', parseInt(e.target.value))} className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="col-span-3 md:col-span-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">用户名</label>
          <input type="text" required value={formData.mysql_user || ''} onChange={(e) => handleChange('mysql_user', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="col-span-6 md:col-span-2 relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Server ID</label>
          <input type="number" required value={formData.mysql_server_id || 0} onChange={(e) => handleChange('mysql_server_id', parseInt(e.target.value))} className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="col-span-6 md:col-span-4 relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">密码</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} value={formData.mysql_password || ''} onChange={(e) => handleChange('mysql_password', e.target.value)} placeholder={config.mysql_password ? "********" : "未设置"} className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none pr-8" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
        </div>
         <div className="col-span-12 md:col-span-8 flex items-end justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-70 h-[34px]">
            {saving ? <Save className="animate-spin" size={14} /> : <Save size={14} />} 保存配置
            </button>
        </div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {/* Included DBs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
        <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">白名单数据库 (Included DBs)</label>
            <div className="flex gap-2 mb-2">
            <input type="text" value={dbsInput} onChange={(e) => setDbsInput(e.target.value)} placeholder="db1,db2 (留空为全部)" className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
            <button onClick={handleDbsSave} className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs hover:bg-slate-700 whitespace-nowrap">更新</button>
            </div>
        </div>
        <div className="text-[10px] text-gray-400">当前生效: <span className="font-mono text-gray-600">{includedDbs || 'ALL'}</span></div>
      </div>

      {/* Binlog Danger Zone */}
      <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4 relative">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
                <AlertTriangle size={14} /> Binlog 覆写
            </div>
            <div className="text-[10px] text-red-600/70 font-mono">
                {binlog?.file}:{binlog?.position}
            </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="File" value={newBinlogFile} onChange={(e) => setNewBinlogFile(e.target.value)} className="flex-1 px-2 py-1 border border-red-200 rounded text-xs font-mono focus:border-red-400 outline-none" />
          <input type="number" placeholder="Pos" value={newBinlogPos} onChange={(e) => setNewBinlogPos(parseInt(e.target.value))} className="w-20 px-2 py-1 border border-red-200 rounded text-xs font-mono focus:border-red-400 outline-none" />
          <button onClick={handleBinlogSave} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 whitespace-nowrap">设置</button>
        </div>
      </div>
    </div>
  );
};

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

  if (!status) return <div className="p-4 text-center text-xs text-gray-400 border border-dashed rounded-lg">加载状态...</div>;

  const Card = ({ title, active, running, loadingKey, onToggle, colorClass, bgClass, icon: Icon }: any) => (
      <div className={`border rounded-lg p-4 shadow-sm flex items-center justify-between transition-colors ${active ? bgClass : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
             <div className={`p-2 rounded ${active ? colorClass : 'bg-gray-100 text-gray-400'}`}>
                <Icon size={18} />
             </div>
             <div>
                 <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                 <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${running === RunningState.Running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {running === RunningState.Running ? 'RUNNING' : 'STOPPED'}
                    </span>
                 </div>
             </div>
        </div>
        <button
            onClick={onToggle}
            disabled={!!actionLoading}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1 ${
                active 
                ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                : 'bg-slate-900 border-transparent text-white hover:bg-slate-800'
            }`}
        >
            {actionLoading === loadingKey ? <RefreshCw className="animate-spin" size={12} /> : active ? <><Pause size={12} /> 停止</> : <><Play size={12} /> 启动</>}
        </button>
      </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in relative">
      <button onClick={fetchStatus} className="absolute -top-8 right-0 text-gray-400 hover:text-blue-600 p-1">
         <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      </button>
      <Card 
        title="全量复制" 
        icon={RefreshCw}
        active={status.full_replication === ReplicationState.ON}
        running={status.full_running}
        loadingKey="full"
        onToggle={toggleFull}
        colorClass="bg-blue-100 text-blue-600"
        bgClass="bg-blue-50/50 border-blue-200"
      />
      <Card 
        title="增量复制" 
        icon={Activity}
        active={status.incremental_replication === ReplicationState.ON}
        running={status.incremental_running}
        loadingKey="inc"
        onToggle={toggleIncremental}
        colorClass="bg-purple-100 text-purple-600"
        bgClass="bg-purple-50/50 border-purple-200"
      />
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

  if (!config) return <div className="p-4 text-center text-xs text-gray-400">加载配置...</div>;

  const fields = [
    { key: 'binlog_batch_size', label: 'Binlog Batch', desc: '增量事件批次' },
    { key: 'fetch_batch_size', label: 'Fetch Batch', desc: '全量拉取行数' },
    { key: 'flush_interval_ms', label: 'Flush (ms)', desc: '刷盘间隔' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in overflow-hidden">
      <div className="flex divide-x divide-gray-100">
        {fields.map((f) => (
          <div key={f.key} className="flex-1 p-3 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-1">
                 <div>
                    <div className="text-xs font-bold text-gray-700">{f.label}</div>
                    <div className="text-[10px] text-gray-400">{f.desc}</div>
                 </div>
                 {saving === f.key && <Save className="text-blue-500 animate-pulse" size={12} />}
            </div>
            <input 
                type="number" 
                className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none text-right"
                defaultValue={config[f.key as keyof PerformanceConfig]}
                onBlur={(e) => handleUpdate(f.key as keyof PerformanceConfig, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Settings View ---

const SettingsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-blue-600" size={20} />
            实例设置
            </h2>
            <p className="text-xs text-gray-400 mt-1 ml-7">集中管理运行参数。</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Source Config */}
        <section>
           <SectionHeader icon={HardDrive} title="源库配置" colorClass="bg-purple-100 text-purple-600" />
           <SourcePanel />
        </section>

        {/* 2. Advanced */}
        <section>
           <SectionHeader icon={Sliders} title="高级设置" colorClass="bg-gray-100 text-gray-600" />
           <AdvancedPanel />
        </section>

        {/* 3. Replication */}
        <section>
           <SectionHeader icon={Server} title="复制控制" colorClass="bg-blue-100 text-blue-600" />
           <ReplicationPanel />
        </section>

        {/* 4. Performance */}
        <section>
           <SectionHeader icon={Zap} title="性能配置" colorClass="bg-yellow-100 text-yellow-600" />
           <PerformancePanel />
        </section>
      </div>
    </div>
  );
};

export default SettingsView;