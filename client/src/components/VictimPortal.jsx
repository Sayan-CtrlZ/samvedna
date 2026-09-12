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
  FileAudio
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

  // Available sample victims for demonstration
  const sampleVictims = [
    { id: 'VIC-MH-2024-114', code: 'V-114 (Ms. P*** G***)', desc: 'Eyewitness in Special Court Trial - Threat from Accused Associates' },
    { id: 'VIC-MP-2024-881', code: 'V-881 (Ms. S*** B***)', desc: 'Survivor - Accused Granted Bail, Nocturnal Intimidation' },
    { id: 'VIC-UP-2024-409', code: 'V-409 (Mr. R*** K***)', desc: 'Complainant Father - Accused High Court Bail Hearing Impending' },
    { id: 'VIC-RJ-2024-215', code: 'V-215 (Mr. D*** R***)', desc: 'Arson Survivor - Social Boycott & Compensation Delayed' },
    { id: 'VIC-BR-2024-712', code: 'V-712 (Ms. K*** D***)', desc: 'Widow - 7 Months Pending Rehabilitation Pension' }
  ];

  // Start Voice Recording with Web Audio API (16kHz PCM WAV)
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

          // Flatten and convert Float32Array to 16-bit PCM WAV
          const totalLength = pcmData.reduce((acc, curr) => acc + curr.length, 0);
          const result = new Float32Array(totalLength);
          let offset = 0;
          for (const chunk of pcmData) {
            result.set(chunk, offset);
            offset += chunk.length;
          }

          // Build WAV header
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
          view.setUint16(20, 1, true); // PCM
          view.setUint16(22, 1, true); // 1 channel
          view.setUint32(24, 16000, true); // Sample rate 16000
          view.setUint32(28, 32000, true); // Byte rate (16000 * 1 * 2)
          view.setUint16(32, 2, true); // Block align
          view.setUint16(34, 16, true); // 16-bit
          writeString(view, 36, 'data');
          view.setUint32(40, result.length * 2, true);

          // Write PCM samples
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
      setErrorMsg('Microphone access denied or not available.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Submit Check-in to Backend (/api/v1/victim/checkin)
  const handleSubmitCheckin = async () => {
    if (!audioBlob && !textContent.trim()) {
      setErrorMsg('Please record your voice or enter a message to check in.');
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
    <div className="space-y-6">
      {/* Survivor Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border-2 border-indigo-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Section 15A Protection Scheme
              </span>
              <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Confidential & Encrypted
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              SAMVEDNA Survivor Well-being Portal
            </h2>
            <p className="text-xs text-indigo-100 max-w-xl mt-1 leading-relaxed">
              Your voice and safety are legally protected under the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989. Record regular check-ins to monitor well-being, access trauma support, and request police protection.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={onTriggerSos}
              className="btn-3d btn-3d-red px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Trigger Emergency SOS</span>
            </button>
          </div>
        </div>

        {/* Case Profile Selector */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5 flex-shrink-0">
            <User className="w-4 h-4" /> Checking in as Case:
          </label>
          <select
            value={selectedVictim}
            onChange={(e) => setSelectedVictim(e.target.value)}
            className="bg-indigo-950/80 border border-indigo-500/60 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-md"
          >
            {sampleVictims.map((v) => (
              <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                {v.code} — {v.desc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interaction Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Voice & Check-in Input */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900">Periodic Voice Check-in</h3>
            <p className="text-xs text-slate-500 font-medium">
              Speak freely in your preferred language. Emotion AI and voice stress biomarkers will assess your well-being.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Voice Recorder Block */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
            {isRecording ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-rose-200">
                  <Mic className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-black text-rose-600">Recording Voice Check-in...</div>
                  <div className="text-xs font-mono font-bold text-slate-500 mt-1">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <button
                  onClick={stopRecording}
                  className="btn-3d btn-3d-red px-5 py-2 text-xs font-bold flex items-center gap-2 mx-auto"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Review Recording</span>
                </button>
              </div>
            ) : audioUrl ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
                  <FileAudio className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-700">Audio Captured (16kHz PCM WAV)</div>
                <audio src={audioUrl} controls className="mx-auto max-w-xs w-full" />
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={startRecording}
                    className="btn-3d px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Re-record
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-200 transition-transform active:scale-95"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Click to Record Voice Note</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Microphone is analyzed for pitch stability, tremor, and emotional tone.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Text Statement (Optional / Alternative) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Additional Notes or Written Statement (Optional):
            </label>
            <textarea
              rows={3}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="E.g., Yesterday two associates of the accused came to our neighborhood and warned my family not to testify..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Language Selector & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white font-medium focus:outline-none"
              >
                <option value="hi">Hindi (हिंदी)</option>
                <option value="en">English</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="ta">Tamil (தமிழ்)</option>
              </select>
            </div>

            <button
              onClick={handleSubmitCheckin}
              disabled={isSubmitting || (!audioBlob && !textContent.trim())}
              className="btn-3d btn-3d-indigo px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Analyzing Biomarkers & Scoring...' : 'Submit Check-in'}</span>
            </button>
          </div>
        </div>

        {/* Right: Real-time Analysis Feedback & Trauma Support */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Well-being & Trauma Guidance</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Empathetic AI support grounded in clinical 5-4-3-2-1 sensory grounding.
            </p>
          </div>

          {lastResponse ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Score Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assessed Distress Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">
                      {lastResponse.composite_dds}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/100</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-3 py-1 rounded-full border ${
                    lastResponse.risk_level === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : lastResponse.risk_level === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {lastResponse.risk_level}
                </span>
              </div>

              {/* Empathetic AI Response */}
              <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  <span>Supportive Counsellor Message:</span>
                </div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed whitespace-pre-line">
                  {lastResponse.ai_response}
                </p>
              </div>

              {/* Notice to survivor */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Check-in recorded in official dossier. District Protection Officer notified.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
                <Activity className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">Awaiting Your Check-in</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-medium">
                  Submit a voice or written note on the left. Your assessment will appear here and sync directly with district protection authorities.
                </p>
              </div>

              {/* Standard 5-4-3-2-1 Sensory Grounding Help */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Grounding Exercise (If Feeling Stressed):
                </span>
                <ul className="text-[11px] text-slate-600 space-y-1 font-medium">
                  <li>• <strong>5 things</strong> you can see around you</li>
                  <li>• <strong>4 things</strong> you can physically feel or touch</li>
                  <li>• <strong>3 things</strong> you can hear right now</li>
                  <li>• <strong>2 things</strong> you can smell</li>
                  <li>• <strong>1 deep breath</strong> in for 4 seconds, out for 6</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
