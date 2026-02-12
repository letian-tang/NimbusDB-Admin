import React, { useEffect, useState } from 'react';
import { User, Shield, Edit, Trash2, Plus, X, Lock } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { User as UserType } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadUsers();
    setCurrentUser(nimbusService.getCurrentUser());
  }, []);

  const loadUsers = async () => {
    try {
      const list = await nimbusService.getUsers();
      setUsers(list);
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditId(null);
    setUsername('');
    setPassword('');
    setMsg({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserType) => {
    setModalMode('edit');
    setEditId(user.id);
    setUsername(user.username);
    setPassword(''); // Don't show old password
    setMsg({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (user: UserType) => {
    if (!confirm(`确定要删除用户 "${user.username}" 吗？此操作无法撤销。`)) return;
    
    setLoading(true);
    try {
      await nimbusService.deleteUser(user.id);
      setMsg({ type: 'success', text: '用户已删除' });
      await loadUsers();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      if (modalMode === 'create') {
        await nimbusService.createUser(username, password);
        setMsg({ type: 'success', text: '用户创建成功' });
      } else {
        if (!editId) return;
        // For edit, only send password if it's not empty
        await nimbusService.updateUser(editId, username, password || undefined);
        setMsg({ type: 'success', text: '用户信息已更新' });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (e: any) {
      // Show error in the main view or alert
      alert(e.message); 
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  return (
    <div className="w-full max-w-6xl space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-blue-600" size={24} />
            用户管理
          </h2>
          <p className="text-gray-500 text-sm mt-1">管理系统访问权限与登录凭证。</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} /> 新增用户
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm animate-fade-in ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
          <button onClick={() => setMsg({ type: '', text: '' })} className="ml-auto font-bold">×</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 font-semibold text-gray-600">用户名</th>
              <th className="px-6 py-4 font-semibold text-gray-600">创建时间</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{u.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full">
                      <User size={14} />
                    </div>
                    <span className="font-medium text-gray-900">{u.username}</span>
                    {currentUser?.id === u.id && (
                       <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">当前</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDate(u.created_at)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(u)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="编辑用户"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(u)}
                      disabled={users.length <= 1} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="删除用户"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">暂无用户数据</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {modalMode === 'create' ? <Plus size={18} /> : <Edit size={18} />}
                {modalMode === 'create' ? '新增用户' : '编辑用户'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalMode === 'create' ? '密码' : '新密码 (留空则不修改)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={modalMode === 'create' ? "设置密码" : "修改密码"}
                    required={modalMode === 'create'}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {modalMode === 'create' ? '创建' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;