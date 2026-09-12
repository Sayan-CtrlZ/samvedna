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
  HeartPulse
} from 'lucide-react';

export default function CounsellorWorkbench({
  cases = [],
  selectedVictimId,
  onSelectVictim,
  userLocation
}) {
  const [activeVictimId, setActiveVictimId] = useState(selectedVictimId || (cases[0]?.victim_id ?? 'VIC-MH-2024-114'));
  const [caseFile, setCaseFile] = useState(null);
  const [officerNote, setOfficerNote] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

  useEffect(() => {
    if (selectedVictimId) {
      setActiveVictimId(selectedVictimId);
    }
  }, [selectedVictimId]);

  const loadCaseFile = async (vId) => {
    try {
      const res = await fetch(`/api/v1/counsellor/case-file/${vId}`);
      if (res.ok) {
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

      const res = await fetch('/api/v1/counsellor/note', {
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
              {cases.map((c) => {
                const cleanCode = c.code_name || (c.victim_code ? c.victim_code.replace(' (Anonymized)', '') : 'Case');
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

        {/* Forensic Acoustic Diagnostics Grid (5 cols) */}
        <div className="lg:col-span-5 gov-card p-4 space-y-3">
          <div className="border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sky-700" />
              <span>Forensic Acoustic Prosody Diagnostics</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Biomarkers derived from 16kHz speech analysis during survivor check-ins.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Vocal Jitter %</span>
              <span className="font-bold text-sky-700 text-sm">
                {acoustic.jitter_pct ? `${acoustic.jitter_pct}%` : '3.8%'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Clinical Norm: &lt;1.0%</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Vocal Shimmer %</span>
              <span className="font-bold text-amber-700 text-sm">
                {acoustic.shimmer_pct ? `${acoustic.shimmer_pct}%` : '11.2%'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Clinical Norm: &lt;3.5%</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Micro-Tremor (4-10Hz)</span>
              <span className="font-bold text-rose-700 text-sm">
                {acoustic.tremor_intensity ? `${acoustic.tremor_intensity} / 100` : '74.0 / 100'}
              </span>
              <span className="text-[9px] text-rose-600 block mt-0.5 font-medium">Sympathetic Constriction</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Pitch (F0 Mean Hz)</span>
              <span className="font-bold text-teal-700 text-sm">
                {acoustic.pitch_mean_hz ? `${acoustic.pitch_mean_hz} Hz` : '248.0 Hz'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Elevated Vocal Strain</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Harmonics / Noise (HNR)</span>
              <span className="font-bold text-emerald-700 text-sm">
                {acoustic.hnr_db ? `${acoustic.hnr_db} dB` : '10.4 dB'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Dysphonic Perturbation</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Pause / Hesitation Ratio</span>
              <span className="font-bold text-indigo-700 text-sm">
                {acoustic.pause_ratio ? `${acoustic.pause_ratio * 100}%` : '40.0%'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Affective Blocking</span>
            </div>
          </div>

          {/* Diagnostic Assessment Card */}
          <div className="p-3 bg-purple-50/70 rounded border border-purple-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider">
                Forensic Psychiatric Summary
              </span>
              <span className="badge-critical">
                {acoustic.acoustic_classification || 'High Vocal Tremor & Threat Constriction'}
              </span>
            </div>
            <p className="text-[11px] text-slate-800 leading-relaxed">
              Vocal tremor and elevated fundamental frequency perturbation indicate severe neuroendocrine arousal consistent with active witness coercion and impending trial apprehension.
            </p>
          </div>
        </div>

        {/* Clinical Care Notes Form (Full Width / 12 cols) */}
        <div className="lg:col-span-12 gov-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
                <span>Tele-MANAS Psychiatric Consultation Record & Treatment Plan</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Official clinical observations appended to the Section 15A Special Court file.
              </p>
            </div>
            {noteSuccess && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Clinical note recorded successfully.
              </span>
            )}
          </div>

          <form onSubmit={handleSaveNote} className="space-y-2.5">
            <textarea
              rows={2}
              value={officerNote}
              onChange={(e) => setOfficerNote(e.target.value)}
              placeholder="Record clinical trauma observations, witness coping capacity, recommended pharmacological or psychotherapeutic care..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 text-slate-800 placeholder-slate-400 font-normal"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Conducted under Rule 5(1)(e) PoA Rules & Tele-MANAS Protocol (14416)
              </span>

              <button
                type="submit"
                disabled={isSubmitting || !officerNote.trim()}
                className="btn-navy text-xs disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'Recording Note...' : 'Record Consultation Note'}</span>
              </button>
            </div>
          </form>

          {/* Past Notes History */}
          {caseFile?.clinical_notes_history && caseFile.clinical_notes_history.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Historical Consultation Records:
              </span>
              {caseFile.clinical_notes_history.map((n, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span>{n.counsellor_name}</span>
                    <span>{n.timestamp ? n.timestamp.slice(0, 16).replace('T', ' ') : ''}</span>
                  </div>
                  <p className="text-slate-700">{n.clinical_observations}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
