import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BellRing, UserCheck } from 'lucide-react';

export default function LiveAlertsBanner({ alerts = [], onAcknowledge, onSelectVictim }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  if (activeAlerts.length === 0) {
    return null;
  }

  const topAlert = activeAlerts[0];

  const handleAcknowledgeClick = async (e, alertId) => {
    e.stopPropagation();
    setAcknowledgingId(alertId);
    try {
      await onAcknowledge(alertId);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white rounded-2xl shadow-lg border-2 border-rose-500 overflow-hidden">
      {/* Top Banner Alert Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-black/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                POLICE PRIORITY ALERT ({activeAlerts.length})
              </span>
              <span className="text-xs font-bold font-mono text-rose-200">
                {topAlert.victim_id}
              </span>
            </div>
            <p className="text-sm font-semibold text-white line-clamp-1 mt-0.5">
              {topAlert.title || topAlert.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={(e) => handleAcknowledgeClick(e, topAlert.alert_id)}
            disabled={acknowledgingId === topAlert.alert_id}
            className="btn-3d bg-white text-rose-800 hover:bg-rose-50 px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5 text-rose-700" />
            <span>{acknowledgingId === topAlert.alert_id ? 'Dispatching...' : 'Dispatch Protection'}</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Alert List */}
      {isExpanded && (
        <div className="px-5 pb-4 pt-2 border-t border-white/20 space-y-2.5 bg-black/15">
          <div className="text-[11px] font-bold text-rose-200 uppercase tracking-wider">
            All Active Alerts Requiring Statutory Action:
          </div>
          {activeAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              className="bg-white/10 hover:bg-white/15 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                    {alert.severity || 'CRITICAL'}
                  </span>
                  <button
                    onClick={() => onSelectVictim && onSelectVictim(alert.victim_id)}
                    className="text-xs font-bold text-white underline hover:text-amber-200"
                  >
                    Case: {alert.victim_id}
                  </button>
                  <span className="text-[11px] text-rose-200">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-rose-100 font-medium">
                  {alert.message || alert.title}
                </p>
                {alert.recommended_action && (
                  <p className="text-[11px] text-amber-200 font-semibold">
                    Statutory Recommendation: {alert.recommended_action}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => handleAcknowledgeClick(e, alert.alert_id)}
                  disabled={acknowledgingId === alert.alert_id}
                  className="px-3 py-1.5 rounded-lg bg-white text-rose-800 text-xs font-bold hover:bg-rose-50 transition-colors shadow-sm"
                >
                  {acknowledgingId === alert.alert_id ? 'Updating...' : 'Acknowledge & Dispatch'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
