import React from 'react';
import { Activity, ShieldAlert, HeartHandshake, CheckCircle2, Mic, MessageSquare, Sparkles } from 'lucide-react';

export default function WellbeingMetrics({ metrics }) {
  // If no check-in has been performed yet, show the waiting/prompt state as requested
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="neu-card p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-600 neu-inset">
            <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>

          <h3 className="text-base font-bold text-slate-800 mb-2">
            Awaiting Your Check-in
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
            Record a voice check-in or send a message to analyze your well-being, voice characteristics, and distress indicators.
          </p>

          <div className="space-y-3 text-left">
            <div className="neu-inset p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Step 1: Voice or Text</span>
                <span className="text-[11px] text-slate-500">Record a brief voice note or type what's on your mind.</span>
              </div>
            </div>

            <div className="neu-inset p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Step 2: Instant Analysis</span>
                <span className="text-[11px] text-slate-500">Vocal tremor, pitch stability, and sentiment are assessed.</span>
              </div>
            </div>

            <div className="neu-inset p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Step 3: Real-Time Results</span>
                <span className="text-[11px] text-slate-500">Your score and personalized care advice will appear right here.</span>
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
          color: 'text-rose-600',
          bg: 'bg-rose-100',
          border: 'border-rose-300',
          barColor: 'from-rose-500 to-red-600',
          desc: 'High distress or safety concerns detected. Priority emergency support options have been activated.',
        };
      case 'HIGH':
        return {
          title: 'Elevated Concern',
          color: 'text-amber-700',
          bg: 'bg-amber-100',
          border: 'border-amber-300',
          barColor: 'from-amber-500 to-orange-600',
          desc: 'Noticeable signs of tension or anxiety observed. Talking with a counsellor is recommended.',
        };
      case 'MODERATE':
        return {
          title: 'Moderate Stress',
          color: 'text-yellow-700',
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          barColor: 'from-yellow-400 to-amber-500',
          desc: 'Mild tension observed. Consider breathing exercises or taking a brief rest.',
        };
      default:
        return {
          title: 'Stable & Calm',
          color: 'text-emerald-700',
          bg: 'bg-emerald-100',
          border: 'border-emerald-300',
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
      <div className="neu-card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Well-being & Stress Assessment</span>
            </h3>
            <p className="text-xs text-slate-500">Live evaluation based on your latest check-in</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color} border ${status.border}`}>
            {status.title}
          </span>
        </div>

        {/* Score Display */}
        <div className="neu-inset p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">{Math.round(score)}</span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </div>

          <div className="w-full sm:w-2/3">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Stress Index</span>
              <span>{Math.round(score)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#d5e0ee] shadow-[inset_2px_2px_4px_#c2cee0] overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${status.barColor} transition-all duration-700`}
                style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">{status.desc}</p>
      </div>

      {/* Voice Indicators Card (shown if voice was analyzed) */}
      {hasVoiceMetrics && (
        <div className="neu-card p-6 sm:p-7">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Voice Characteristics Observed
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="neu-inset p-3">
              <span className="text-[11px] text-slate-500 block">Voice Pitch</span>
              <span className="text-sm font-bold text-slate-800">
                {voiceMetrics.pitch_mean_hz ? `${Math.round(voiceMetrics.pitch_mean_hz)} Hz` : 'Steady / Normal'}
              </span>
            </div>
            <div className="neu-inset p-3">
              <span className="text-[11px] text-slate-500 block">Vocal Tremor</span>
              <span className="text-sm font-bold text-slate-800">
                {voiceMetrics.tremor_intensity != null ? `${(voiceMetrics.tremor_intensity * 100).toFixed(1)}%` : 'Low / Relaxed'}
              </span>
            </div>
            <div className="neu-inset p-3">
              <span className="text-[11px] text-slate-500 block">Rhythm Stability</span>
              <span className="text-sm font-bold text-slate-800">
                {voiceMetrics.jitter_pct != null ? `${voiceMetrics.jitter_pct.toFixed(2)}%` : 'Stable'}
              </span>
            </div>
            <div className="neu-inset p-3">
              <span className="text-[11px] text-slate-500 block">Speech Clarity</span>
              <span className="text-sm font-bold text-slate-800">
                {voiceMetrics.hnr_db != null ? `${voiceMetrics.hnr_db.toFixed(1)} dB` : 'Clear'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Explainable Factor Breakdown */}
      {factors.length > 0 && (
        <div className="neu-card p-6 sm:p-7">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            What Influenced This Assessment
          </h4>
          <div className="space-y-2.5">
            {factors.map((factor, idx) => (
              <div key={idx} className="neu-inset p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{factor.factor_name}</span>
                  <span className="text-indigo-600 font-semibold">{Math.round(factor.percentage_weight)}% influence</span>
                </div>
                <p className="text-slate-500 text-[11px]">{factor.description || factor.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Care Steps */}
      {interventions.length > 0 && (
        <div className="neu-card p-6 sm:p-7">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Recommended Next Steps
          </h4>
          <ul className="space-y-2">
            {interventions.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
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
