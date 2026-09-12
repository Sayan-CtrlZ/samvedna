import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Send,
  Sparkles,
  HeartHandshake,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  Volume2,
  AlertCircle,
  Clock,
  Lock,
  User,
  Activity,
  FileAudio,
  ShieldCheck,
  Headphones
} from 'lucide-react';

export default function VictimPortal({
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
  const audioChunksRef = useRef([]);

  const sampleVictims = [
    { id: 'VIC-MH-2024-114', code: 'V-114 (Ms. P*** G***)', desc: 'Eyewitness in Special Court Trial - Intimidation by Accused Associates' },
    { id: 'VIC-MP-2024-881', code: 'V-881 (Ms. S*** B***)', desc: 'Survivor - Accused Granted Bail, Nocturnal Surveillance' },
    { id: 'VIC-UP-2024-409', code: 'V-409 (Mr. R*** K***)', desc: 'Complainant Father - Accused High Court Bail Hearing Pending' },
    { id: 'VIC-RJ-2024-215', code: 'V-215 (Mr. D*** R***)', desc: 'Arson Survivor - Social Boycott & 25% Compensation Delayed' },
    { id: 'VIC-BR-2024-712', code: 'V-712 (Ms. K*** D***)', desc: 'Widow - 7 Months Pending Rehabilitation Pension' }
  ];

  const startRecording = async () => {
    setErrorMsg(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

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
      setErrorMsg('Microphone access unavailable or denied.');
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
      setErrorMsg('Please record your voice or type a message to complete your check-in.');
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
      setErrorMsg('Could not process check-in. Please try again or use Emergency SOS.');
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
            <User className="w-3.5 h-3.5 text-indigo-300" /> Case Reference:
          </label>
          <select
            value={selectedVictim}
            onChange={(e) => setSelectedVictim(e.target.value)}
            className="bg-[#061024] border border-indigo-400/40 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 max-w-md"
          >
            {sampleVictims.map((v) => (
              <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                {v.code} — {v.desc}
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
                Speak naturally in your preferred language. Voice stability and distress indicators will be assessed.
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
                <div className="text-xs font-semibold text-slate-700">Audio Recorded (16kHz PCM WAV)</div>
                <audio src={audioUrl} controls className="mx-auto max-w-xs w-full" />
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={startRecording}
                    className="btn-subtle text-xs"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  onClick={startRecording}
                  className="w-14 h-14 rounded-xl bg-[#0f2557] hover:bg-[#183b88] text-white flex items-center justify-center mx-auto shadow transition-transform active:scale-95"
                >
                  <Mic className="w-7 h-7 text-indigo-200" />
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Click to Record Voice Check-in</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Microphone is analyzed for pitch tremor, vocal strain, and emotional stability.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Written Statement (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Additional Notes or Incident Description (Optional):
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
              className="btn-navy text-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Analyzing Biomarkers...' : 'Submit Official Check-in'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Trauma Guidance & Response (5 cols) */}
        <div className="lg:col-span-5 gov-card p-5 space-y-4">
          <div className="border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Counsellor Assessment & Trauma Support</span>
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
                  Record a voice note or enter a message. Your assessment will appear here and sync directly with district protection authorities.
                </p>
              </div>

              {/* 5-4-3-2-1 Sensory Grounding Support */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 block">
                  Grounding Technique (If You Feel Stressed or Anxious):
                </span>
                <ul className="text-slate-600 space-y-1 text-[11px]">
                  <li>• <strong>5 things</strong> you can see around you right now</li>
                  <li>• <strong>4 things</strong> you can physically touch (your clothing, desk)</li>
                  <li>• <strong>3 things</strong> you can hear</li>
                  <li>• <strong>2 things</strong> you can smell</li>
                  <li>• <strong>1 deep, slow breath</strong> (inhale for 4s, exhale for 6s)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
