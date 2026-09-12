import React, { useState } from 'react';
import { X, Bell, ShieldAlert, AlertTriangle, UserCheck, CheckCircle2 } from 'lucide-react';

export default function AlertsDrawer({
  isOpen,
  onClose,
  alerts = [],
  onAcknowledge,
  onSelectVictim
}) {
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  if (!isOpen) return null;

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (e) {}
    return isoString;
  };

  const getCleanCodeName = (item) => {
    if (!item) return 'SURVIVOR';
    let code = typeof item === 'string' ? item : (item.victim_code || item.code_name || item.victim_id || 'SURVIVOR');
    code = code.replace(/#/g, '')
               .replace(/-2024-/g, '-')
               .replace(/ \([^)]*\)/g, '');
    return code;
  };

  const handleAction = async (alertId) => {
    setAcknowledgingId(alertId);
    try {
      await onAcknowledge(alertId);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 bg-[#0f2557] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Live Emergency Alerts</h3>
                <p className="text-[10px] text-slate-300">Police Nodal Dispatch Roster</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active emergency alerts at this moment.
              </div>
            ) : (
              alerts.map((alert) => {
                const isCrit = alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY_SOS';
                const isActive = alert.status === 'ACTIVE';

                return (
                  <div
                    key={alert.alert_id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-white border-rose-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <button
                          onClick={() => {
                            if (onSelectVictim) onSelectVictim(alert.victim_id);
                            onClose();
                          }}
                          className="text-xs font-bold text-slate-900 underline hover:text-indigo-600 font-mono"
                        >
                          {getCleanCodeName(alert)}
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateTime(alert.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-semibold mb-2">
                      {alert.trigger_reason || alert.title || alert.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500">
                        {alert.district}, {alert.state}
                      </span>

                      {isActive ? (
                        <button
                          onClick={() => handleAction(alert.alert_id)}
                          disabled={acknowledgingId === alert.alert_id}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                          <span>{acknowledgingId === alert.alert_id ? 'Dispatching Unit...' : 'Dispatch Patrol Unit ➔'}</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dispatched & Enforced ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
