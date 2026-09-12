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
  Volume2,
  MessageSquare,
  Lock,
  Building,
  RefreshCw,
  UserCheck,
  BadgeAlert,
  FileSpreadsheet
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
        setMetrics(await resMetrics.json());
      }

      if (resCases.ok) {
        const dataCases = await resCases.json();
        const loadedCases = dataCases.cases || [];
        setCases(loadedCases);

        const currentTargetId = selectedVictimId || (activeCase ? activeCase.victim_id : null);
        const match = loadedCases.find(c => c.victim_id === currentTargetId);
        if (match) {
          setActiveCase(match);
        } else if (loadedCases.length > 0) {
          setActiveCase(loadedCases[0]);
        }
      }
    } catch (err) {
      console.warn('Dashboard sync warning:', err);
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
          setCaseFile(await res.json());
        }
      } catch (e) {
        console.warn('Failed loading case file:', e);
      }
    }
    loadCaseFile();
  }, [activeCase?.victim_id]);

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
        setActionSuccess(`Order Issued: [${title}] dispatched to Superintendent of Police & Special Cell.`);
        const fileRes = await fetch(`/api/v1/counsellor/case-file/${activeCase.victim_id}`);
        if (fileRes.ok) {
          setCaseFile(await fileRes.json());
        }
        setTimeout(() => setActionSuccess(null), 6000);
      }
    } catch (e) {
      console.error('Intervention dispatch error:', e);
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
      formData.append('interventions_authorized', 'Witness Protection Review, Residence Watch');
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
      console.error('Note record error:', err);
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

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'badge-critical';
      case 'HIGH':
        return 'badge-high';
      case 'MODERATE':
        return 'badge-moderate';
      default:
        return 'badge-low';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Executive Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-[#0f2557]">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monitored Roster</span>
            <Users className="w-3.5 h-3.5 text-[#0f2557]" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics?.total_monitored_cases ?? cases.length}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">100% Registry Active</span>
        </div>

        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-rose-600 bg-rose-50/15">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical Intimidation</span>
            <BadgeAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">
            {(metrics?.critical_cases ?? 0) + (metrics?.high_risk_cases ?? 0)}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold">Immediate Action Queue</span>
        </div>

        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-amber-600 bg-amber-50/15">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Accused Granted Bail</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-800">
            {metrics?.vulnerability_flags?.accused_out_on_bail ?? 3}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">Proximity Threat Active</span>
        </div>

        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-blue-600 bg-blue-50/15">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Relief DBT Pending</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-800">
            {metrics?.vulnerability_flags?.compensation_delayed ?? 3}
          </div>
          <span className="text-[10px] text-blue-700 font-semibold">Annexure I Mandate</span>
        </div>

        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-purple-600 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Vulnerability Index</span>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-900">
            {metrics?.average_distress_index ?? 66.6} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <span className="text-[10px] text-purple-700 font-semibold">Multi-Modal Composite</span>
        </div>
      </div>

      {/* 2. Main Master-Detail Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Priority Triage Roster (5 cols) */}
        <div className="lg:col-span-5 gov-card p-4 flex flex-col h-[780px]">
          {/* Header & Filter Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                District Witness Protection Roster
              </h2>
              <p className="text-[11px] text-slate-500">SC/ST (Prevention of Atrocities) Act Triage</p>
            </div>
            <button
              onClick={loadData}
              title="Refresh Roster"
              className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all whitespace-nowrap ${
                  filterRisk === filter
                    ? 'bg-[#0f2557] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, FIR, District, Sections..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Roster List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No cases matching current filter parameters.
              </div>
            ) : (
              filteredCases.map((item) => {
                const isSelected = activeCase?.victim_id === item.victim_id;

                return (
                  <div
                    key={item.victim_id}
                    onClick={() => handleSelect(item)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">
                            {item.code_name || (item.victim_code ? item.victim_code.replace(' (Anonymized)', '') : 'Case')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">
                            [{item.victim_id}]
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium line-clamp-1">
                          {item.sections_invoked || item.summary}
                        </span>
                      </div>

                      <span className={getRiskBadgeClass(item.current_risk_level)}>
                        {item.current_risk_level}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.district}, {item.state}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {item.accused_on_bail && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Bail Alert
                          </span>
                        )}
                        <span className="font-bold text-slate-900">
                          {item.current_dds} <span className="text-[9px] text-slate-400 font-normal">DDS</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Official Law Enforcement Case Dossier (7 cols) */}
        <div className="lg:col-span-7 gov-card p-5 h-[780px] overflow-y-auto space-y-5">
          {activeCase ? (
            <>
              {/* Dossier Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      DOCKET #{activeCase.victim_id}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      // LAW ENFORCEMENT SENSITIVE
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono">{activeCase.code_name || (activeCase.victim_code ? activeCase.victim_code.replace(' (Anonymized)', '') : 'Case')}</span>
                    <span className={getRiskBadgeClass(activeCase.current_risk_level)}>
                      {activeCase.current_risk_level} PRIORITY
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Community: <span className="font-semibold text-slate-700">{activeCase.community}</span> • Age: {activeCase.age} • Gender: {activeCase.gender} • Jurisdiction: <span className="font-semibold text-slate-700">{activeCase.district}, {activeCase.state}</span>
                  </p>
                </div>

                {/* Score Big Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-right flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Dynamic Distress Index
                  </span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`text-2xl font-bold ${
                        activeCase.current_dds >= 70
                          ? 'text-rose-600'
                          : activeCase.current_dds >= 50
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {activeCase.current_dds}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    {activeCase.trend_status}
                  </span>
                </div>
              </div>

              {/* Action Banner if triggered */}
              {actionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* INTELLIGENCE & THREAT BRIEF */}
              <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ground Threat Intelligence & Predicament Brief</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {activeCase.summary}
                </p>
                {activeCase.accused_on_bail && (
                  <p className="text-[11px] font-bold text-rose-800 pt-1 border-t border-amber-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Statutory Alert: Accused is currently enlarged on bail. High retaliation and witness hostility hazard.</span>
                  </p>
                )}
              </div>

              {/* Procedural & Legal Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">
                    FIR & Police Station
                  </span>
                  <span className="font-bold text-slate-900 block">{activeCase.fir_number}</span>
                  <span className="text-[11px] text-slate-500">{activeCase.police_station}</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">
                    Impugned Sections
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] line-clamp-2" title={activeCase.sections_invoked}>
                    {activeCase.sections_invoked}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">
                    Trial Phase & Court
                  </span>
                  <span className="font-bold text-slate-900 block line-clamp-1">{activeCase.legal_stage}</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Next: {activeCase.next_hearing_date}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">
                    Relief / Compensation
                  </span>
                  <span
                    className={`font-bold text-[11px] block ${
                      activeCase.compensation_delayed ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {activeCase.compensation_status}
                  </span>
                </div>
              </div>

              {/* Multi-Modal Distress Breakdown Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Multi-Modal Distress Determination (Section 15A Diagnostics)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    COMPOSITE DDS: {activeCase.current_dds} / 100
                  </span>
                </div>

                <div className="p-3.5 space-y-3 text-xs">
                  {/* Voice Perturbation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                        Vocal Prosody & Micro-Tremor (28% Weight)
                      </span>
                      <span className="font-bold">
                        {caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score ?? 75} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score ?? 75}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Classification: {caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_classification || 'Acoustic Tension & Tremor Detected'}
                    </span>
                  </div>

                  {/* NLP Threat Indicators */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        Linguistic Threat & Emotion Indicators (28% Weight)
                      </span>
                      <span className="font-bold">
                        {caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score ?? 78} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{ width: `${caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score ?? 78}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Fear: {caseFile?.latest_nlp_emotion_matrix?.fear_score ?? 85}% • Hopelessness: {caseFile?.latest_nlp_emotion_matrix?.hopelessness_score ?? 70}%
                    </span>
                  </div>

                  {/* Clinical Baseline */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                        Psychotrauma Baseline (20% Weight)
                      </span>
                      <span className="font-bold">68 / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      PHQ-9 Baseline: Moderate-Severe Trauma Index
                    </span>
                  </div>

                  {/* Legal Vulnerability */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-amber-600" />
                        Legal Vulnerability & Deposition Proximity (16% Weight)
                      </span>
                      <span className="font-bold">{activeCase.accused_on_bail ? '85' : '45'} / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-600 h-1.5 rounded-full"
                        style={{ width: activeCase.accused_on_bail ? '85%' : '45%' }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activeCase.accused_on_bail ? 'Accused on Bail + Impending Special Court Witness Examination' : 'Regular Procedural Phase'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Click Actionable Statutory Directives (Section 15A SC/ST PoA Act) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Statutory Protective Directives (Section 15A Enforcement)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Official Dispatch Orders</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleIssueProtection('ARMED_POLICE_PICKET', 'Armed Police Picket at Residence (Sec 15A(6)(b))')}
                    disabled={isActionLoading}
                    className="p-3 text-left rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 transition-all flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Armed Police Residence Picket</span>
                      </div>
                      <p className="text-[11px] text-rose-800 font-normal mt-0.5">
                        Sec 15A(6)(b) • 24/7 armed protection guard (2-Hour SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  </button>

                  <button
                    onClick={() => handleIssueProtection('SAFE_HOUSE_RELOCATION', 'Safe House Transit & Relocation (Sec 15A(6)(c))')}
                    disabled={isActionLoading}
                    className="p-3 text-left rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 transition-all flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-indigo-600" />
                        <span>Confidential Safe House Transit</span>
                      </div>
                      <p className="text-[11px] text-indigo-800 font-normal mt-0.5">
                        Sec 15A(6)(c) • Government transit shelter relocation (24-Hour SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  </button>

                  <button
                    onClick={() => handleIssueProtection('TELE_MANAS_EMERGENCY', 'Tele-MANAS Psychiatric Escalation (Rule 5(1)(e))')}
                    disabled={isActionLoading}
                    className="p-3 text-left rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 transition-all flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-emerald-600" />
                        <span>Emergency Tele-MANAS Escalation</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                        Rule 5(1)(e) • Urgent clinical psychiatric session (4-Hour SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  </button>

                  <button
                    onClick={() => handleIssueProtection('EXPEDITE_INTERIM_RELIEF', 'Fast-Track Interim Relief DBT Sanction (Annexure I)')}
                    disabled={isActionLoading}
                    className="p-3 text-left rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-950 transition-all flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-600" />
                        <span>Fast-Track Interim Relief DBT</span>
                      </div>
                      <p className="text-[11px] text-blue-800 font-normal mt-0.5">
                        Annexure I • Electronic disbursement of 50% relief grant (3-Day SLA)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  </button>
                </div>
              </div>

              {/* Official Supervisory Note & Case Action Log */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Official Supervisory Directive / Case Observation
                </span>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    placeholder="Enter official directive, witness vulnerability assessment, or police order details..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 placeholder-slate-400 font-normal"
                  />

                  <div className="flex items-center justify-between">
                    {noteSuccess ? (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Directive logged in official case file.
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Appends directly to Special Court Case Docket
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={!officerNote.trim()}
                      className="btn-navy text-xs disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log Directive</span>
                    </button>
                  </div>
                </form>

                {/* History of notes */}
                {caseFile?.clinical_notes_history && caseFile.clinical_notes_history.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Case Order Log:
                    </span>
                    {caseFile.clinical_notes_history.map((n, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-0.5">
                          <span>{n.counsellor_name}</span>
                          <span>{n.timestamp ? n.timestamp.slice(0, 16).replace('T', ' ') : ''}</span>
                        </div>
                        <p className="text-slate-700">{n.clinical_observations}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Select a case from the triage roster to inspect complete legal situation and dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
