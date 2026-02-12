import React, { useEffect, useState } from 'react';
import { User, Shield, Key, Plus, Save } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';
import { User as UserType } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Create User State
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  
  // Change Password State
  const [changePassValue, setChangePassValue] = useState('');
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await nimbusService.createUser(newUser, newPass);
      setMsg({ type: 'success', text: '用户创建成功' });
      setNewUser('');
      setNewPass('');
      loadUsers();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If targetUserId is set (and valid), change that user's password, else change own
      // Our API supports targetUserId
      await nimbusService.changePassword(changePassValue, targetUserId || undefined);
      setMsg({ type: 'success', text: '密码修改成功' });
      setChangePassValue('');
      setTargetUserId(null);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600" size={24} />
          用户与安全
        </h2>
        <p className="text-gray-500 text-sm mt-1">管理系统访问权限与登录凭证。</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
          <button onClick={() => setMsg({ type: '', text: '' })} className="ml-auto font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* User List */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700">
               用户列表
             </div>
             <ul className="divide-y divide-gray-100">
               {users.map(u => (
                 <li key={u.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.username}</div>
                        <div className="text-xs text-gray-500">创建于 {formatDate(u.created_at)}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setTargetUserId(u.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      重置密码
                    </button>
                 </li>
               ))}
             </ul>
          </div>

          {/* Create User Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} /> 创建新用户
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">用户名</label>
                <input 
                  type="text" 
                  value={newUser}
                  onChange={e => setNewUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">初始密码</label>
                <input 
                  type="password" 
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <button disabled={loading} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-800">
                创建用户
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
           <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
             <Key size={18} /> 
             {targetUserId ? `重置密码 (User ID: ${targetUserId})` : '修改我的密码'}
           </h3>
           <form onSubmit={handleChangePassword} className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">新密码</label>
               <input 
                 type="password" 
                 value={changePassValue}
                 onChange={e => setChangePassValue(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                 required
                 placeholder="输入新密码"
               />
             </div>
             <div className="flex gap-2">
               {targetUserId && (
                 <button 
                  type="button"
                  onClick={() => setTargetUserId(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm"
                 >
                   取消重置
                 </button>
               )}
               <button disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 flex justify-center items-center gap-2">
                 <Save size={16} /> 保存修改
               </button>
             </div>
             
             {!targetUserId && (
               <p className="text-xs text-gray-400 mt-2">
                 输入新密码以修改当前登录账户 ({currentUser?.username}) 的密码。
               </p>
             )}
           </form>
        </div>

      </div>
    </div>
  );
};

export default UserManagement;
