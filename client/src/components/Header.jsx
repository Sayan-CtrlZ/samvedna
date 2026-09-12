import React from 'react';
import {
  ShieldAlert,
  LayoutDashboard,
  Stethoscope,
  BarChart3,
  Mic,
  Bell,
  Scale,
  Sparkles
} from 'lucide-react';

export default function Header({
  activeTab = 'TRIAGE',
  setActiveTab,
  onTriggerSos,
  isOnline = true,
  activeAlertsCount = 0,
  onToggleAlertsDrawer
}) {
  const tabs = [
    { id: 'TRIAGE', label: 'District Police Triage', icon: LayoutDashboard },
    { id: 'COUNSELLOR', label: 'Counsellor Workbench', icon: Stethoscope },
    { id: 'ANALYTICS', label: 'Atrocity Analytics', icon: BarChart3 },
    { id: 'VICTIM', label: 'Survivor Check-in', icon: Mic },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0a1b3b]/95 backdrop-blur-md border-b border-[#1e3a8a]/40 text-white shadow-sm">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand & Mission */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-inner flex-shrink-0">
            <Scale className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>SAMVEDNA AI</span>
                <span className="text-indigo-300 font-normal text-xs hidden sm:inline">| संवेदना AI</span>
              </h1>
              <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full bg-[#183b88] text-indigo-100 border border-[#2d55b0] text-[10px] font-semibold">
                NHAA 14566 • Sec 15A
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-300 hidden md:block font-medium truncate">
              National Distress Monitoring & Witness Protection Sentinel Console
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Material Flat Pill Bar) */}
        <div className="bg-[#061024] p-1 rounded-xl border border-[#1e3a8a]/60 flex items-center text-xs overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Actions: Live Alerts Drawer & Emergency SOS */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Live Alerts Drawer Toggle */}
          <button
            onClick={onToggleAlertsDrawer}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            title="Toggle Live Emergency Police Alerts"
          >
            <Bell className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Alerts</span>
            {activeAlertsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-extrabold animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={onTriggerSos}
            className="px-3 sm:px-4 py-1.5 bg-[#e03131] hover:bg-[#c92a2a] active:scale-95 text-white rounded-full text-xs font-bold shadow-md shadow-red-950/40 flex items-center space-x-1.5 transition-all pulse-emergency"
            title="Instant Armed Police & Crisis Dispatch"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EMERGENCY SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
}
