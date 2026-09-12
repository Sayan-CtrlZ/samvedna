import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  Phone,
  MapPin,
  Search,
  Scale,
  Calendar,
  AlertTriangle,
  Clock,
  Send,
  FileText,
  Activity,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Volume2,
  MessageSquare,
  Lock,
  Building,
  RefreshCw
} from 'lucide-react';

export default function OfficialDashboard({ selectedVictimId, onSelectVictim }) {
  const [metrics, setMetrics] = useState(null);
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [caseFile, setCaseFile] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [officerNote, setOfficerNote] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load summary metrics and cases
  const loadData = async () => {
    try {
      const [resMetrics, resCases] = await Promise.all([
        fetch('/api/v1/dashboard/metrics'),
        fetch('/api/v1/dashboard/cases')
      ]);

      if (resMetrics.ok) {
        const dataMetrics = await resMetrics.json();
        setMetrics(dataMetrics);
      }

      if (resCases.ok) {
        const dataCases = await resCases.json();
        const loadedCases = dataCases.cases || [];
        setCases(loadedCases);

        // If a victimId is requested or default to first case
        const currentTargetId = selectedVictimId || (activeCase ? activeCase.victim_id : null);
        const match = loadedCases.find(c => c.victim_id === currentTargetId);
        if (match) {
          setActiveCase(match);
        } else if (loadedCases.length > 0) {
          setActiveCase(loadedCases[0]);
        }
      }
    } catch (err) {
      console.warn('Failed loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVictimId]);

  // When activeCase changes, load full case-file
  useEffect(() => {
    if (!activeCase?.victim_id) return;
    async function loadCaseFile() {
      try {
        const res = await fetch(`/api/v1/counsellor/case-file/${activeCase.victim_id}`);
        if (res.ok) {
          const data = await res.json();
          setCaseFile(data);
        }
      } catch (e) {
        console.warn('Failed loading case file:', e);
      }
    }
    loadCaseFile();
  }, [activeCase?.victim_id]);

  // Handle case selection
  const handleSelect = (c) => {
    setActiveCase(c);
    if (onSelectVictim) onSelectVictim(c.victim_id);
  };

  // Issue Statutory Intervention (Section 15A)
  const handleIssueProtection = async (actionType, title) => {
    if (!activeCase) return;
    setIsActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('victim_id', activeCase.victim_id);
      formData.append('intervention_type', actionType);
      formData.append('notes', `Statutory Directive (${actionType}) issued by District Protection Nodal Authority.`);

      const res = await fetch('/api/v1/counsellor/intervene', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setActionSuccess(`Statutory Order [${title}] Dispatched to District Police & Special Protection Cell.`);
        // Reload case file to show new note/order
        const fileRes = await fetch(`/api/v1/counsellor/case-file/${activeCase.victim_id}`);
        if (fileRes.ok) {
          setCaseFile(await fileRes.json());
        }
        setTimeout(() => setActionSuccess(null), 6000);
      }
    } catch (e) {
      console.error('Intervention error:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Officer Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!officerNote.trim() || !activeCase) return;
    try {
      const formData = new FormData();
      formData.append('victim_id', activeCase.victim_id);
      formData.append('counsellor_name', 'Superintendent of Police / Special Duty Magistrate');
      formData.append('clinical_observations', officerNote.trim());
      formData.append('interventions_authorized', 'Witness Protection Review, Helpline Monitoring');
      formData.append('next_follow_up_days', '2');

      const res = await fetch('/api/v1/counsellor/note', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setOfficerNote('');
        setNoteSuccess(true);
        const fileRes = await fetch(`/api/v1/counsellor/case-file/${activeCase.victim_id}`);
        if (fileRes.ok) {
          setCaseFile(await fileRes.json());
        }
        setTimeout(() => setNoteSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Note add error:', err);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesFilter = filterRisk === 'ALL' || c.current_risk_level === filterRisk;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (c.victim_code && c.victim_code.toLowerCase().includes(q)) ||
      (c.victim_id && c.victim_id.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q)) ||
      (c.sections_invoked && c.sections_invoked.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const getRiskBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. District Executive KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monitored Victims</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.total_monitored_cases ?? cases.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">100% Case Coverage</span>
        </div>

        <div className="bg-white border-2 border-rose-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical / High Threat</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {(metrics?.critical_cases ?? 0) + (metrics?.high_risk_cases ?? 0)}
          </div>
          <span className="text-[10px] text-rose-600 font-bold">Immediate Triage Queue</span>
        </div>

        <div className="bg-white border-2 border-amber-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Accused on Bail</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {metrics?.vulnerability_flags?.accused_out_on_bail ?? 3}
          </div>
          <span className="text-[10px] text-amber-700 font-bold">Proximity Hazard Active</span>
        </div>

        <div className="bg-white border-2 border-blue-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Relief Delayed</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">
            {metrics?.vulnerability_flags?.compensation_delayed ?? 3}
          </div>
          <span className="text-[10px] text-blue-700 font-bold">Annexure I DBT Pending</span>
        </div>

        <div className="bg-white border-2 border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Distress Index</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {metrics?.average_distress_index ?? 66.6} <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <span className="text-[10px] text-purple-600 font-bold">5-Component Composite</span>
        </div>
      </div>

      {/* 2. Main Master-Detail Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Priority Triage Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-200/90 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col h-[820px]">
          {/* Header & Filter Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900">Priority Triage Queue</h2>
              <p className="text-[11px] text-slate-500 font-medium">District Witness Protection Roster</p>
            </div>
            <button
              onClick={loadData}
              title="Refresh Queue"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Risk Level Filter Pills */}
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  filterRisk === filter
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Code, FIR, District..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Case List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No cases match the selected filter.
              </div>
            ) : (
              filteredCases.map((item) => {
                const isSelected = activeCase?.victim_id === item.victim_id;
                const isCrit = item.current_risk_level === 'CRITICAL';
                const isHigh = item.current_risk_level === 'HIGH';

                return (
                  <div
                    key={item.victim_id}
                    onClick={() => handleSelect(item)}
                    className={`p-3.5 rounded-xl cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-1 ring-indigo-600/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-slate-900">
                            {item.victim_code}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.victim_id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium line-clamp-1">
                          {item.full_name_masked}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${getRiskBadge(
                          item.current_risk_level
                        )}`}
                      >
                        {item.current_risk_level}
                      </span>
                    </div>

                    {/* Situation snippet */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 font-normal leading-relaxed">
                      {item.summary}
                    </p>

                    {/* Footer Info Strip */}
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.district}, {item.state}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {item.accused_on_bail && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            Bail Alert
                          </span>
                        )}
                        <span className="font-black text-slate-900 text-xs">
                          {item.current_dds} <span className="text-[9px] text-slate-400">DDS</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Victim & Legal Situation Dossier (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-200/90 rounded-2xl shadow-sm p-5 sm:p-6 h-[820px] overflow-y-auto space-y-6">
          {activeCase ? (
            <>
              {/* Dossier Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-black text-slate-900">
                      {activeCase.full_name_masked}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                      {activeCase.victim_id}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getRiskBadge(
                        activeCase.current_risk_level
                      )}`}
                    >
                      {activeCase.current_risk_level} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeCase.community} • Age: {activeCase.age} • Gender: {activeCase.gender} • Language: {activeCase.primary_language?.toUpperCase()}
                  </p>
                </div>

                {/* Score Big Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                    Dynamic Distress (DDS)
                  </span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`text-2xl font-black ${
                        activeCase.current_dds >= 70
                          ? 'text-rose-600'
                          : activeCase.current_dds >= 50
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {activeCase.current_dds}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/100</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {activeCase.trend_status}
                  </span>
                </div>
              </div>

              {/* Action Feedback Banner */}
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs flex items-center gap-2.5 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* CONTEXT CALLOUT: The Ground Situation Behind the Case */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Ground Situation & Threat Context (Section 15A Mandate)</span>
                </div>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  {activeCase.summary}
                </p>
                {activeCase.accused_on_bail && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center gap-2 text-[11px] font-bold text-rose-700">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      High-Alert Warning: Accused is currently out on bail. Elevated witness intimidation and coercion risk detected.
                    </span>
                  </div>
                )}
              </div>

              {/* Legal & Procedural Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    FIR & Police Station
                  </span>
                  <span className="font-extrabold text-slate-900 block">{activeCase.fir_number}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{activeCase.police_station}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Impugned Sections
                  </span>
                  <span className="font-bold text-slate-800 text-[11px] line-clamp-2" title={activeCase.sections_invoked}>
                    {activeCase.sections_invoked}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Trial Stage & Court
                  </span>
                  <span className="font-extrabold text-slate-900 block line-clamp-1">{activeCase.legal_stage}</span>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Hearing: {activeCase.next_hearing_date}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                    Relief / Compensation
                  </span>
                  <span
                    className={`font-bold text-[11px] block ${
                      activeCase.compensation_delayed ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {activeCase.compensation_status}
                  </span>
                </div>
              </div>

              {/* 5-Component Multi-Modal DDS Radar Breakdown */}
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      5-Component Multi-Modal Distress Breakdown (PRD v2.1 Formulation)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      DDS = 0.28(Voice) + 0.28(NLP) + 0.20(Clinical) + 0.16(Legal) + 0.08(Engagement)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    DDS: {activeCase.current_dds}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Voice Stress */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                        Voice Prosody & Vocal Tremor (28%)
                      </span>
                      <span>
                        {caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score ?? 72} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score ?? 72}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_classification || 'Acoustic Tension Detected'}
                    </span>
                  </div>

                  {/* NLP & Threat Lexicon */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        NLP Threat & Emotion AI (28%)
                      </span>
                      <span>
                        {caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score ?? 76} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score ?? 76}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Fear: {caseFile?.latest_nlp_emotion_matrix?.fear_score ?? 80}% • Hopelessness: {caseFile?.latest_nlp_emotion_matrix?.hopelessness_score ?? 65}%
                    </span>
                  </div>

                  {/* Clinical Trauma */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                        Clinical Trauma Baseline (20%)
                      </span>
                      <span>68 / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div className="bg-rose-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      PHQ-9 Baseline & Trauma History
                    </span>
                  </div>

                  {/* Legal Vulnerability */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-amber-600" />
                        Legal Vulnerability Index (16%)
                      </span>
                      <span>{activeCase.accused_on_bail ? '85' : '45'} / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{ width: activeCase.accused_on_bail ? '85%' : '45%' }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {activeCase.accused_on_bail ? 'Bail Granted + Deposition Imminent' : 'Regular Procedural Phase'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Longitudinal Trajectory Timeline */}
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Longitudinal Well-being Trajectory (Past Check-ins)</span>
                </h3>

                <div className="space-y-2">
                  {(caseFile?.longitudinal_trajectory && caseFile.longitudinal_trajectory.length > 0) ? (
                    caseFile.longitudinal_trajectory.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-extrabold text-slate-900">{item.timestamp}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {item.channel}
                            </span>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${getRiskBadge(item.risk_level)}`}>
                              {item.risk_level}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Voice Stress: {item.voice_stress} | NLP Distress: {item.nlp_distress}
                            {item.transcript_snippet ? ` • "${item.transcript_snippet}"` : ''}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {item.dds}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">DDS</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
                      Initial intake baseline established. Waiting for periodic follow-up.
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Actionable Statutory Directives (Section 15A SC/ST PoA Act) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Statutory Protection Directives (Section 15A SC/ST PoA Act)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Official Authority Dispatch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleIssueProtection('ARMED_POLICE_PICKET', 'Armed Police Picket at Residence (Sec 15A(6)(b))')}
                    disabled={isActionLoading}
                    className="btn-3d btn-3d-red p-3 text-left flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-black text-xs text-rose-900 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                        <span>Armed Police Picket</span>
                      </div>
                      <p className="text-[10px] text-rose-800 font-semibold mt-0.5 leading-tight">
                        Sec 15A(6)(b) • 24/7 armed guard at residence (2h SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                  </button>

                  <button
                    onClick={() => handleIssueProtection('SAFE_HOUSE_RELOCATION', 'Safe House Transit & Relocation (Sec 15A(6)(c))')}
                    disabled={isActionLoading}
                    className="btn-3d btn-3d-indigo p-3 text-left flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-black text-xs text-indigo-900 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Safe House Relocation</span>
                      </div>
                      <p className="text-[10px] text-indigo-800 font-semibold mt-0.5 leading-tight">
                        Sec 15A(6)(c) • Confidential government transit shelter (24h SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
                  </button>

                  <button
                    onClick={() => handleIssueProtection('TELE_MANAS_EMERGENCY', 'Tele-MANAS Psychiatric Escalation (Rule 5(1)(e))')}
                    disabled={isActionLoading}
                    className="btn-3d btn-3d-green p-3 text-left flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-black text-xs text-emerald-900 flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Tele-MANAS Emergency Escalation</span>
                      </div>
                      <p className="text-[10px] text-emerald-800 font-semibold mt-0.5 leading-tight">
                        Rule 5(1)(e) • Urgent clinical psychiatric trauma session (4h SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  </button>

                  <button
                    onClick={() => handleIssueProtection('EXPEDITE_INTERIM_RELIEF', 'Fast-Track Interim Relief DBT Sanction (Annexure I)')}
                    disabled={isActionLoading}
                    className="btn-3d p-3 text-left flex items-start justify-between gap-2 bg-blue-100 border-blue-400 text-blue-950"
                  >
                    <div>
                      <div className="font-black text-xs text-blue-900 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Expedite Interim Relief DBT</span>
                      </div>
                      <p className="text-[10px] text-blue-800 font-semibold mt-0.5 leading-tight">
                        Annexure I • Fast-track pending 50% compensation grant (3 days)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  </button>
                </div>
              </div>

              {/* Duty Officer / Counsellor Observation Note */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Authority Observation & Case Log</span>
                </h3>

                <form onSubmit={handleAddNote} className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    placeholder="Enter official observation, witness vulnerability assessment, or police order details..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />

                  <div className="flex items-center justify-between">
                    {noteSuccess ? (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Note appended to official case file.
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Logs directly to NHAA / Special Court Case Docket
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={!officerNote.trim()}
                      className="btn-3d btn-3d-indigo px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log Observation</span>
                    </button>
                  </div>
                </form>

                {/* History of notes */}
                {caseFile?.clinical_notes_history && caseFile.clinical_notes_history.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Previous Officer Logs:
                    </span>
                    {caseFile.clinical_notes_history.map((n, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                          <span>{n.counsellor_name}</span>
                          <span>{n.timestamp ? n.timestamp.slice(0, 16).replace('T', ' ') : ''}</span>
                        </div>
                        <p className="text-slate-700 font-medium">{n.clinical_observations}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Select a case from the priority triage queue to inspect full situation and dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
