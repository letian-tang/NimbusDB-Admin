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
import { ViewState } from './types';
import { nimbusService } from './services/nimbusService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // On load, verify we have an active connection.
    // If not, force user to connection manager.
    const checkInit = async () => {
      const activeId = nimbusService.getActiveId();
      if (!activeId) {
        setCurrentView('connections');
      } else {
        // Optional: Validate if the ID still exists in DB?
        // For speed, we just assume it's valid until a query fails.
      }
      setIsReady(true);
    };
    checkInit();
  }, []);

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
      default:
        return <Dashboard />;
    }
  };

  if (!isReady) return null;

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;