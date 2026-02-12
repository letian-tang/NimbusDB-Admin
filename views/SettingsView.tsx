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
    <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 animate-fade-in">
      <div className="space-y-4 mb-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">主机地址 (Host)</label>
          <input type="text" required value={formData.mysql_host || ''} onChange={(e) => handleChange('mysql_host', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">端口 (Port)</label>
          <input type="number" required value={formData.mysql_port || 3306} onChange={(e) => handleChange('mysql_port', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">Server ID</label>
          <input type="number" required value={formData.mysql_server_id || 0} onChange={(e) => handleChange('mysql_server_id', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">用户名</label>
          <input type="text" required value={formData.mysql_user || ''} onChange={(e) => handleChange('mysql_user', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div className="space-y-1.5 relative">
          <label className="block text-xs font-bold text-gray-700">密码</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} value={formData.mysql_password || ''} onChange={(e) => handleChange('mysql_password', e.target.value)} placeholder={config.mysql_password ? "********" : "未设置"} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none pr-9" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
        </div>
      </div>
      <div className="flex justify-start">
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-70">
          {saving ? <Save className="animate-spin" size={16} /> : <Save size={16} />} 保存配置
        </button>
      </div>
    </form>
  );
};

const AdvancedPanel: React.FC = () => {
  const [binlog, setBinlog] = useState<BinlogPosition | null>(null);
  const [includedDbs, setIncludedDbs] = useState<string>('');
  const [schemaSync, setSchemaSync] = useState<boolean>(true);
  const [newBinlogFile, setNewBinlogFile] = useState('');
  const [newBinlogPos, setNewBinlogPos] = useState(0);
  const [dbsInput, setDbsInput] = useState('');

  useEffect(() => {
    Promise.all([
      nimbusService.getBinlogPosition(), 
      nimbusService.getIncludedDbs(),
      nimbusService.getSchemaSync()
    ]).then(([b, d, s]) => {
      setBinlog(b);
      setNewBinlogFile(b.file);
      setNewBinlogPos(b.position);
      setIncludedDbs(d);
      setDbsInput(d);
      setSchemaSync(s);
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

  const handleSchemaSyncToggle = async () => {
    try {
      const newState = !schemaSync;
      await nimbusService.setSchemaSync(newState);
      setSchemaSync(newState);
    } catch (e) {
      console.error(e);
      alert("设置失败");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Schema Sync */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">表结构同步 (Schema Sync)</label>
            <p className="text-xs text-gray-400">控制是否同步建库、建表及注释等结构变更。</p>
        </div>
        <button 
            onClick={handleSchemaSyncToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${schemaSync ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${schemaSync ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Included DBs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">白名单数据库 (Included DBs)</label>
            <p className="text-xs text-gray-400 mb-3">仅复制指定的数据库，多个用逗号分隔。</p>
            <div className="flex gap-2 mb-2">
            <input type="text" value={dbsInput} onChange={(e) => setDbsInput(e.target.value)} placeholder="db1,db2 (留空为全部)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
            <button onClick={handleDbsSave} className="bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 whitespace-nowrap">更新</button>
            </div>
        </div>
        <div className="text-[10px] text-gray-400 mt-2">当前生效: <span className="font-mono text-gray-600">{includedDbs || 'ALL'}</span></div>
      </div>

      {/* Binlog Danger Zone */}
      <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-5 relative">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-red-800 font-bold text-sm">
                <AlertTriangle size={16} /> Binlog 位点覆写
            </div>
            <div className="text-xs text-red-600/70 font-mono">
                {binlog?.file}:{binlog?.position}
            </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <input type="text" placeholder="File (e.g. mysql-bin.000001)" value={newBinlogFile} onChange={(e) => setNewBinlogFile(e.target.value)} className="col-span-6 px-3 py-2 border border-red-200 rounded text-xs font-mono focus:border-red-400 outline-none" />
          <input type="number" placeholder="Pos" value={newBinlogPos} onChange={(e) => setNewBinlogPos(parseInt(e.target.value))} className="col-span-3 px-3 py-2 border border-red-200 rounded text-xs font-mono focus:border-red-400 outline-none" />
          <button onClick={handleBinlogSave} className="col-span-3 bg-red-600 text-white px-2 py-2 rounded text-xs hover:bg-red-700 whitespace-nowrap">强制设置</button>
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
      <div className={`border rounded-lg p-5 shadow-sm flex items-center justify-between transition-colors ${active ? bgClass : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
             <div className={`p-3 rounded-lg ${active ? colorClass : 'bg-gray-100 text-gray-400'}`}>
                <Icon size={20} />
             </div>
             <div>
                 <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${running === RunningState.Running ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {running === RunningState.Running ? 'RUNNING' : 'STOPPED'}
                    </span>
                 </div>
             </div>
        </div>
        <button
            onClick={onToggle}
            disabled={!!actionLoading}
            className={`px-4 py-2 rounded text-xs font-bold border transition-all flex items-center gap-1.5 ${
                active 
                ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                : 'bg-blue-600 border-transparent text-white hover:bg-blue-700'
            }`}
        >
            {actionLoading === loadingKey ? <RefreshCw className="animate-spin" size={14} /> : active ? <><Pause size={14} /> 停止</> : <><Play size={14} /> 启动</>}
        </button>
      </div>
  );

  return (
    <div className="space-y-4 animate-fade-in relative">
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
  const [formData, setFormData] = useState<Partial<PerformanceConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    nimbusService.getPerformanceConfig().then(data => {
      setConfig(data);
      setFormData(data);
    });
  }, []);

  const handleChange = (key: keyof PerformanceConfig, valStr: string) => {
    const val = parseInt(valStr, 10);
    // Allow empty string for better UX while typing, but update state
    setFormData(prev => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
        const promises = [];
        if (formData.binlog_batch_size !== undefined && formData.binlog_batch_size !== config.binlog_batch_size) {
            promises.push(nimbusService.updatePerformanceConfig('binlog_batch_size', formData.binlog_batch_size));
        }
        if (formData.fetch_batch_size !== undefined && formData.fetch_batch_size !== config.fetch_batch_size) {
            promises.push(nimbusService.updatePerformanceConfig('fetch_batch_size', formData.fetch_batch_size));
        }
        if (formData.flush_interval_ms !== undefined && formData.flush_interval_ms !== config.flush_interval_ms) {
            promises.push(nimbusService.updatePerformanceConfig('flush_interval_ms', formData.flush_interval_ms));
        }
        
        await Promise.all(promises);
        
        const newConfig = await nimbusService.getPerformanceConfig();
        setConfig(newConfig);
        setFormData(newConfig);
    } finally {
        setSaving(false);
    }
  };

  if (!config) return <div className="p-4 text-center text-xs text-gray-400">加载配置...</div>;

  const fields = [
    { key: 'binlog_batch_size', label: 'Binlog Batch Size', desc: '增量复制单次处理事件数 (推荐: 1000-5000)' },
    { key: 'fetch_batch_size', label: 'Fetch Batch Size', desc: '全量拉取单次获取行数 (推荐: 10000+)' },
    { key: 'flush_interval_ms', label: 'Flush Interval (ms)', desc: '数据刷盘间隔，越低越安全但影响性能' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in overflow-hidden">
      <div className="divide-y divide-gray-100">
        {fields.map((f) => (
          <div key={f.key} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div>
                 <div className="text-sm font-bold text-gray-800">{f.label}</div>
                 <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
            </div>
            <div className="w-40 relative">
                <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none text-right"
                    value={formData[f.key as keyof PerformanceConfig] ?? ''}
                    onChange={(e) => handleChange(f.key as keyof PerformanceConfig, e.target.value)}
                />
            </div>
          </div>
        ))}
      </div>
       <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-70"
        >
          {saving ? <Save className="animate-spin" size={16} /> : <Save size={16} />} 保存性能配置
        </button>
      </div>
    </div>
  );
};

// --- Main Settings View ---

const SettingsView: React.FC = () => {
  return (
    <div className="w-full pb-10">
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
           <SectionHeader icon={Sliders} title="同步范围与位点" colorClass="bg-gray-100 text-gray-600" />
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