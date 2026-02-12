import React, { useEffect, useState } from 'react';
import { ViewState, NimbusConnection } from '../types';
import { Activity, Database, Settings, ChevronsUpDown, Plus, LogOut, User, Shield } from 'lucide-react';
import { nimbusService } from '../services/nimbusService';

interface LayoutProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const [activeConn, setActiveConn] = useState<NimbusConnection | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState(nimbusService.getCurrentUser());

  const checkConnection = async () => {
    const id = nimbusService.getActiveId();
    if (id) {
      try {
        const conns = await nimbusService.getConnections();
        const found = conns.find(c => c.id === id);
        setActiveConn(found);
      } catch (e) {
        // ignore
      }
    } else {
      setActiveConn(undefined);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [currentView]);

  const navItems = [
    { id: 'dashboard', label: '概览', icon: Activity, requireConnection: true },
    { id: 'sql', label: 'SQL 编辑器', icon: Database, requireConnection: true },
    { id: 'users', label: '用户管理', icon: Shield, requireConnection: false },
    { id: 'settings', label: '实例设置', icon: Settings, requireConnection: true },
  ];

  const handleSwitchView = (id: string) => {
    setCurrentView(id as ViewState);
  };

  const handleLogout = () => {
    nimbusService.logout();
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 relative z-20 shadow-xl">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-900/20">N</span>
            <div>
              <h1 className="text-lg font-bold leading-none">NimbusDB</h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Admin Tool</span>
            </div>
          </div>

          {/* Connection Switcher */}
          <div className="relative">
            <button 
              onClick={() => setCurrentView('connections')}
              className="w-full bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg p-2.5 flex items-center justify-between border border-slate-700 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeConn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs text-slate-400 font-medium">当前实例</span>
                  <span className="text-sm font-semibold truncate w-full text-left">
                    {activeConn ? activeConn.name : '未连接'}
                  </span>
                </div>
              </div>
              <ChevronsUpDown size={16} className="text-slate-500 group-hover:text-slate-300" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              // Disable if connection is required but not active
              const isDisabled = item.requireConnection && !activeConn;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => !isDisabled && handleSwitchView(item.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : isDisabled 
                          ? 'text-slate-600 cursor-not-allowed opacity-50' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {!activeConn && (
            <div className="px-6 mt-4">
              <p className="text-xs text-slate-500 text-center">
                请先连接一个 NimbusDB 实例以使用管理功能。
              </p>
              <button 
                onClick={() => setCurrentView('connections')}
                className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs rounded border border-slate-700 flex items-center justify-center gap-1"
              >
                <Plus size={12} /> 去连接
              </button>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-2">
          <div className="flex items-center gap-3 px-2 mb-2">
             <div className="bg-slate-700 p-1.5 rounded-full text-slate-300">
               <User size={16} />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-medium text-white truncate">{currentUser?.username || 'Admin'}</div>
             </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 w-full px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-xl font-bold text-gray-800 capitalize flex items-center gap-2">
            {currentView === 'connections' 
              ? '连接管理' 
              : navItems.find(n => n.id === currentView)?.label || '设置'}
          </h2>
          <div className="flex items-center gap-4">
            {activeConn ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {activeConn.host}:{activeConn.port}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                未连接
              </div>
            )}
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;