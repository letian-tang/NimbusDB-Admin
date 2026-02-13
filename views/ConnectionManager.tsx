import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, Database, Edit2, Check, X } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { NimbusConnection } from '../types';
import { useConfirm } from '../components/ConfirmDialog';

interface ConnectionManagerProps {
  onConnect: () => void;
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({ onConnect }) => {
  const [connections, setConnections] = useState<NimbusConnection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const confirm = useConfirm();

  // Form State
  const [formData, setFormData] = useState<Partial<NimbusConnection>>({
    host: '127.0.0.1',
    port: 3306,
    username: 'root'
  });

  const loadData = async () => {
    try {
      const conns = await nimbusService.getConnections();
      setConnections(conns);
      setActiveId(nimbusService.getActiveId());
    } catch (e) {
      console.error("Failed to load connections", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (conn?: NimbusConnection) => {
    if (conn) {
      setFormData(conn);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        name: 'New NimbusDB',
        host: '127.0.0.1',
        port: 3306,
        username: 'root',
        password: '',
        created_at: Date.now()
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (formData.id && formData.name && formData.host) {
      try {
        await nimbusService.saveConnection(formData as NimbusConnection);
        setIsEditing(false);
        loadData();
      } catch (e) {
        alert("保存失败: " + e);
      }
    }
  };

  const handleDelete = async (conn: NimbusConnection) => {
    const isConfirmed = await confirm({
      title: '删除连接',
      message: `确定要删除连接 "${conn.name}" 吗？此操作无法撤销。`,
      confirmText: '删除',
      variant: 'danger'
    });

    if (isConfirmed) {
      try {
        await nimbusService.deleteConnection(conn.id);
        loadData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    try {
      await nimbusService.setActiveId(id);
      setActiveId(id);
      onConnect(); // Redirect to dashboard
    } catch (e) {
      alert("连接失败，请检查配置或网络。\n" + e);
    } finally {
      setConnectingId(null);
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          {formData.created_at ? '编辑连接' : '新建连接'}
        </h2>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">连接名称 (Alias)</label>
            <input 
              type="text" 
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="例如: 生产环境 DB"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">主机 (Host)</label>
              <input 
                type="text" 
                value={formData.host || ''}
                onChange={e => setFormData({...formData, host: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">端口 (Port)</label>
              <input 
                type="number" 
                value={formData.port || ''}
                onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input 
                type="text" 
                value={formData.username || ''}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input 
                type="password" 
                value={formData.password || ''}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="可选"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Check size={18} /> 保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            连接管理
          </h2>
          <p className="text-gray-500 text-sm mt-1">管理多个 NimbusDB 实例连接信息。</p>
        </div>
        <button 
          onClick={() => handleEdit()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> 新建连接
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map(conn => {
          const isActive = activeId === conn.id;
          const isConnecting = connectingId === conn.id;

          return (
            <div key={conn.id} className={`group bg-white rounded-xl border transition-all hover:shadow-md relative overflow-hidden ${isActive ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'}`}>
              {isActive && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                  ACTIVE
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <Database size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(conn)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(conn)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{conn.name}</h3>
                <div className="text-sm text-gray-500 font-mono mb-4">
                  {conn.username}@{conn.host}:{conn.port}
                </div>

                <button
                  onClick={() => !isActive && handleConnect(conn.id)}
                  disabled={isActive || !!connectingId}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                    isActive 
                      ? 'bg-green-50 text-green-700 cursor-default' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isConnecting ? (
                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : isActive ? (
                    <> <Check size={16} /> 已连接 </>
                  ) : (
                    <> <Power size={16} /> 连接实例 </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {connections.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Database size={48} className="mb-4 text-gray-300" />
            <p className="font-medium">暂无连接信息</p>
            <p className="text-sm mb-4">请创建一个新的 NimbusDB 连接以开始使用。</p>
            <button 
              onClick={() => handleEdit()}
              className="text-blue-600 font-medium hover:underline"
            >
              立即创建
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionManager;