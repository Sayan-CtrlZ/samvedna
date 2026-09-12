import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  Activity,
  Volume2,
  FileText,
  Send,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Brain,
  Headphones,
  Stethoscope,
  UserCheck,
  ClipboardList,
  HeartPulse,
  MessageSquare
} from 'lucide-react';
import { getApiUrl, DEFAULT_CASES } from '../utils/api';

export default function CounsellorWorkbench({
  cases = [],
  selectedVictimId,
  onSelectVictim,
  userLocation
}) {
  const activeCases = cases.length > 0 ? cases : DEFAULT_CASES;
  const [activeVictimId, setActiveVictimId] = useState(() => {
    if (selectedVictimId && activeCases.some(c => c.victim_id === selectedVictimId)) {
      return selectedVictimId;
    }
    try {
      const saved = sessionStorage.getItem('samvedna_active_official_case');
      if (saved && activeCases.some(c => c.victim_id === saved)) return saved;
    } catch (e) {}
    return activeCases[0]?.victim_id ?? 'VIC-MP-881';
  });
  const [caseFile, setCaseFile] = useState(null);
  const [officerNote, setOfficerNote] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: Format ISO date string into readable Date & Time
  const formatDateTime = (isoString) => {
    if (!isoString) return 'Just now';
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
    let code = typeof item === 'string' ? item : (item.victim_code || item.code_name || item.victim_id || 'SURVIVOR');
    code = code.replace(/#/g, '')
               .replace(/-2024-/g, '-')
               .replace(/ \([^)]*\)/g, '');
    return code;
  };

  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

  useEffect(() => {
    if (selectedVictimId) {
      setActiveVictimId(selectedVictimId);
    }
  }, [selectedVictimId]);

  const loadCaseFile = async (vId) => {
    try {
      const res = await fetch(getApiUrl(`/api/v1/counsellor/case-file/${vId}`));
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        setCaseFile(await res.json());
      }
    } catch (e) {
      console.warn('Failed loading counsellor case-file:', e);
    }
  };

  useEffect(() => {
    if (activeVictimId) {
      loadCaseFile(activeVictimId);
    }
  }, [activeVictimId]);

  // Longitudinal Distress Line Chart
  useEffect(() => {
    if (!lineChartRef.current) return;
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    const trajectory = caseFile?.longitudinal_trajectory || [];
    const rawLabels = trajectory.map((t) => t.timestamp || 'Check-in');
    const ddsData = trajectory.map((t) => t.dds);
    const voiceData = trajectory.map((t) => t.voice_stress);
    const nlpData = trajectory.map((t) => t.nlp_distress);

    const formatTimestamp = (ts, idx, total) => {
      if (!ts) return `Check-in ${idx + 1}`;
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          return idx === total - 1 ? `${dateStr} (Latest)` : dateStr;
        }
      } catch (e) {}
      return ts;
    };

    const hasTrajectory = trajectory.length > 0;
    const finalLabels = hasTrajectory
      ? rawLabels.map((l, i) => formatTimestamp(l, i, rawLabels.length))
      : ['Live Intake Assessment'];
    const finalDds = hasTrajectory ? ddsData : [caseFile?.victim_profile?.current_dds || 0];
    const finalVoice = hasTrajectory ? voiceData : [caseFile?.latest_voice_spectrogram_biomarkers?.acoustic_stress_score || 0];
    const finalNlp = hasTrajectory ? nlpData : [caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score || 0];

    const ctx = lineChartRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(225, 29, 72, 0.22)');
    gradient.addColorStop(0.8, 'rgba(225, 29, 72, 0.02)');
    gradient.addColorStop(1, 'rgba(225, 29, 72, 0.00)');

    lineChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: finalLabels,
        datasets: [
          {
            label: 'Composite Distress Score (DDS)',
            data: finalDds,
            borderColor: '#dc2626',
            backgroundColor: gradient,
            fill: true,
            tension: 0.32,
            borderWidth: 2.5,
            pointBackgroundColor: '#dc2626',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Vocal Tremor Stress',
            data: finalVoice,
            borderColor: '#1e3a8a',
            backgroundColor: 'transparent',
            borderDash: [5, 4],
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#1e3a8a',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'NLP Threat Index',
            data: finalNlp,
            borderColor: '#7c3aed',
            backgroundColor: 'transparent',
            borderDash: [2, 3],
            tension: 0.3,
            borderWidth: 2,
            pointBackgroundColor: '#7c3aed',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Sec 15A Alert Threshold (70 DDS)',
            data: finalLabels.map(() => 70),
            borderColor: 'rgba(239, 68, 68, 0.45)',
            backgroundColor: 'transparent',
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
            bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.label.includes('Threshold')) {
                  return ` Statutory Alert Line: 70 DDS`;
                }
                return ` ${ctx.dataset.label}: ${ctx.parsed.y} / 100`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              stepSize: 20,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
              color: '#64748b',
              callback: (val) => `${val} DDS`
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              color: '#475569'
            }
          }
        }
      }
    });

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
    };
  }, [caseFile]);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!officerNote.trim() || !activeVictimId) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('victim_id', activeVictimId);
      formData.append('counsellor_name', 'Dr. A. Sharma (Senior Trauma Psychologist - Tele-MANAS)');
      formData.append('clinical_observations', officerNote.trim());
      formData.append('interventions_authorized', 'Tele-MANAS Trauma Sessions, Witness Protection Requisition');
      formData.append('next_follow_up_days', '3');

      const res = await fetch(getApiUrl('/api/v1/counsellor/note'), {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setOfficerNote('');
        setNoteSuccess(true);
        await loadCaseFile(activeVictimId);
        setTimeout(() => setNoteSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed saving note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentVictim = caseFile?.victim_profile || cases.find((c) => c.victim_id === activeVictimId);
  const acoustic = caseFile?.latest_voice_spectrogram_biomarkers || {};

  return (
    <div className="space-y-4">
      {/* Case Selector Strip */}
      <div className="gov-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5 text-purple-800" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Psychiatric Case Docket
            </span>
            <select
              value={activeVictimId}
              onChange={(e) => {
                setActiveVictimId(e.target.value);
                if (onSelectVictim) onSelectVictim(e.target.value);
              }}
              className="bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              {activeCases.map((c) => {
                const cleanCode = getCleanCodeName(c);
                return (
                  <option key={c.victim_id} value={c.victim_id}>
                    {cleanCode} ({c.district}, {c.state})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-medium flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-purple-700" /> Tele-MANAS Tier-2 Protocol Active
          </span>
        </div>
      </div>

      {/* Main Grid: Longitudinal Graph & Acoustic Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Longitudinal Trajectory Graph (7 cols) */}
        <div className="lg:col-span-7 gov-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-700" />
                <span>Longitudinal Distress Trajectory (Time-Series)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Continuous distress tracking across investigation, bail hearings, and court trial.
              </p>
            </div>
            {(() => {
              const dds = currentVictim?.current_dds ?? 84.0;
              const isCrit = dds >= 70;
              const isMod = dds >= 45 && dds < 70;
              const badgeBg = isCrit
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : isMod
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300';
              const label = isCrit ? 'Critical Alert' : isMod ? 'Moderate Distress' : 'Stable';
              return (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 self-start sm:self-auto ${badgeBg}`}>
                  <span className={`w-2 h-2 rounded-full ${isCrit ? 'bg-rose-600 animate-pulse' : isMod ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                  <span>{label}: <strong>{dds} DDS</strong></span>
                </span>
              );
            })()}
          </div>

          {/* Clean Interactive Legend Bar */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium bg-slate-50/80 p-2 rounded-lg border border-slate-200/80">
            <span className="flex items-center gap-1.5 text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              Composite Distress (DDS)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
              <span className="w-3 border-b-2 border-dashed border-slate-800"></span>
              Vocal Tremor Stress
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              <span className="w-3 border-b-2 border-dotted border-indigo-600"></span>
              NLP Threat Sentiment
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-300/80 ml-auto text-[10px]">
              <span className="w-3 border-b-2 border-dashed border-red-500"></span>
              Statutory Protection Threshold (70 DDS)
            </span>
          </div>

          {/* High-Resolution Chart Canvas */}
          <div className="h-72 sm:h-80 relative w-full">
            <canvas ref={lineChartRef}></canvas>
          </div>
        </div>

        {/* Separate Voice & Chat Metrics Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Survivor Reported Issue Brief */}
          <div className="gov-card p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Survivor Reported Issue
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {currentVictim?.summary || 'Awaiting initial survivor intake description...'}
            </p>
          </div>

          {/* Voice Biomarker Metrics Card (Rendered ONLY if voice was used) */}
          {acoustic && acoustic.acoustic_stress_score !== undefined && acoustic.acoustic_stress_score !== null && (
            <div className="gov-card p-4 space-y-2.5">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Voice Biomarker Metrics (Audio)</span>
                </h3>
                <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {acoustic.acoustic_stress_score} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Tremor Intensity</span>
                  <span className="font-bold text-rose-700 text-sm">
                    {acoustic.tremor_intensity !== undefined ? `${acoustic.tremor_intensity} / 100` : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Vocal Jitter</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {acoustic.jitter_pct !== undefined ? `${acoustic.jitter_pct}%` : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Vocal Shimmer</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {acoustic.shimmer_pct !== undefined ? `${acoustic.shimmer_pct}%` : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Mean Pitch (F0)</span>
                  <span className="font-bold text-teal-700 text-sm">
                    {acoustic.pitch_mean_hz !== undefined ? `${acoustic.pitch_mean_hz} Hz` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50/60 rounded border border-indigo-200 text-xs">
                <span className="text-[10px] text-indigo-900 font-bold block mb-0.5">Classification</span>
                <p className="text-[11px] text-indigo-950 font-medium">
                  {acoustic.acoustic_classification || 'No audio sample recorded yet for this session'}
                </p>
              </div>
            </div>
          )}

          {/* Chat & Text Metrics Card */}
          <div className="gov-card p-4 space-y-2.5">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>Chat & Text Metrics (NLP)</span>
              </h3>
              <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {caseFile?.latest_nlp_emotion_matrix?.nlp_distress_score !== undefined
                  ? `${caseFile.latest_nlp_emotion_matrix.nlp_distress_score} / 100`
                  : 'N/A'}
              </span>
            </div>

            {caseFile?.latest_nlp_emotion_matrix ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">Fear Score</span>
                    <span className="font-bold text-purple-700 text-sm">{caseFile.latest_nlp_emotion_matrix.fear_score ?? 0}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">Hopelessness</span>
                    <span className="font-bold text-purple-700 text-sm">{caseFile.latest_nlp_emotion_matrix.hopelessness_score ?? 0}%</span>
                  </div>
                </div>
                {caseFile.latest_nlp_emotion_matrix.extracted_threat_keywords?.length > 0 && (
                  <div className="p-2 bg-purple-50 rounded border border-purple-200 text-[11px] text-purple-900">
                    <strong>Detected Threat Cues:</strong> {caseFile.latest_nlp_emotion_matrix.extracted_threat_keywords.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-normal">No text or chat messages analyzed yet for this session</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
