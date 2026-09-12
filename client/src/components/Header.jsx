import React from 'react';
import { HeartHandshake, ShieldAlert, LayoutDashboard, Mic, BellRing } from 'lucide-react';

export default function Header({
  activeView = 'AUTHORITY',
  setActiveView,
  onTriggerSos,
  isOnline = true,
  activeAlertsCount = 0
}) {
  return (
    <header className="bg-white border-2 border-slate-200/90 shadow-sm rounded-2xl px-4 sm:px-6 py-3.5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Brand & Mission */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 flex-shrink-0">
          <HeartHandshake className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">SAMVEDNA</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-wider">
              PRD v2.1
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isOnline ? 'Active' : 'Connecting...'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold line-clamp-1">
            Dynamic Mental Health Monitoring & Witness Protection (SC/ST PoA Act Sec 15A & NHAA 14566)
          </p>
        </div>
      </div>

      {/* View Switcher Tabs & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => setActiveView('AUTHORITY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeView === 'AUTHORITY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Authority Sentinel</span>
            {activeAlertsCount > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('VICTIM')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeView === 'VICTIM'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Victim Check-in</span>
          </button>
        </div>

        {/* Emergency Action */}
        <button
          onClick={onTriggerSos}
          className="btn-3d btn-3d-red px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0"
          title="Send instant emergency alert to district police and helpline"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency SOS</span>
        </button>
      </div>
    </header>
  );
}
