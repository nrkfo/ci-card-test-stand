import React, { useEffect } from 'react';
import { useTestStore } from './store/useTestStore';
import { Header } from './components/Header';
import { ScannerTestTrigger } from './components/ScannerTestTrigger';
import { LiveProcessSteps } from './components/LiveProcessSteps';
import { RecentTestsTable } from './components/RecentTestsTable';
import { LogViewerModal } from './components/LogViewerModal';

export const App: React.FC = () => {
  const { fetchAdbStatus, fetchRecentTests } = useTestStore();

  useEffect(() => {
    fetchAdbStatus();
    fetchRecentTests();

    // Check ADB connection status every 2.5 seconds for instant USB & network detection
    const interval = setInterval(() => {
      fetchAdbStatus();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchAdbStatus, fetchRecentTests]);

  return (
    <div className="app-container">
      {/* Header */}
      <Header />

      {/* Main Workstation: IP Connect + Barcode + Live Diagnostics */}
      <div className="dashboard-grid">
        <ScannerTestTrigger />
        <LiveProcessSteps />
      </div>

      {/* Test History with IP address and Model */}
      <RecentTestsTable />

      {/* Detailed ADB Diagnostic Log Viewer Modal */}
      <LogViewerModal />
    </div>
  );
};

export default App;
