import React from 'react';
import { Activity, ShieldAlert, HeartHandshake, CheckCircle2, Mic, MessageSquare, Sparkles, Volume2, Info, Compass } from 'lucide-react';

export default function WellbeingMetrics({ metrics }) {
  // If no check-in has been performed yet, show the awaiting/prompt state as requested
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="bg-white border-2 border-slate-200 shadow-md shadow-slate-100/50 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600">
            <Activity className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">
            Awaiting Your Check-in
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-6 font-medium">
            Record a voice check-in or send a message to analyze your well-being, voice characteristics, and distress indicators.
          </p>

          <div className="space-y-3 text-left">
            <div className="bg-[#eff6ff] border-2 border-blue-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Step 1: Voice or Text</span>
                <span className="text-[11px] text-slate-600 font-medium">Record a voice note or type what's on your mind.</span>
              </div>
            </div>

            <div className="bg-[#f5f3ff] border-2 border-purple-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Step 2: Instant Analysis</span>
                <span className="text-[11px] text-slate-600 font-medium">Vocal tremor, pitch stability, and sentiment are assessed.</span>
              </div>
            </div>

            <div className="bg-[#ecfdf5] border-2 border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Step 3: Real-Time Results</span>
                <span className="text-[11px] text-slate-600 font-medium">Your score and personalized care advice will appear right here.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const score = metrics.composite_dds ?? 0;
  const riskLevel = metrics.risk_level ?? 'LOW';
  const voiceMetrics = metrics.voice_metrics ?? {};
  const factors = metrics.explainable_factors ?? [];
  const interventions = metrics.recommended_interventions ?? [];

  // Map risk level to human-friendly title and color scheme
  const getRiskStatus = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
      case 'EMERGENCY_SOS':
        return {
          title: 'Immediate Support Recommended',
          color: 'text-rose-700',
          bg: 'bg-rose-100',
          border: 'border-rose-300',
          topBorder: 'border-t-rose-600',
          barColor: 'from-rose-500 to-red-600',
          desc: 'High distress or safety concerns detected. Priority emergency support options have been activated.',
        };
      case 'HIGH':
        return {
          title: 'Elevated Concern',
          color: 'text-amber-800',
          bg: 'bg-amber-100',
          border: 'border-amber-300',
          topBorder: 'border-t-amber-500',
          barColor: 'from-amber-500 to-orange-600',
          desc: 'Noticeable signs of tension or anxiety observed. Talking with a counsellor is recommended.',
        };
      case 'MODERATE':
        return {
          title: 'Moderate Stress',
          color: 'text-yellow-800',
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          topBorder: 'border-t-yellow-500',
          barColor: 'from-yellow-400 to-amber-500',
          desc: 'Mild tension observed. Consider breathing exercises or taking a brief rest.',
        };
      default:
        return {
          title: 'Stable & Calm',
          color: 'text-emerald-800',
          bg: 'bg-emerald-100',
          border: 'border-emerald-300',
          topBorder: 'border-t-emerald-500',
          barColor: 'from-emerald-400 to-teal-500',
          desc: 'Acoustic and message signals indicate a steady and safe emotional state.',
        };
    }
  };

  const status = getRiskStatus(riskLevel);
  const hasVoiceMetrics =
    voiceMetrics &&
    (voiceMetrics.pitch_mean_hz != null ||
      voiceMetrics.jitter_pct != null ||
      voiceMetrics.tremor_intensity != null);

  return (
    <div className="space-y-6">
      {/* Primary Distress / Well-being Score Card */}
      <div className={`bg-white border-2 border-slate-200 border-t-8 ${status.topBorder} shadow-md rounded-2xl p-6 sm:p-7`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Well-being & Stress Assessment</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Live evaluation based on your latest check-in</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${status.bg} ${status.color} border ${status.border}`}>
            {status.title}
          </span>
        </div>

        {/* Score Display Box */}
        <div className="bg-[#f8fafc] border-2 border-slate-200 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">{Math.round(score)}</span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>

          <div className="w-full sm:w-2/3">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
              <span>Stress Index</span>
              <span>{Math.round(score)}%</span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden p-0.5 border border-slate-300">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${status.barColor} transition-all duration-700`}
                style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-semibold">{status.desc}</p>
      </div>

      {/* Voice Indicators Card (Solid Purple Surface) */}
      {hasVoiceMetrics && (
        <div className="bg-[#f5f3ff] border-2 border-purple-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4 text-purple-700" />
            <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
              Voice Characteristics Observed
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border-2 border-purple-100 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Voice Pitch</span>
              <span className="text-sm font-black text-purple-950">
                {voiceMetrics.pitch_mean_hz ? `${Math.round(voiceMetrics.pitch_mean_hz)} Hz` : 'Steady / Normal'}
              </span>
            </div>
            <div className="bg-white border-2 border-purple-100 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Vocal Tremor</span>
              <span className="text-sm font-black text-purple-950">
                {voiceMetrics.tremor_intensity != null ? `${(voiceMetrics.tremor_intensity > 1.0 ? voiceMetrics.tremor_intensity : voiceMetrics.tremor_intensity * 100).toFixed(1)}%` : 'Low / Relaxed'}
              </span>
            </div>
            <div className="bg-white border-2 border-purple-100 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Rhythm Stability</span>
              <span className="text-sm font-black text-purple-950">
                {voiceMetrics.jitter_pct != null ? `${voiceMetrics.jitter_pct.toFixed(2)}%` : 'Stable'}
              </span>
            </div>
            <div className="bg-white border-2 border-purple-100 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Speech Clarity</span>
              <span className="text-sm font-black text-purple-950">
                {voiceMetrics.hnr_db != null ? `${voiceMetrics.hnr_db.toFixed(1)} dB` : 'Clear'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Explainable Factor Breakdown (Solid Sky Blue Surface) */}
      {factors.length > 0 && (
        <div className="bg-[#eff6ff] border-2 border-blue-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-700" />
            <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
              What Influenced This Assessment
            </h4>
          </div>
          <div className="space-y-2.5">
            {factors.map((factor, idx) => (
              <div key={idx} className="bg-white border-2 border-blue-100 rounded-xl p-3.5 text-xs shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{factor.factor_name}</span>
                  <span className="text-blue-700 font-extrabold">{Math.round(factor.percentage_weight)}% influence</span>
                </div>
                <p className="text-slate-600 text-[11px] font-medium">{factor.description || factor.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Care Steps (Solid Emerald Surface) */}
      {interventions.length > 0 && (
        <div className="bg-[#ecfdf5] border-2 border-emerald-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              Recommended Next Steps
            </h4>
          </div>
          <ul className="space-y-2.5">
            {interventions.map((step, idx) => (
              <li key={idx} className="bg-white border-2 border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-800 font-semibold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{typeof step === 'string' ? step : (step.title || step.description || '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
