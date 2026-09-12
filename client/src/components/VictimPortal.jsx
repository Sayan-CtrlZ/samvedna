import React, { useState, useRef } from 'react';
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
  HeartPulse
} from 'lucide-react';

export default function VictimPortal({
  cases = [],
  onCheckinSubmitted,
  activeVictimId = 'VIC-MH-2024-114',
  onTriggerSos
}) {
  const [selectedVictim, setSelectedVictim] = useState(activeVictimId);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [language, setLanguage] = useState('hi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

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
      setTextContent("आरोपी के लोग कल रात हमारे घर के बाहर आकर धमकी दे रहे थे कि केस वापस ले लो वरना जान से मार देंगे। हमें बहुत डर लग रहा है।");
      setLanguage('hi');
    } else if (type === 'court') {
      setTextContent("विशेष अदालत में गवाही की तारीख बहुत नजदीक आ गई है। हमें अदालत जाने में अपनी सुरक्षा को लेकर बहुत ज्यादा चिंता और घबराहट हो रही है।");
      setLanguage('hi');
    } else if (type === 'boycott') {
      setTextContent("गांव में हमारा सामाजिक बहिष्कार कर दिया गया है। कुएं से पानी नहीं लेने दे रहे और मजदूरी भी बंद करवा दी है। घर में राशन खत्म हो गया है।");
      setLanguage('hi');
    } else if (type === 'stable') {
      setTextContent("आज स्थिति सामान्य है। पुलिस गश्त आई थी और हमें थोड़ा सुरक्षित महसूस हो रहा है। हम नियमित रूप से दवाएं ले रहे हैं।");
      setLanguage('hi');
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
      setLastResponse(data);
      setTextContent('');
      setAudioBlob(null);
      setAudioUrl(null);

      if (onCheckinSubmitted) {
        onCheckinSubmitted(data);
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
      {/* Reassuring Hero Card */}
      <div className="gov-card p-5 bg-gradient-to-r from-slate-900 via-[#0f2557] to-[#183b88] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                Section 15A Legal Protection Active
              </span>
              <span className="text-xs text-indigo-200 flex items-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5" /> Confidential & Encrypted
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              आप सुरक्षित हैं • Survivor Well-being & Care Portal
            </h2>
            <p className="text-xs text-slate-200 max-w-2xl mt-1 leading-relaxed">
              Your safety and dignity are protected by law under the SC/ST (Prevention of Atrocities) Act. Share regular updates so the District Protection Officer and Tele-MANAS counsellors can stand with you.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={onTriggerSos}
              className="btn-danger text-xs font-bold pulse-emergency flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>EMERGENCY POLICE SOS</span>
            </button>
          </div>
        </div>

        {/* Case Profile Selector */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5 flex-shrink-0">
            <User className="w-3.5 h-3.5 text-indigo-300" /> Case Code:
          </label>
          <select
            value={selectedVictim}
            onChange={(e) => setSelectedVictim(e.target.value)}
            className="bg-[#061024] border border-indigo-400/40 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 max-w-md font-mono"
          >
            {displayedVictims.map((v) => (
              <option key={v.victim_id} value={v.victim_id} className="bg-slate-900 text-white font-sans">
                {v.code_name || v.victim_code} — {v.district}, {v.state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Check-in Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Voice Recording & Statement Input (7 cols) */}
        <div className="lg:col-span-7 gov-card p-5 space-y-4">
          <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Periodic Voice Check-in
              </h3>
              <p className="text-[11px] text-slate-500">
                Speak naturally or type. Voice stability and distress indicators will be assessed.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              NHAA 14566 Protocol
            </span>
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

          {/* Quick Situational Scenarios (1-Click Fill) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Quick Test Scenarios (1-Click Fill):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyScenarioPreset('threat')}
                className="p-2 text-left rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-900 font-semibold transition-colors truncate"
              >
                🚨 Threat by Accused Associates
              </button>
              <button
                type="button"
                onClick={() => applyScenarioPreset('court')}
                className="p-2 text-left rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-semibold transition-colors truncate"
              >
                ⚠️ Special Court Summons Fear
              </button>
              <button
                type="button"
                onClick={() => applyScenarioPreset('boycott')}
                className="p-2 text-left rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-semibold transition-colors truncate"
              >
                🌧️ Social Boycott & Ration Block
              </button>
              <button
                type="button"
                onClick={() => applyScenarioPreset('stable')}
                className="p-2 text-left rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 font-semibold transition-colors truncate"
              >
                🌱 Stable / Routine Check-in
              </button>
            </div>
          </div>

          {/* Written Statement (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Additional Notes or Incident Description:
            </label>
            <textarea
              rows={3}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Share any recent incidents, threats, court apprehensions, or how you are coping..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 placeholder-slate-400 font-normal"
            />
          </div>

          {/* Language Selector & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium focus:outline-none"
              >
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="en">English</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            <button
              onClick={handleSubmitCheckin}
              disabled={isSubmitting || (!audioBlob && !textContent.trim())}
              className="btn-navy text-xs disabled:opacity-50 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isSubmitting ? 'Analyzing Biomarkers...' : 'Analyze & Submit Official Check-in'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Trauma Guidance & Response (5 cols) */}
        <div className="lg:col-span-5 gov-card p-5 space-y-4">
          <div className="border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Counsellor Assessment & Trauma Guidance</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Trauma-informed guidance and grounding exercises grounded in Tele-MANAS care.
            </p>
          </div>

          {lastResponse ? (
            <div className="space-y-3">
              {/* Score Assessment Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Distress Determination Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-slate-900">
                      {lastResponse.composite_dds}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>

                <span className={lastResponse.risk_level === 'CRITICAL' ? 'badge-critical' : lastResponse.risk_level === 'HIGH' ? 'badge-high' : 'badge-low'}>
                  {lastResponse.risk_level}
                </span>
              </div>

              {/* Empathetic AI Response */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3.5 space-y-1.5">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-purple-700" />
                  <span>Counsellor Supportive Guidance:</span>
                </span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {lastResponse.ai_response}
                </p>
              </div>

              {/* Official notification */}
              <div className="p-2.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 text-[11px] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Check-in saved to official case docket. District Nodal Officer notified.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4 text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-indigo-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Awaiting Your Check-in</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                  Record voice, upload audio, or choose a scenario on the left. Your assessment will sync directly with district protection authorities.
                </p>
              </div>

              {/* 5-4-3-2-1 Sensory Grounding Support */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 block">
                  Grounding Technique (If You Feel Stressed or Anxious):
                </span>
                <ul className="text-slate-600 space-y-1 text-[11px]">
                  <li>• <strong>5 things</strong> you can see around you right now</li>
                  <li>• <strong>4 things</strong> you can physically touch (clothing, phone)</li>
                  <li>• <strong>3 things</strong> you can hear</li>
                  <li>• <strong>2 things</strong> you can smell</li>
                  <li>• <strong>1 deep, slow breath</strong> (inhale 4s, exhale 6s)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
