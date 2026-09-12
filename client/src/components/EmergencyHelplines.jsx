import React from 'react';
import { Phone, Shield, HeartPulse, Scale } from 'lucide-react';

export default function EmergencyHelplines() {
  const helplines = [
    {
      number: '14566',
      title: 'National Support Line',
      desc: '24/7 Toll-Free Support for Atrocity Prevention & Care',
      icon: Shield,
      accent: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      number: '112',
      title: 'Emergency Police',
      desc: 'Immediate armed protection & emergency response',
      icon: Phone,
      accent: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      number: '14416',
      title: 'Tele-MANAS Mental Health',
      desc: '24/7 confidential psychological counselling support',
      icon: HeartPulse,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      number: '15100',
      title: 'Free Legal Aid (NALSA)',
      desc: 'Government legal counsel and court protection rights',
      icon: Scale,
      accent: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {helplines.map((line) => {
        const Icon = line.icon;
        return (
          <a
            key={line.number}
            href={`tel:${line.number}`}
            className="neu-card p-4 flex items-center justify-between group transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${line.bg} ${line.accent} flex items-center justify-center shadow-[inset_2px_2px_5px_#cad4e2,inset_-2px_-2px_5px_#ffffff]`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{line.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{line.desc}</p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-slate-800 px-2.5 py-1 rounded-lg bg-[#e2e8f1] shadow-[inset_2px_2px_4px_#c7d2e3,inset_-2px_-2px_4px_#ffffff] group-hover:text-indigo-600 transition-colors">
              {line.number}
            </span>
          </a>
        );
      })}
    </div>
  );
}
