import React, { useEffect, useState } from 'react';
import { Save, HardDrive, Eye, EyeOff } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { MySqlSourceConfig } from '../types';

const SourceConfigView: React.FC = () => {
  const [config, setConfig] = useState<MySqlSourceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<MySqlSourceConfig>>({});

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await nimbusService.getSourceConfig();
      setConfig(data);
      setFormData(data);
      setLoading(false);
    };
    fetch();
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

  if (loading || !config) return <div className="p-8 text-center text-gray-500">正在加载源库配置...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <HardDrive className="text-blue-500" size={24} />
          MySQL 源库配置
        </h2>
        <p className="text-gray-500 text-sm mt-1">配置上游 MySQL 数据库连接详情。</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">主机地址 (Host)</label>
            <input 
              type="text" 
              required
              value={formData.mysql_host || ''}
              onChange={(e) => handleChange('mysql_host', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="col-span-1 space-y-2">
            <label className="block text-sm font-medium text-gray-700">端口 (Port)</label>
            <input 
              type="number" 
              required
              value={formData.mysql_port || 3306}
              onChange={(e) => handleChange('mysql_port', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">用户名 (Username)</label>
            <input 
              type="text" 
              required
              value={formData.mysql_user || ''}
              onChange={(e) => handleChange('mysql_user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-2 relative">
            <label className="block text-sm font-medium text-gray-700">密码 (Password)</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"}
                value={formData.mysql_password || ''}
                onChange={(e) => handleChange('mysql_password', e.target.value)}
                placeholder={config.mysql_password ? "********" : "未设置密码"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Server ID</label>
          <input 
            type="number" 
            required
            value={formData.mysql_server_id || 0}
            onChange={(e) => handleChange('mysql_server_id', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500">在复制组内必须唯一。</p>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {saving ? <Save className="animate-spin" size={18} /> : <Save size={18} />}
            保存配置
          </button>
        </div>
      </form>
    </div>
  );
};

export default SourceConfigView;