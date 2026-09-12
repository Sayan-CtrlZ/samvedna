import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Play, Volume2, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export default function VoiceCheckin({ onCheckinComplete, isProcessing, setIsProcessing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to listen. Speak naturally about how you feel.');
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const pcmBuffersRef = useRef([]);
  const scriptProcessorRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Format recording seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to encode Float32Array PCM buffers directly to standard 16kHz 16-bit Mono WAV
  const encodeToWav = (pcmBuffers, sampleRate) => {
    let totalLength = 0;
    for (let i = 0; i < pcmBuffers.length; i++) totalLength += pcmBuffers[i].length;
    if (totalLength === 0) return null;

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < pcmBuffers.length; i++) {
      merged.set(pcmBuffers[i], offset);
      offset += pcmBuffers[i].length;
    }

    // Resample to 16000 Hz if different
    const targetRate = 16000;
    let samples = merged;
    if (sampleRate !== targetRate) {
      const ratio = sampleRate / targetRate;
      const newLen = Math.round(merged.length / ratio);
      samples = new Float32Array(newLen);
      for (let i = 0; i < newLen; i++) {
        samples[i] = merged[Math.min(Math.round(i * ratio), merged.length - 1)];
      }
    }

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeStr = (v, off, s) => {
      for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
    };

    writeStr(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(view, 8, 'WAVE');
    writeStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono channel
    view.setUint32(24, targetRate, true); // 16000 Hz
    view.setUint32(28, targetRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit
    writeStr(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let pcmOff = 44;
    for (let i = 0; i < samples.length; i++, pcmOff += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(pcmOff, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  // Start Live Audio Recording
  const startRecording = async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
    pcmBuffersRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Collect raw PCM samples directly via ScriptProcessor
      const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptNode;
      scriptNode.onaudioprocess = (e) => {
        const channel = e.inputBuffer.getChannelData(0);
        pcmBuffersRef.current.push(new Float32Array(channel));
      };
      source.connect(scriptNode);
      scriptNode.connect(audioCtx.destination);

      // MediaRecorder parallel capture
      if (typeof MediaRecorder !== 'undefined') {
        let mimeType = '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) mimeType = 'audio/ogg;codecs=opus';

        try {
          const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          mr.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };
          mr.start(250);
          mediaRecorderRef.current = mr;
        } catch (e) {
          console.warn('MediaRecorder init error:', e);
        }
      }

      setIsRecording(true);
      setRecordingTime(0);
      setStatusMessage('Listening to your voice... Speak at your own pace.');

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrorMessage('Could not access microphone. Please ensure microphone permissions are allowed or upload an audio file.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Stop MediaRecorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // Disconnect ScriptProcessor
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {}
      scriptProcessorRef.current = null;
    }

    // Stop microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Encode standard 16kHz WAV from PCM samples
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    let finalBlob = null;

    if (pcmBuffersRef.current.length > 0) {
      finalBlob = encodeToWav(pcmBuffersRef.current, sampleRate);
    }

    // Fallback to MediaRecorder chunks if needed
    if (!finalBlob && audioChunksRef.current.length > 0) {
      finalBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    }

    if (finalBlob && finalBlob.size > 1000) {
      setAudioBlob(finalBlob);
      const url = URL.createObjectURL(finalBlob);
      setAudioUrl(url);
      setStatusMessage('Voice recorded cleanly. Ready to analyze.');
    } else {
      setErrorMessage('Recording was too short or silent. Please speak into the mic and try again.');
      setStatusMessage('No audio captured. Please try recording again.');
    }
  };

  // Draw Audio Waveform on Canvas
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#a5b4fc');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1.5;
      }
    };

    render();
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage(null);
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setStatusMessage(`Audio file loaded: ${file.name}`);
    }
  };

  // Submit Check-in to Backend API
  const submitVoiceCheckin = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    setStatusMessage('Analyzing speech characteristics and vocal stability...');

    try {
      const formData = new FormData();
      formData.append('victim_id', 'VIC-MP-2024-881');
      formData.append('channel', 'Web_Voice_Checkin');
      formData.append('text_content', '');
      formData.append('audio_file', audioBlob, 'voice_checkin.wav');

      const response = await fetch('/api/v1/victim/checkin', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      setStatusMessage('Voice assessment complete.');
      if (onCheckinComplete) {
        onCheckinComplete(result, 'voice');
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setErrorMessage('Could not process voice check-in. Please ensure the server is running and try again.');
      setStatusMessage('Assessment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetVoiceState = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setErrorMessage(null);
    setStatusMessage('Ready to listen. Speak naturally about how you feel.');
  };

  return (
    <div className="bg-white border-2 border-indigo-200/80 shadow-md shadow-indigo-100/40 rounded-2xl p-6 sm:p-7 relative overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Volume2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Voice Check-in</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Share how you are doing by speaking naturally</p>
          </div>
        </div>

        {audioBlob && !isRecording && !isProcessing && (
          <button
            onClick={resetVoiceState}
            className="btn-3d btn-3d-light px-3 py-1.5 text-xs text-slate-600 flex items-center gap-1"
            title="Reset Recording"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Waveform / Visualizer Track */}
      <div className="bg-[#f8fafc] border-2 border-slate-200 rounded-2xl p-4 mb-6 relative flex flex-col items-center justify-center min-h-[115px]">
        {isRecording ? (
          <canvas ref={canvasRef} width="480" height="90" className="w-full h-20 rounded-xl" />
        ) : audioUrl ? (
          <div className="w-full flex flex-col items-center py-2">
            <audio src={audioUrl} controls className="w-full max-w-md h-10 accent-indigo-600" />
            <span className="text-[11px] text-slate-500 mt-2 font-semibold">Recording ready for assessment</span>
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-xs text-slate-500 font-medium">Tap the microphone button below when you are ready to speak</p>
          </div>
        )}

        {/* Live Timer Badge */}
        {isRecording && (
          <div className="absolute top-3 right-4 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Primary Interaction Buttons or Active Analysis Banner */}
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center p-5 bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl mb-5 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-black text-indigo-900 tracking-wide">
              Analyzing Voice Signal...
            </span>
          </div>
          <p className="text-xs text-indigo-600 font-semibold text-center max-w-md">
            Evaluating vocal tremor, pitch stability, and speech indicators. New voice inputs are paused until this analysis completes.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-5">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="btn-3d btn-3d-indigo px-7 py-3.5 text-xs sm:text-sm font-black flex items-center gap-2.5"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-200 animate-ping"></div>
              <Mic className="w-4 h-4" />
              <span>{audioBlob ? 'Record Again' : 'Start Voice Check-in'}</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="btn-3d btn-3d-red px-7 py-3.5 text-xs sm:text-sm font-black flex items-center gap-2.5 animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Recording</span>
            </button>
          )}

          {/* Upload Audio Option */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording}
            className="btn-3d btn-3d-light px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Upload Audio File</span>
          </button>

          {/* Analyze Audio Button */}
          {audioBlob && !isRecording && (
            <button
              onClick={submitVoiceCheckin}
              className="btn-3d btn-3d-emerald px-7 py-3.5 text-xs sm:text-sm font-black flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Analyze My Check-in</span>
            </button>
          )}
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-[#f1f5f9] border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-700 font-semibold truncate">{statusMessage}</span>
        {isProcessing && (
          <span className="text-indigo-600 font-bold text-[11px] animate-pulse">In Progress...</span>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
