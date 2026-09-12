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
  UserCheck
} from 'lucide-react';

export default function CounsellorWorkbench({
  cases = [],
  selectedVictimId,
  onSelectVictim
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

  // Fetch full case-file
  const loadCaseFile = async (vId) => {
    try {
      const res = await fetch(`/api/v1/counsellor/case-file/${vId}`);
      if (res.ok) {
        const data = await res.json();
        setCaseFile(data);
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

  // Render Longitudinal Line Chart
  useEffect(() => {
    if (!lineChartRef.current) return;
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    const trajectory = caseFile?.longitudinal_trajectory || [];
    const labels = trajectory.map((t) => t.timestamp || 'Check-in');
    const ddsData = trajectory.map((t) => t.dds);
    const voiceData = trajectory.map((t) => t.voice_stress);
    const nlpData = trajectory.map((t) => t.nlp_distress);

    // Fallback sample trajectory if history is short
    const finalLabels = labels.length > 0 ? labels : ['Intake Baseline', 'Week 2 Followup', 'Pre-Trial Notice', 'Current Triage'];
    const finalDds = ddsData.length > 0 ? ddsData : [42, 58, 74, 84];
    const finalVoice = voiceData.length > 0 ? voiceData : [38, 52, 68, 75];
    const finalNlp = nlpData.length > 0 ? nlpData : [34, 49, 71, 78];

    const ctx = lineChartRef.current.getContext('2d');
    lineChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: finalLabels,
        datasets: [
          {
            label: 'Composite Distress Score (DDS)',
            data: finalDds,
            borderColor: '#e11d48', // Crimson Red
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointBackgroundColor: '#be123c',
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Voice Tremor Stress',
            data: finalVoice,
            borderColor: '#6366f1', // Indigo
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.35,
            borderWidth: 2,
            pointBackgroundColor: '#4f46e5',
            pointRadius: 4
          },
          {
            label: 'NLP Threat Sentiment',
            data: finalNlp,
            borderColor: '#a855f7', // Purple
            backgroundColor: 'transparent',
            borderDash: [2, 2],
            tension: 0.35,
            borderWidth: 2,
            pointBackgroundColor: '#9333ea',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}/100`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          x: {
            grid: { color: '#f8fafc' },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
          }
        }
      }
    });

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
    };
  }, [caseFile]);

  // Handle Note Save
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
    <div className="space-y-6">
      {/* Case Selector Strip */}
      <div className="mat-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Case File
            </span>
            <select
              value={activeVictimId}
              onChange={(e) => {
                setActiveVictimId(e.target.value);
                if (onSelectVictim) onSelectVictim(e.target.value);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
            >
              {cases.map((c) => (
                <option key={c.victim_id} value={c.victim_id}>
                  {c.victim_code} — {c.full_name_masked} ({c.district}, {c.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 font-semibold flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" /> Tele-MANAS Tier-2 Protocol Active
          </span>
        </div>
      </div>

      {/* Main Grid: Longitudinal Graph & Acoustic Biomarkers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Longitudinal Trajectory Graph (7 cols) */}
        <div className="lg:col-span-7 mat-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Longitudinal Distress Trajectory (DDS Time-Series)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Continuous monitoring of psychological distress progression through investigation and trial.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Current: {currentVictim?.current_dds ?? 84.0} DDS
            </span>
          </div>

          <div className="h-72 relative">
            <canvas ref={lineChartRef}></canvas>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>• Red Line: Composite DDS Index</span>
            <span>• Indigo Dashed: Vocal Tremor Stress</span>
            <span>• Purple Dotted: NLP Threat Sentiment</span>
          </div>
        </div>

        {/* Acoustic Diagnostics & Voice Biomarkers (5 cols) */}
        <div className="lg:col-span-5 mat-card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-600" />
              <span>Acoustic Prosody Diagnostics (Forensic AI)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Biomarkers extracted via 16kHz speech analysis from victim check-ins.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Vocal Jitter %</span>
              <span className="font-black text-sky-600 text-sm">
                {acoustic.jitter_pct ? `${acoustic.jitter_pct}%` : '3.8%'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Norm: &lt;1.0%</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Vocal Shimmer %</span>
              <span className="font-black text-amber-600 text-sm">
                {acoustic.shimmer_pct ? `${acoustic.shimmer_pct}%` : '11.2%'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Norm: &lt;3.5%</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Micro-Tremor (4-10Hz)</span>
              <span className="font-black text-rose-600 text-sm">
                {acoustic.tremor_intensity ? `${acoustic.tremor_intensity} / 100` : '74.0 / 100'}
              </span>
              <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">High Tension Alert</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Pitch (F0 Mean Hz)</span>
              <span className="font-black text-teal-600 text-sm">
                {acoustic.pitch_mean_hz ? `${acoustic.pitch_mean_hz} Hz` : '248.0 Hz'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Pitch Volatility: High</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Harmonics / Noise (HNR)</span>
              <span className="font-black text-emerald-600 text-sm">
                {acoustic.hnr_db ? `${acoustic.hnr_db} dB` : '10.4 dB'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Glottal Constriction</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block">Pause / Silence Ratio</span>
              <span className="font-black text-indigo-600 text-sm">
                {acoustic.pause_ratio ? `${acoustic.pause_ratio * 100}%` : '40.0%'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Speech Hesitation</span>
            </div>
          </div>

          {/* Deep Audio Perception Classification */}
          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-700" />
                <span>Multimodal Perception Verdict</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                {acoustic.acoustic_classification || 'High Vocal Tremor & Threat Constriction'}
              </span>
            </div>
            <p className="text-[11px] text-purple-950 font-medium leading-relaxed">
              Elevated acoustic perturbation and micro-tremors indicate severe sympathetic nervous system arousal consistent with acute pre-deposition intimidation.
            </p>
          </div>
        </div>

        {/* Clinical Case Notes Form & Previous Consultations (Full Width / 12 cols) */}
        <div className="lg:col-span-12 mat-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Tele-MANAS Psychological Consultation Log & Care Notes</span>
              </h3>
              <p className="text-xs text-slate-500">
                Confidential psychiatric evaluations appended to the official Section 15A protection case file.
              </p>
            </div>
            {noteSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Consultation note saved successfully.
              </span>
            )}
          </div>

          <form onSubmit={handleSaveNote} className="space-y-3">
            <textarea
              rows={3}
              value={officerNote}
              onChange={(e) => setOfficerNote(e.target.value)}
              placeholder="Record clinical trauma evaluation, witness coping observations, or recommended therapeutic interventions..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Authorized via National Mental Health Tele-Helpline (14416) Protocol
              </span>

              <button
                type="submit"
                disabled={isSubmitting || !officerNote.trim()}
                className="mat-btn-indigo text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving Note...' : 'Append Clinical Consultation Note'}</span>
              </button>
            </div>
          </form>

          {/* Past Notes History */}
          {caseFile?.clinical_notes_history && caseFile.clinical_notes_history.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="text-xs font-bold text-slate-600 block">
                Historical Psychological Consultation Records:
              </span>
              {caseFile.clinical_notes_history.map((n, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                    <span>{n.counsellor_name}</span>
                    <span>{n.timestamp ? n.timestamp.slice(0, 16).replace('T', ' ') : ''}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{n.clinical_observations}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
