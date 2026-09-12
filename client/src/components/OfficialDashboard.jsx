import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, AlertCircle, FileCheck, CheckCircle2, ChevronRight, Phone, MapPin, Search } from 'lucide-react';

export default function OfficialDashboard() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Cases from Backend
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch('/api/v1/dashboard/cases');
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases || []);
          if (data.cases && data.cases.length > 0) {
            setSelectedCase(data.cases[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load dashboard cases:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Issue Statutory Intervention (e.g. Armed Protection Picket, Safe House, etc.)
  const handleIssueProtection = async (actionType) => {
    if (!selectedCase) return;
    try {
      const formData = new FormData();
      formData.append('victim_id', selectedCase.victim_id);
      formData.append('intervention_type', actionType);
      formData.append('notes', `Urgent requisition dispatched from Official Workbench by Duty Officer.`);

      const res = await fetch('/api/v1/counsellor/intervene', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setActionSuccess(`Protection order (${actionType}) issued successfully. Dispatched to District Police.`);
        setTimeout(() => setActionSuccess(null), 5000);
      }
    } catch (e) {
      console.error('Intervention error:', e);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesFilter = filterRisk === 'ALL' || c.risk_level === filterRisk;
    const matchesSearch =
      c.victim_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.victim_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neu-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Monitored Cases</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">6</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">100% check-in coverage</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[inset_2px_2px_5px_#cad4e2]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="neu-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">High / Critical Priority</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">2</h3>
            <span className="text-[11px] text-rose-500 font-semibold">Immediate triage required</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-[inset_2px_2px_5px_#cad4e2]">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="neu-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Protection Orders Active</span>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">3</h3>
            <span className="text-[11px] text-indigo-500 font-semibold">Section 15A Police Pickets</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[inset_2px_2px_5px_#cad4e2]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="neu-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Relief Grants Dispatched</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">₹ 4.25 L</h3>
            <span className="text-[11px] text-emerald-500 font-semibold">Interim relief assistance</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-[inset_2px_2px_5px_#cad4e2]">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Triage Queue & Selected Case File */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Triage Queue (Left 5 cols) */}
        <div className="lg:col-span-5 neu-card p-6 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/60 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Priority Triage Queue</h3>
            <div className="flex items-center gap-1.5">
              {['ALL', 'CRITICAL', 'HIGH'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterRisk(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filterRisk === f
                      ? 'bg-indigo-600 text-white shadow-[2px_2px_5px_#cad4e2]'
                      : 'neu-btn text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="neu-inset p-2 mb-4 flex items-center gap-2 text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, district..."
              className="bg-transparent outline-none flex-1 text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Case List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredCases.map((item) => {
              const isSelected = selectedCase?.victim_id === item.victim_id;
              const isCrit = item.risk_level === 'CRITICAL' || item.risk_level === 'HIGH';

              return (
                <div
                  key={item.victim_id}
                  onClick={() => setSelectedCase(item)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'neu-inset border-l-4 border-indigo-600'
                      : 'neu-card-sm hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{item.victim_code}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isCrit
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.risk_level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.district}, {item.state}</span>
                    </span>
                    <span className="font-bold text-slate-700">{Math.round(item.current_distress_score)}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Case Dossier (Right 7 cols) */}
        <div className="lg:col-span-7 neu-card p-6 flex flex-col h-[650px] overflow-y-auto">
          {selectedCase ? (
            <div className="space-y-5">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-800">{selectedCase.victim_code}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-bold">
                      {selectedCase.victim_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCase.district}, {selectedCase.state} • Legal Stage: <span className="font-semibold text-slate-700">{selectedCase.legal_stage}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Current Distress Index</span>
                  <span className="text-2xl font-black text-rose-600">{Math.round(selectedCase.current_distress_score)} / 100</span>
                </div>
              </div>

              {/* Action Banner if triggered */}
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Quick Legal Summary */}
              <div className="neu-inset p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">FIR Reference</span>
                  <span className="font-bold text-slate-800">{selectedCase.fir_number || 'FIR-2024-881'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Accused on Bail</span>
                  <span className={`font-bold ${selectedCase.accused_on_bail ? 'text-rose-600' : 'text-slate-800'}`}>
                    {selectedCase.accused_on_bail ? 'Yes (Proximity Alert)' : 'No (In Custody)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Interim Relief</span>
                  <span className="font-bold text-emerald-600">Disbursed (50%)</span>
                </div>
              </div>

              {/* Longitudinal History / Past Check-ins */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Recent Check-in Trajectory
                </h4>
                <div className="space-y-2">
                  {[
                    { date: 'Today (Latest)', score: selectedCase.current_distress_score, notes: 'Direct perpetrator intimidation reported' },
                    { date: '4 days ago', score: 62, notes: 'Anxiety noted before court hearing' },
                    { date: '9 days ago', score: 48, notes: 'Counsellor session completed' },
                  ].map((entry, idx) => (
                    <div key={idx} className="neu-inset p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{entry.date}</span>
                        <p className="text-[11px] text-slate-500">{entry.notes}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-700">{Math.round(entry.score)}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Click Statutory Interventions */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Requisition Statutory Protection (Section 15A)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleIssueProtection('ARMED_POLICE_PICKET')}
                    className="neu-btn p-3 text-left hover:border-rose-300 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600">
                        Dispatch Armed Police Picket
                      </span>
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Immediate 24/7 armed police guard at victim residence.
                    </p>
                  </button>

                  <button
                    onClick={() => handleIssueProtection('SAFE_HOUSE_RELOCATION')}
                    className="neu-btn p-3 text-left hover:border-indigo-300 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                        Safe House Relocation
                      </span>
                      <MapPin className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Temporary confidential government shelter relocation.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a case from the triage queue to inspect details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
