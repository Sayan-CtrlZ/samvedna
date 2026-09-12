import React from 'react';
import { Phone, Shield, HeartPulse, Scale } from 'lucide-react';

export default function EmergencyHelplines() {
  const helplines = [
    {
      number: '14566',
      title: 'National Support Line',
      desc: '24/7 Atrocity Prevention & Care',
      icon: Shield,
      cardBg: 'bg-[#eff6ff]',
      borderColor: 'border-blue-200 hover:border-blue-400',
      iconBg: 'bg-blue-600 text-white',
      btnClass: 'btn-3d btn-3d-sky',
    },
    {
      number: '112',
      title: 'Emergency Police',
      desc: 'Immediate Protection & Dispatch',
      icon: Phone,
      cardBg: 'bg-[#fff1f2]',
      borderColor: 'border-rose-200 hover:border-rose-400',
      iconBg: 'bg-rose-600 text-white',
      btnClass: 'btn-3d btn-3d-red',
    },
    {
      number: '14416',
      title: 'Tele-MANAS Mental Health',
      desc: 'Confidential Crisis Counselling',
      icon: HeartPulse,
      cardBg: 'bg-[#ecfdf5]',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-600 text-white',
      btnClass: 'btn-3d btn-3d-emerald',
    },
    {
      number: '15100',
      title: 'Free Legal Aid (NALSA)',
      desc: 'Legal Counsel & Victim Rights',
      icon: Scale,
      cardBg: 'bg-[#fffbeb]',
      borderColor: 'border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-600 text-white',
      btnClass: 'btn-3d btn-3d-amber',
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
            className={`${line.cardBg} border-2 ${line.borderColor} rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${line.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{line.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{line.desc}</p>
              </div>
            </div>
            <span className={`${line.btnClass} px-3 py-1.5 text-xs font-black ml-2 tracking-wide`}>
              {line.number}
            </span>
          </a>
        );
      })}
    </div>
  );
}
