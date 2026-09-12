import React from 'react';
import { HeartHandshake, ShieldAlert } from 'lucide-react';

export default function Header({ onTriggerSos, isOnline = true }) {
  return (
    <header className="bg-white border-2 border-slate-200/90 shadow-sm rounded-2xl px-5 sm:px-8 py-4 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Brand & Mission */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <HeartHandshake className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">SAMVEDNA</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isOnline ? 'Active' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Care, Well-being & Protection Support Portal</p>
        </div>
      </div>

      {/* Emergency Action */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTriggerSos}
          className="btn-3d btn-3d-red px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2"
          title="Send instant emergency alert to district police and helpline"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency SOS</span>
        </button>
      </div>
    </header>
  );
}
