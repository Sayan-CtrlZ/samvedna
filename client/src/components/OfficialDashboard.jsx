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

export default function OfficialDashboard({ selectedVictimId, onSelectVictim, userLocation }) {
  const [metrics, setMetrics] = useState(null);
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [caseFile, setCaseFile] = useState(null);
  const [alertsFeed, setAlertsFeed] = useState([]);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [officerNote, setOfficerNote] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Format Date & Time cleanly
  const formatDateTime = (isoString) => {
    if (!isoString) return new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    try {
      const d = new Date(isoString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (e) {}
    return isoString;
  };

  // Helper: Get Clean Code Name without # or 2024
  const getCleanCodeName = (item) => {
    if (!item) return 'SURVIVOR';
    let code = item.victim_code || item.code_name || item.victim_id || 'SURVIVOR';
    code = code.replace(/#/g, '')
               .replace(/-2024-/g, '-')
               .replace(/ \([^)]*\)/g, '');
    return code;
  };

  // Load summary metrics, cases, and live police alerts feed
  const loadData = async () => {
    try {
      const [resMetrics, resCases, resAlerts] = await Promise.all([
        fetch('/api/v1/dashboard/metrics'),
        fetch('/api/v1/dashboard/cases'),
        fetch('/api/v1/alerts/feed')
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

      if (resAlerts.ok) {
        const dataAlerts = await resAlerts.json();
        setAlertsFeed(dataAlerts.alerts || []);
      }
    } catch (err) {
      console.warn('Dashboard sync warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
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
    const interval = setInterval(loadCaseFile, 3000);
    return () => clearInterval(interval);
  }, [activeCase?.victim_id]);

  const handleSelect = (c) => {
    setActiveCase(c);
    if (onSelectVictim) onSelectVictim(c.victim_id);
  };

  // 1-Click Acknowledge / Dispatch Protection Alert
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const formData = new FormData();
      formData.append('alert_id', alertId);
      formData.append('officer_name', 'District SP / Special Protection Cell');
      formData.append('action_taken', 'Dispatched Armed Police Protection & Patrol Unit');

      const res = await fetch('/api/v1/alerts/acknowledge', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setActionSuccess(`Protection Patrol Order Dispatched for Alert #${alertId}`);
        loadData();
        setTimeout(() => setActionSuccess(null), 5000);
      }
    } catch (e) {
      console.error('Failed acknowledging alert:', e);
    }
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

  const handleMarkResolved = async (victimId) => {
    if (!victimId) return;
    setIsActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('victim_id', victimId);
      formData.append('officer_name', 'District SP / Special Protection Cell');
      formData.append('resolution_notes', 'Statutory witness protection enforced & threat resolved.');

      const res = await fetch('/api/v1/dashboard/case/resolve', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setActionSuccess(`Protection Enforced & Case Marked as RESOLVED ✓`);
        await loadData();
        setTimeout(() => setActionSuccess(null), 5000);
      }
    } catch (e) {
      console.error('Failed resolving case:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesFilter =
      filterRisk === 'ALL' ||
      c.current_risk_level === filterRisk ||
      (filterRisk === 'RESOLVED' && ['RESOLVED', 'CLOSED', 'ENFORCED'].includes(c.current_risk_level)) ||
      (filterRisk === 'STABLE' && ['LOW', 'STABLE'].includes(c.current_risk_level));

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
      case 'RESOLVED':
      case 'CLOSED':
      case 'ENFORCED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      default:
        return 'badge-low';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Executive Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-purple-600">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Vulnerability Index</span>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-900">
            {metrics?.average_distress_index ?? 66.6} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <span className="text-[10px] text-purple-700 font-semibold">Multi-Modal Composite</span>
        </div>

        <div className="gov-card p-3.5 flex flex-col justify-between border-t-2 border-t-indigo-600 bg-indigo-50/15">
          <div className="flex items-center justify-between text-indigo-900 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Emergency Alerts</span>
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-950">
            {alertsFeed.length}
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold">Realtime Sync Active</span>
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
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'STABLE', 'RESOLVED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all whitespace-nowrap ${
                  filterRisk === filter
                    ? filter === 'RESOLVED' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-[#0f2557] text-white'
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
              placeholder="Search by ID, District, Keywords..."
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
                const cleanName = getCleanCodeName(item);

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
                            {cleanName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium line-clamp-1">
                          {item.summary}
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

                      <span className="font-bold text-slate-900">
                        {item.current_dds} <span className="text-[9px] text-slate-400 font-normal">DDS</span>
                      </span>
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
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Survivor Code: {getCleanCodeName(activeCase)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Date & Time: {formatDateTime(activeCase.updated_at || new Date().toISOString())}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono">{getCleanCodeName(activeCase)}</span>
                    <span className={getRiskBadgeClass(activeCase.current_risk_level)}>
                      {activeCase.current_risk_level} PRIORITY
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span>Jurisdiction: <strong className="text-slate-700">{activeCase.district}, {activeCase.state}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono font-semibold text-indigo-700">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{activeCase.location || userLocation || 'GPS: 19.0760° N, 72.8777° E (Ahmednagar, Maharashtra)'}</span>
                    </span>
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

              {/* SURVIVOR ISSUE & INTAKE DESCRIPTION */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Survivor Issue & Reported Predicament</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(activeCase.updated_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {activeCase.summary || 'Awaiting initial survivor intake description...'}
                </p>
              </div>

              {/* METRICS CARDS: CONDITIONALLY RENDER VOICE METRICS ONLY IF VOICE AUDIO WAS USED */}
              {(() => {
                const hasVoiceMetrics = caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score !== undefined &&
                                        caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score !== null;

                return (
                  <div className={hasVoiceMetrics ? "grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" : "space-y-3 text-xs"}>
                    {/* Voice Biomarker Metrics Card (Rendered ONLY if voice was used) */}
                    {hasVoiceMetrics && (
                      <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <Volume2 className="w-4 h-4 text-indigo-600" />
                            Voice Biomarker Metrics (Audio)
                          </span>
                          <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            {caseFile.latest_voice_spectrogram_biomarkers.acoustic_stress_score} / 100
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${caseFile.latest_voice_spectrogram_biomarkers.acoustic_stress_score}%`
                            }}
                          ></div>
                        </div>

                        <div className="text-[11px] text-indigo-900 space-y-1">
                          <p className="font-semibold text-slate-800">
                            Classification: <span className="font-normal text-indigo-900">{
                              caseFile.latest_voice_spectrogram_biomarkers.acoustic_classification || 'Acoustic Signal Analyzed'
                            }</span>
                          </p>
                          {caseFile.latest_voice_spectrogram_biomarkers.tremor_intensity !== undefined && (
                            <p className="text-[10px] text-slate-600">
                              Tremor Intensity: {caseFile.latest_voice_spectrogram_biomarkers.tremor_intensity}/100 • Pitch: {caseFile.latest_voice_spectrogram_biomarkers.pitch_mean_hz ?? 'Normal'} Hz
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat & Linguistic Metrics Card */}
                    <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                        <span className="font-bold text-purple-950 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          Chat & Text Metrics (NLP)
                        </span>
                        <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                          {caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score !== undefined && caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score !== null
                            ? `${caseFile.latest_nlp_emotion_matrix.nlp_distress_score} / 100`
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score !== undefined && caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score !== null
                                ? caseFile.latest_nlp_emotion_matrix.nlp_distress_score
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>

                      <div className="text-[11px] text-purple-900 space-y-1">
                        {caseFile?.latest_nlp_emotion_matrix ? (
                          <>
                            <p className="font-semibold text-slate-800">
                              Fear Score: <span className="font-normal text-purple-900">{caseFile.latest_nlp_emotion_matrix.fear_score ?? 0}%</span> • Hopelessness: <span className="font-normal text-purple-900">{caseFile.latest_nlp_emotion_matrix.hopelessness_score ?? 0}%</span>
                            </p>
                            {caseFile.latest_nlp_emotion_matrix.extracted_threat_keywords?.length > 0 && (
                              <p className="text-[10px] text-purple-800">
                                Threat Cues: {caseFile.latest_nlp_emotion_matrix.extracted_threat_keywords.join(', ')}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-500 font-normal">No chat or text transcripts analyzed yet for this session</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

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

                {/* Mark Case Resolved Action Button for Police Authorities */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Status: <strong className={activeCase?.current_risk_level === 'RESOLVED' ? 'text-emerald-700 font-bold' : 'text-slate-800'}>{activeCase?.current_risk_level || 'ACTIVE'}</strong>
                  </span>

                  {activeCase?.current_risk_level !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleMarkResolved(activeCase?.victim_id)}
                      disabled={isActionLoading}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Mark Protection Enforced / Resolve Case ➔</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Case Protection Resolved ✓
                    </span>
                  )}
                </div>
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
