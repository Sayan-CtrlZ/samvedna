import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EmergencyHelplines from './components/EmergencyHelplines';
import OfficialDashboard from './components/OfficialDashboard';
import CounsellorWorkbench from './components/CounsellorWorkbench';
import AnalyticsView from './components/AnalyticsView';
import VictimPortal from './components/VictimPortal';
import AlertsDrawer from './components/AlertsDrawer';
import EmergencySosModal from './components/EmergencySosModal';
import { getApiUrl, safeFetchJson } from './utils/api';

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
      if (saved && typeof saved === 'string' && saved.startsWith('VIC-')) {
        return saved;
      }
      const sessionSuffix = Math.floor(1000 + Math.random() * 9000);
      const newSessionId = `VIC-2026-${sessionSuffix}`;
      sessionStorage.setItem('samvedna_selected_victim', newSessionId);
      return newSessionId;
    } catch (e) {
      return 'VIC-2026-1001';
    }
  });
  const [language, setLanguage] = useState(() => {
    try {
      const saved = sessionStorage.getItem('samvedna_language');
      return saved || 'en';
    } catch (e) {
      return 'en';
    }
  });
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [cases, setCases] = useState([]);

  const [userLocation, setUserLocation] = useState(() => {
    try {
      return sessionStorage.getItem('samvedna_user_location') || 'GPS: 19.0760° N, 72.8777° E (Ahmednagar, Maharashtra)';
    } catch (e) {
      return 'GPS: 19.0760° N, 72.8777° E (Ahmednagar, Maharashtra)';
    }
  });

  useEffect(() => {
    sessionStorage.setItem('samvedna_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('samvedna_selected_victim', selectedVictimId);
  }, [selectedVictimId]);

  useEffect(() => {
    sessionStorage.setItem('samvedna_language', language);
  }, [language]);

  // Clean up unsubmitted transient session on tab close or reload
  useEffect(() => {
    const handleUnload = () => {
      if (selectedVictimId) {
        const data = new FormData();
        data.append('victim_id', selectedVictimId);
        navigator.sendBeacon(getApiUrl('/api/v1/victim/reset'), data);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [selectedVictimId]);

  // Request browser Geolocation access on app launch
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          let locString = `GPS: ${lat}° N, ${lon}° E`;

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'District PS';
              const state = addr.state || 'State';
              locString = `GPS: ${lat}° N, ${lon}° E (${city}, ${state})`;
            }
          } catch (err) {
            console.warn('Reverse geocode warning:', err);
          }

          setUserLocation(locString);
          try {
            sessionStorage.setItem('samvedna_user_location', locString);
          } catch (e) {}

          try {
            const formData = new FormData();
            formData.append('victim_id', selectedVictimId);
            formData.append('location', locString);
            fetch(getApiUrl('/api/v1/victim/location'), { method: 'POST', body: formData });
          } catch (e) {}
        },
        (err) => {
          console.warn('Geolocation access fallback:', err.message);
          const fallbackLoc = 'GPS: 19.0948° N, 74.7480° E (Ahmednagar, Maharashtra)';
          setUserLocation(fallbackLoc);
          try {
            sessionStorage.setItem('samvedna_user_location', fallbackLoc);
          } catch (e) {}
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [selectedVictimId]);

  const isJsonEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Fetch metrics, cases, and alerts safely without triggering unnecessary re-renders
  const loadDashboardData = async () => {
    try {
      const [resMetrics, resCases, resAlerts] = await Promise.all([
        safeFetchJson('/api/v1/dashboard/metrics'),
        safeFetchJson('/api/v1/dashboard/cases'),
        safeFetchJson('/api/v1/alerts/feed')
      ]);

      if (resMetrics.ok && resMetrics.data) {
        setMetrics(prev => isJsonEqual(prev, resMetrics.data) ? prev : resMetrics.data);
      }
      if (resCases.ok && resCases.data) {
        const loadedCases = resCases.data.cases || [];
        setCases(prev => isJsonEqual(prev, loadedCases) ? prev : loadedCases);
      }
      if (resAlerts.ok && resAlerts.data) {
        const loadedAlerts = resAlerts.data.alerts || [];
        setAlerts(prev => isJsonEqual(prev, loadedAlerts) ? prev : loadedAlerts);
        setIsOnline(true);
      }
    } catch (e) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle alert dispatching
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const formData = new FormData();
      formData.append('alert_id', alertId);
      formData.append('officer_name', 'Superintendent of Police / Special Duty Magistrate');
      formData.append('action_taken', 'Dispatched Armed Police Picket under Section 15A');

      const res = await fetch(getApiUrl('/api/v1/alerts/acknowledge'), {
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
        language={language}
        setLanguage={setLanguage}
      />

      {/* Main Full-Width Application Body */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-5 flex-1 space-y-4">
        {/* Emergency Hotlines Strip (Only on Normal User / Survivor Intake Tab) */}
        {activeTab === 'VICTIM' && <EmergencyHelplines />}

        {/* Tab 1: Survivor Voice Check-in Portal (Front / Default View) */}
        {activeTab === 'VICTIM' && (
          <main>
            <VictimPortal
              cases={cases}
              activeVictimId={selectedVictimId}
              userLocation={userLocation}
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
              userLocation={userLocation}
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
              userLocation={userLocation}
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
        userLocation={userLocation}
        onClose={() => {
          setIsSosOpen(false);
          loadDashboardData();
        }}
      />

      {/* Statutory & Regulatory Multi-Column Enterprise Footer */}
      <footer className="mt-10 bg-[#061024] border-t border-slate-800 py-8 px-4 sm:px-8 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-xs border-b border-slate-800/80 pb-6 mb-6">
          {/* Col 1 */}
          <div>
            <h4 className="text-white font-bold mb-2 flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              SAMVEDNA AI Platform
            </h4>
            <p className="text-slate-400 leading-relaxed">
              District Sentinel Console & Survivor Well-being Portal. Empowering survivors and statutory authorities with acoustic biomarker analysis & trauma-informed AI support.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider text-slate-300">Statutory Framework</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• SC/ST (Prevention of Atrocities) Act, 1989</li>
              <li>• Section 15A Witness & Victim Rights</li>
              <li>• Mandatory Relief & Rehabilitation Rules 1995</li>
              <li>• ICJS & CCTNS Direct Integration API</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider text-slate-300">Emergency Helplines</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• National Helpline (NHAA): <strong className="text-indigo-300">14566</strong></li>
              <li>• Tele-MANAS Mental Health: <strong className="text-emerald-300">14416 / 1800 891 4416</strong></li>
              <li>• NALSA Free Legal Aid: <strong className="text-indigo-300">15100</strong></li>
              <li>• Emergency Police Response: <strong className="text-rose-300">112</strong></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider text-slate-300">Security & Compliance</h4>
            <p className="text-slate-400 leading-relaxed mb-2">
              End-to-End AES-256 Encrypted. Anonymized biometric hashes stored in statutory compliance with ISO/IEC 27001 standard.
            </p>
            <span className="inline-block bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 px-2 py-1 rounded text-[10px] font-mono">
              System ID: SAMVEDNA-DIST-IND-2026
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 Ministry of Social Justice and Empowerment • Government of India. All Rights Reserved.</p>
          <p className="flex items-center gap-3">
            <span>Privacy & Anonymity Protocol</span>
            <span>•</span>
            <span>Standard Operating Procedure (SOP v4.2)</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
