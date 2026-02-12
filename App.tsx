'use client';

import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import SqlEditor from './views/SqlEditor';
import ReplicationControl from './views/ReplicationControl';
import PerformanceConfigView from './views/PerformanceConfigView';
import SourceConfigView from './views/SourceConfigView';
import AdvancedView from './views/AdvancedView';
import ConnectionManager from './views/ConnectionManager';
import LoginView from './views/LoginView';
import UserManagement from './views/UserManagement';
import { ViewState } from './types';
import { nimbusService } from './services/nimbusService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Check Auth
    if (!nimbusService.isLoggedIn()) {
      setIsAuthenticated(false);
      setIsReady(true);
      return;
    }
    setIsAuthenticated(true);

    // 2. Check Active Connection
    const checkInit = async () => {
      const activeId = nimbusService.getActiveId();
      if (!activeId) {
        setCurrentView('connections');
      }
      setIsReady(true);
    };
    checkInit();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const activeId = nimbusService.getActiveId();
    if (!activeId) {
      setCurrentView('connections');
    } else {
      setCurrentView('dashboard');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'sql':
        return <SqlEditor />;
      case 'replication':
        return <ReplicationControl />;
      case 'performance':
        return <PerformanceConfigView />;
      case 'source':
        return <SourceConfigView />;
      case 'advanced':
        return <AdvancedView />;
      case 'connections':
        return <ConnectionManager onConnect={() => setCurrentView('dashboard')} />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  if (!isReady) return null;

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
