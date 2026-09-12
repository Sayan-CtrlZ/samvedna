import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Stethoscope,
  BarChart3,
  Mic,
  Bell,
  Scale,
  Building2,
  CheckCircle2,
  Globe
} from 'lucide-react';

export default function Header({
  activeTab = 'VICTIM',
  setActiveTab,
  onTriggerSos,
  isOnline = true,
  activeAlertsCount = 0,
  onToggleAlertsDrawer,
  language = 'en',
  setLanguage
}) {
  const tabs = [
    { id: 'VICTIM', label: 'Survivor Intake & Check-in', icon: Mic },
    { id: 'TRIAGE', label: 'District Police Triage', icon: LayoutDashboard },
    { id: 'COUNSELLOR', label: 'Clinical Dossier', icon: Stethoscope },
    { id: 'ANALYTICS', label: 'Statutory Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a1b3b] border-b border-[#1e3a8a]/50 text-white shadow-md backdrop-blur-md">
      {/* Top Ministerial Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-1 bg-[#061024] border-b border-white/10 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-200">
            Ministry of Social Justice and Empowerment • Government of India
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-indigo-300">
            National Helpline Against Atrocities (NHAA 14566)
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            CCTNS & ICJS Synchronized
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-300">
            Sec 15A Witness Protection System
          </span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Portal Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0 shadow-inner">
            <Scale className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>SAMVEDNA</span>
                <span className="text-indigo-300 font-normal text-xs">संवेदना</span>
              </h1>
              <span className="hidden xl:inline-flex px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50 text-[10px] font-mono text-indigo-200 uppercase">
                District Sentinel Console
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden md:block font-normal truncate">
              Dynamic Distress Monitoring & Statutory Protective Intervention Protocol
            </p>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="flex items-center bg-[#061024] p-1 rounded-lg border border-[#1e3a8a]/70">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#183b88] text-white shadow-sm border border-indigo-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side Action Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-1 bg-[#061024] border border-indigo-400/40 rounded-lg px-2.5 py-1 text-xs text-white">
            <Globe className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage && setLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-[#0a1b3b] text-white">English</option>
              <option value="hi" className="bg-[#0a1b3b] text-white">हिन्दी (Hindi)</option>
              <option value="mr" className="bg-[#0a1b3b] text-white">मराठी (Marathi)</option>
              <option value="ta" className="bg-[#0a1b3b] text-white">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Active Alerts Button in Navbar (For Police & Magistrate / Clinical Officials) */}
          {activeTab !== 'VICTIM' && (
            <button
              onClick={onToggleAlertsDrawer}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeAlertsCount > 0
                  ? 'bg-rose-700 hover:bg-rose-800 border-rose-400 text-white shadow-lg ring-2 ring-rose-500/50'
                  : 'bg-[#061024] hover:bg-slate-800 border-indigo-400/40 text-slate-200'
              }`}
              title="View Real-Time Police Emergency Dispatch Alerts"
            >
              <div className="relative flex items-center justify-center">
                <Bell className={`w-3.5 h-3.5 ${activeAlertsCount > 0 ? 'text-white animate-bounce' : 'text-slate-400'}`} />
                {activeAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Police Alerts</span>
              {activeAlertsCount > 0 ? (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-rose-800 text-[10px] font-black shadow-xs">
                  {activeAlertsCount} ACTIVE
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                  0
                </span>
              )}
            </button>
          )}

          {/* Emergency SOS Trigger (Only on Survivor Intake / Normal User tab) */}
          {activeTab === 'VICTIM' && (
            <button
              onClick={onTriggerSos}
              className="btn-danger text-xs font-bold pulse-emergency flex items-center space-x-1.5"
              title="Instant Police & Crisis Dispatch"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">EMERGENCY SOS</span>
              <span className="sm:hidden">SOS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
