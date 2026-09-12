import React from 'react';
import { HeartHandshake, ShieldAlert } from 'lucide-react';

export default function Header({ onTriggerSos, isOnline = true }) {
  return (
    <header className="neu-flat px-4 sm:px-8 py-4 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/40">
      {/* Brand & Mission */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-[inset_3px_3px_6px_#cad4e2,inset_-3px_-3px_6px_#ffffff]">
          <HeartHandshake className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">SAMVEDNA</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isOnline ? 'System Ready' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Care, Well-being & Protection Support Portal</p>
        </div>
      </div>

      {/* Emergency Action */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTriggerSos}
          className="neu-sos flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
          title="Send instant emergency alert to district police and helpline"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency SOS</span>
        </button>
      </div>
    </header>
  );
}
