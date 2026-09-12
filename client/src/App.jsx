import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmergencyHelplines from './components/EmergencyHelplines';
import OfficialDashboard from './components/OfficialDashboard';
import CounsellorWorkbench from './components/CounsellorWorkbench';
import AnalyticsView from './components/AnalyticsView';
import VictimPortal from './components/VictimPortal';
import LiveAlertsBanner from './components/LiveAlertsBanner';
import AlertsDrawer from './components/AlertsDrawer';
import EmergencySosModal from './components/EmergencySosModal';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem('samvedna_active_tab');
      const validTabs = ['VICTIM', 'TRIAGE', 'COUNSELLOR', 'ANALYTICS'];
      return (saved && validTabs.includes(saved)) ? saved : 'VICTIM';
    } catch (e) {
      return 'VICTIM';
    }
  });
  const [selectedVictimId, setSelectedVictimId] = useState(() => {
    try {
      const saved = sessionStorage.getItem('samvedna_selected_victim');
      return (saved && typeof saved === 'string' && saved.startsWith('VIC-')) ? saved : 'VIC-MH-2024-114';
    } catch (e) {
      return 'VIC-MH-2024-114';
    }
  });
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [cases, setCases] = useState([]);

  useEffect(() => {
    sessionStorage.setItem('samvedna_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('samvedna_selected_victim', selectedVictimId);
  }, [selectedVictimId]);

  // Fetch metrics, cases, and alerts
  const loadDashboardData = async () => {
    try {
      const [resMetrics, resCases, resAlerts] = await Promise.all([
        fetch('/api/v1/dashboard/metrics'),
        fetch('/api/v1/dashboard/cases'),
        fetch('/api/v1/alerts/feed')
      ]);

      if (resMetrics.ok) {
        setMetrics(await resMetrics.json());
      }
      if (resCases.ok) {
        const data = await resCases.json();
        setCases(data.cases || []);
      }
      if (resAlerts.ok) {
        const data = await resAlerts.json();
        setAlerts(data.alerts || []);
        setIsOnline(true);
      }
    } catch (e) {
      console.warn('Network sync warning:', e);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle alert dispatching
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const formData = new FormData();
      formData.append('alert_id', alertId);
      formData.append('officer_name', 'Superintendent of Police / Special Duty Magistrate');
      formData.append('action_taken', 'Dispatched Armed Police Picket under Section 15A');

      const res = await fetch('/api/v1/alerts/acknowledge', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const handleSelectVictim = (victimId) => {
    setSelectedVictimId(victimId);
    setActiveTab('TRIAGE');
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Material Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerSos={() => setIsSosOpen(true)}
        isOnline={isOnline}
        activeAlertsCount={activeAlertsCount}
        onToggleAlertsDrawer={() => setIsAlertsDrawerOpen(true)}
      />

      {/* Main Full-Width Application Body */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-5 flex-1 space-y-4">
        {/* Live Police Priority Alerts Banner (For Official & Clinical Tabs) */}
        {(activeTab === 'TRIAGE' || activeTab === 'COUNSELLOR') && (
          <LiveAlertsBanner
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onSelectVictim={handleSelectVictim}
          />
        )}

        {/* Emergency Hotlines Strip (Only on Normal User / Survivor Intake Tab) */}
        {activeTab === 'VICTIM' && <EmergencyHelplines />}

        {/* Tab 1: Survivor Voice Check-in Portal (Front / Default View) */}
        {activeTab === 'VICTIM' && (
          <main>
            <VictimPortal
              cases={cases}
              activeVictimId={selectedVictimId}
              onCheckinSubmitted={() => {
                loadDashboardData();
              }}
              onTriggerSos={() => setIsSosOpen(true)}
            />
          </main>
        )}

        {/* Tab 2: District Police & Magistrate Triage */}
        {activeTab === 'TRIAGE' && (
          <main>
            <OfficialDashboard
              selectedVictimId={selectedVictimId}
              onSelectVictim={setSelectedVictimId}
            />
          </main>
        )}

        {/* Tab 3: Counsellor Clinical Workbench & Longitudinal Tracking */}
        {activeTab === 'COUNSELLOR' && (
          <main>
            <CounsellorWorkbench
              cases={cases}
              selectedVictimId={selectedVictimId}
              onSelectVictim={setSelectedVictimId}
            />
          </main>
        )}

        {/* Tab 4: National Policy & Distress Analytics */}
        {activeTab === 'ANALYTICS' && (
          <main>
            <AnalyticsView
              metrics={metrics}
              cases={cases}
            />
          </main>
        )}
      </div>

      {/* Right Slide-over Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSelectVictim={handleSelectVictim}
      />

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        isOpen={isSosOpen}
        onClose={() => {
          setIsSosOpen(false);
          loadDashboardData();
        }}
      />

      {/* Enterprise Government Footer */}
      <footer className="mt-8 bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            SAMVEDNA AI • National Helpline Against Atrocities (14566) • Section 15A Witness Protection System
          </p>
          <p className="text-[11px] text-slate-400">
            Scheduled Castes & Scheduled Tribes (Prevention of Atrocities) Act, 1989 • Data Encrypted & Confidential
          </p>
        </div>
      </footer>
    </div>
  );
}
