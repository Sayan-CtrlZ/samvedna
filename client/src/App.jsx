import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmergencyHelplines from './components/EmergencyHelplines';
import OfficialDashboard from './components/OfficialDashboard';
import VictimPortal from './components/VictimPortal';
import LiveAlertsBanner from './components/LiveAlertsBanner';
import EmergencySosModal from './components/EmergencySosModal';

export default function App() {
  const [activeView, setActiveView] = useState('AUTHORITY'); // 'AUTHORITY' | 'VICTIM'
  const [selectedVictimId, setSelectedVictimId] = useState('VIC-MH-2024-114');
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // Check health and load live alerts
  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/v1/alerts/feed');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setIsOnline(true);
      }
    } catch (e) {
      console.warn('Could not load alerts feed:', e);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 12000);
    return () => clearInterval(interval);
  }, []);

  // Handle alert acknowledgement & police dispatch
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const formData = new FormData();
      formData.append('alert_id', alertId);
      formData.append('officer_name', 'Superintendent of Police / Special Duty Magistrate');
      formData.append('action_taken', 'Dispatched Armed Police Picket & Relocation Team');

      const res = await fetch('/api/v1/alerts/acknowledge', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await loadAlerts();
      }
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  // When a victim check-in is submitted from the Victim Portal
  const handleCheckinSubmitted = (result) => {
    loadAlerts();
    if (result?.victim_id) {
      setSelectedVictimId(result.victim_id);
    }
  };

  const handleSelectVictim = (victimId) => {
    setSelectedVictimId(victimId);
    setActiveView('AUTHORITY');
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#eef2f7] p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header with Portal Navigation */}
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          onTriggerSos={() => setIsSosOpen(true)}
          isOnline={isOnline}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Live Police Priority Alerts Banner */}
        <LiveAlertsBanner
          alerts={alerts}
          onAcknowledge={handleAcknowledgeAlert}
          onSelectVictim={handleSelectVictim}
        />

        {/* Emergency Helplines Bar (NHAA 14566, 112, 14416, 15100) */}
        <EmergencyHelplines />

        {/* Dynamic Portal View */}
        <main className="mt-6">
          {activeView === 'AUTHORITY' ? (
            <OfficialDashboard
              selectedVictimId={selectedVictimId}
              onSelectVictim={setSelectedVictimId}
            />
          ) : (
            <VictimPortal
              activeVictimId={selectedVictimId}
              onCheckinSubmitted={handleCheckinSubmitted}
              onTriggerSos={() => setIsSosOpen(true)}
            />
          )}
        </main>

        {/* Emergency SOS Modal */}
        <EmergencySosModal
          isOpen={isSosOpen}
          onClose={() => {
            setIsSosOpen(false);
            loadAlerts();
          }}
        />

        {/* Authority Standard Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 py-4 border-t border-slate-200">
          <p className="font-semibold text-slate-600">
            SAMVEDNA AI • Dynamic Mental Health Monitoring and Distress Prediction System
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989 (Section 15A Witness Protection) • National Helpline Against Atrocities (14566)
          </p>
        </footer>
      </div>
    </div>
  );
}
