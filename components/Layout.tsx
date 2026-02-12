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
      {/* Sidebar - Changed to White Theme */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative z-20">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-md shadow-blue-100">N</span>
            <div>
              <h1 className="text-lg font-extrabold text-gray-800 leading-none tracking-tight">NimbusDB</h1>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Admin Tool</span>
            </div>
          </div>

          {/* Connection Switcher */}
          <div className="relative">
            <button 
              onClick={() => setCurrentView('connections')}
              className="w-full bg-white hover:bg-gray-50 transition-colors rounded-lg p-2.5 flex items-center justify-between border border-gray-200 shadow-sm group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeConn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs text-gray-400 font-medium">当前实例</span>
                  <span className="text-sm font-bold text-gray-700 truncate w-full text-left">
                    {activeConn ? activeConn.name : '未连接'}
                  </span>
                </div>
              </div>
              <ChevronsUpDown size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
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
                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                        : isDisabled 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-blue-600" : ""} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {!activeConn && (
            <div className="px-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 text-center mb-3">
                  请先连接一个 NimbusDB 实例以使用管理功能。
                </p>
                <button 
                  onClick={() => setCurrentView('connections')}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-blue-600 text-xs font-bold rounded border border-gray-200 shadow-sm flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus size={12} /> 去连接
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
          <div className="flex items-center gap-3 px-2 mb-2">
             <div className="bg-white border border-gray-200 p-1.5 rounded-full text-gray-500">
               <User size={16} />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-bold text-gray-700 truncate">{currentUser?.username || 'Admin'}</div>
             </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 w-full px-2 py-1.5 rounded hover:bg-white transition-colors border border-transparent hover:border-gray-100 hover:shadow-sm"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between z-10">
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
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