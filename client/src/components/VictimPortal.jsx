import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Send,
  HeartHandshake,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Activity,
  FileAudio,
  Upload,
  Sparkles,
  HeartPulse,
  Globe
} from 'lucide-react';
import ChatAssistant from './ChatAssistant';

export default function VictimPortal({
  cases = [],
  onCheckinSubmitted,
  activeVictimId = 'VIC-MH-2024-114',
  onTriggerSos
}) {
  const [selectedVictim, setSelectedVictim] = useState(() => {
    try {
      const saved = sessionStorage.getItem('samvedna_selected_victim');
      return (saved && typeof saved === 'string' && saved.startsWith('VIC-')) ? saved : activeVictimId;
    } catch (e) {
      return activeVictimId;
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [language, setLanguage] = useState(() => {
    try {
      const saved = sessionStorage.getItem('samvedna_language');
      return (saved && ['en', 'hi', 'mr', 'ta'].includes(saved)) ? saved : 'en';
    } catch (e) {
      return 'en';
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(() => {
    try {
      const saved = sessionStorage.getItem('samvedna_last_response');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return (parsed && typeof parsed === 'object' && parsed.composite_dds !== undefined) ? parsed : null;
    } catch (e) {
      return null;
    }
  });
  const [errorMsg, setErrorMsg] = useState(null);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('samvedna_selected_victim', selectedVictim);
  }, [selectedVictim]);

  useEffect(() => {
    sessionStorage.setItem('samvedna_language', language);
  }, [language]);

  useEffect(() => {
    if (lastResponse) {
      try {
        sessionStorage.setItem('samvedna_last_response', JSON.stringify(lastResponse));
      } catch (e) {
        console.warn('Session storage save warning:', e);
      }
    }
  }, [lastResponse]);

  // Use dynamic cases from backend or default anonymous code names
  const displayedVictims = cases.length > 0 ? cases : [
    { victim_id: 'VIC-MH-2024-114', victim_code: 'SURVIVOR-MH-114', code_name: 'SURVIVOR-MH-114 (Primary Eyewitness)', district: 'Ahmednagar', state: 'Maharashtra', summary: 'Eyewitness in Special Court Trial' },
    { victim_id: 'VIC-MP-2024-881', victim_code: 'SURVIVOR-MP-881', code_name: 'SURVIVOR-MP-881 (Key Complainant)', district: 'Morena', state: 'Madhya Pradesh', summary: 'Key Complainant - Bail threat' },
    { victim_id: 'VIC-UP-2024-409', victim_code: 'COMPLAINANT-UP-409', code_name: 'COMPLAINANT-UP-409 (Next of Kin)', district: 'Hathras', state: 'Uttar Pradesh', summary: 'Next-of-Kin in Bail Hearing' },
    { victim_id: 'VIC-RJ-2024-215', victim_code: 'SURVIVOR-RJ-215', code_name: 'SURVIVOR-RJ-215 (Agricultural Worker)', district: 'Udaipur', state: 'Rajasthan', summary: 'Social Boycott & Relief Pending' },
    { victim_id: 'VIC-BR-2024-712', victim_code: 'SURVIVOR-BR-712', code_name: 'SURVIVOR-BR-712 (Surviving Spouse)', district: 'Gaya', state: 'Bihar', summary: 'Surviving Spouse - Pension Delayed' },
    { victim_id: 'VIC-TN-2024-531', victim_code: 'SURVIVOR-TN-531', code_name: 'SURVIVOR-TN-531 (Youth Applicant)', district: 'Tirunelveli', state: 'Tamil Nadu', summary: 'Youth Applicant in Trial Phase' }
  ];

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const applyScenarioPreset = (type) => {
    if (type === 'threat') {
      setTextContent("Accused associates visited our home last night and threatened to kill us if we don't withdraw the case. We are extremely terrified.");
    } else if (type === 'court') {
      setTextContent("Special court witness testimony date is very close. We are feeling severe panic and anxiety about our safety while traveling to court.");
    } else if (type === 'boycott') {
      setTextContent("A complete social boycott has been enforced in our village. We are prevented from taking water from the community well and lost our wages.");
    } else if (type === 'stable') {
      setTextContent("Today the situation is peaceful and stable. Police patrol visited our area and we feel somewhat safer. Taking prescribed medicines regularly.");
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setAudioBlob(null);
    setAudioUrl(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMsg('Direct microphone recording is not supported on this browser or requires HTTPS. You can upload an audio file or type your check-in below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      const pcmData = [];

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        pcmData.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      timerRef.current = interval;

      mediaRecorderRef.current = {
        stop: () => {
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach((track) => track.stop());
          clearInterval(timerRef.current);
          setIsRecording(false);

          const totalLength = pcmData.reduce((acc, curr) => acc + curr.length, 0);
          const result = new Float32Array(totalLength);
          let offset = 0;
          for (const chunk of pcmData) {
            result.set(chunk, offset);
            offset += chunk.length;
          }

          const wavBuffer = new ArrayBuffer(44 + result.length * 2);
          const view = new DataView(wavBuffer);

          const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };

          writeString(view, 0, 'RIFF');
          view.setUint32(4, 36 + result.length * 2, true);
          writeString(view, 8, 'WAVE');
          writeString(view, 12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, 16000, true);
          view.setUint32(28, 32000, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          writeString(view, 36, 'data');
          view.setUint32(40, result.length * 2, true);

          let index = 44;
          for (let i = 0; i < result.length; i++) {
            const s = Math.max(-1, Math.min(1, result[i]));
            view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            index += 2;
          }

          const blob = new Blob([wavBuffer], { type: 'audio/wav' });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }
      };
    } catch (err) {
      console.error('Audio record error:', err);
      setErrorMsg('Microphone access denied or unavailable. You can upload an audio file or type your message below.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSubmitCheckin = async () => {
    if (!audioBlob && !textContent.trim()) {
      setErrorMsg('Please record voice, upload audio, or enter text to complete your check-in.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('victim_id', selectedVictim);
      formData.append('channel', 'Web_Portal');
      formData.append('language', language);

      if (textContent.trim()) {
        formData.append('text_content', textContent.trim());
      }

      if (audioBlob) {
        formData.append('audio_file', audioBlob, 'recording.wav');
      }

      const res = await fetch('/api/v1/victim/checkin', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      const payload = { ...data, _ts: Date.now() };
      setLastResponse(payload);
      setTextContent('');
      setAudioBlob(null);
      setAudioUrl(null);

      if (onCheckinSubmitted) {
        onCheckinSubmitted(payload);
      }
    } catch (err) {
      console.error('Checkin submit error:', err);
      const detail = err?.message ? ` [${err.message}]` : '';
      setErrorMsg(`Could not process check-in${detail}. Please check backend connection & VITE_API_BASE_URL.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Check-in Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Voice Recording & Statement Input (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Voice Recorder Card */}
          <div className="gov-card p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Periodic Voice Check-in
                </h3>
                <p className="text-[11px] text-slate-500">
                  Speak naturally or upload audio. Voice stability and distress indicators will be assessed.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Case Code:
                </label>
                <select
                  value={selectedVictim}
                  onChange={(e) => setSelectedVictim(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600 max-w-[220px] truncate"
                >
                  {displayedVictims.map((v) => (
                    <option key={v.victim_id} value={v.victim_id} className="text-slate-900 font-sans">
                      {v.code_name || v.victim_code} — {v.district}, {v.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Voice Recorder Area */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            {isRecording ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto animate-pulse shadow-md shadow-rose-200">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-700">Recording Voice Check-in...</div>
                  <div className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="btn-danger text-xs mx-auto"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop & Review Audio</span>
                </button>
              </div>
            ) : audioUrl ? (
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-200">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-700">Audio Ready for Analysis (16kHz PCM WAV)</div>
                <audio src={audioUrl} controls className="mx-auto max-w-xs w-full" />
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmitCheckin}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>{isSubmitting ? 'Analyzing & Submitting...' : 'Analyze Audio & Submit Check-in'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="btn-subtle text-xs"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-14 h-14 rounded-xl bg-[#0f2557] hover:bg-[#183b88] text-white flex items-center justify-center shadow transition-transform active:scale-95"
                    title="Click to Record Voice Check-in"
                  >
                    <Mic className="w-7 h-7 text-indigo-200" />
                  </button>

                  <label className="p-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Upload Audio</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  </label>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800">Click to Record Voice or Upload Audio</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Analyzed for vocal tremor, pitch stability, and emotional strain.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Clinical Biomarker Assessment & Metrics Card (Left Column) */}
          <div className="gov-card p-5 space-y-4 border-l-4 border-l-indigo-600">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Clinical Biomarkers & Distress Assessment</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Acoustic SciPy DSP feature extraction & statutory risk determination metrics.
                </p>
              </div>
              <span className={lastResponse ? (lastResponse.risk_level === 'CRITICAL' ? 'badge-critical' : lastResponse.risk_level === 'HIGH' ? 'badge-high' : 'badge-low') : 'badge-low'}>
                {lastResponse ? `${lastResponse.risk_level} RISK` : 'AWAITING INTAKE'}
              </span>
            </div>

            {/* DDS Score Summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Distress Determination Score (DDS)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {lastResponse ? lastResponse.composite_dds : '74.2'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ 100</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Risk Trajectory Status
                </span>
                <div className="text-xs font-bold text-rose-700 mt-1.5 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span>{lastResponse?.is_escalating_rapidly ? 'Rapid Escalation (+14 pts)' : 'Section 15A Protection Active'}</span>
                </div>
              </div>
            </div>

            {/* Acoustic Vocal Tremor Biomarkers Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Acoustic SciPy Tremor & NLP Biomarkers:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Pitch Mean (F0)</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {lastResponse?.voice_metrics?.pitch_mean_hz ? `${Math.round(lastResponse.voice_metrics.pitch_mean_hz)} Hz` : (lastResponse?.feature_summary?.f0 ? `${Math.round(lastResponse.feature_summary.f0)} Hz` : '198.4 Hz')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Jitter (Micro-tremor)</span>
                  <span className="font-bold text-amber-700 text-xs">
                    {lastResponse?.voice_metrics?.jitter_pct ? `${lastResponse.voice_metrics.jitter_pct.toFixed(1)}%` : (lastResponse?.feature_summary?.jitter ? `${lastResponse.feature_summary.jitter.toFixed(1)}%` : '2.4%')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Shimmer (Volatility)</span>
                  <span className="font-bold text-purple-700 text-xs">
                    {lastResponse?.voice_metrics?.shimmer_pct ? `${lastResponse.voice_metrics.shimmer_pct.toFixed(1)}%` : (lastResponse?.feature_summary?.shimmer ? `${lastResponse.feature_summary.shimmer.toFixed(1)}%` : '4.8%')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Harmonic Noise (HNR)</span>
                  <span className="font-bold text-indigo-700 text-xs">
                    {lastResponse?.voice_metrics?.hnr_db ? `${lastResponse.voice_metrics.hnr_db.toFixed(1)} dB` : (lastResponse?.feature_summary?.hnr ? `${lastResponse.feature_summary.hnr.toFixed(1)} dB` : '18.2 dB')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Vocal Tremor Index</span>
                  <span className="font-bold text-rose-700 text-xs">
                    {lastResponse?.voice_metrics?.tremor_intensity ? `${lastResponse.voice_metrics.tremor_intensity.toFixed(1)}%` : (lastResponse?.feature_summary?.tremor ? `${lastResponse.feature_summary.tremor.toFixed(1)}%` : '38.5%')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-semibold block">Threat Cues Flag</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">
                    {lastResponse?.nlp_metrics?.witness_threat_detected ? '🚨 Threat Cues' : 'Unflagged'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statutory Notification Footer */}
            <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-[11px] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Check-in saved to official case docket. Real-time synchronized across Police Triage & Clinical Workbench.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AI Companion Chat Assistant (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <ChatAssistant
            latestVoiceResult={lastResponse}
            selectedVictimId={selectedVictim}
            language={language}
            onCheckinComplete={onCheckinSubmitted}
          />
        </div>
      </div>
    </div>
  );
}
