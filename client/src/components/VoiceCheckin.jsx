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

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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

  // Start Live Audio Recording
  const startRecording = async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setStatusMessage('Voice recorded. Ready to analyze.');
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setStatusMessage('Listening to your voice... Speak at your own pace.');

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrorMessage('Could not access microphone. Please allow microphone permissions or upload an audio file.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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
        onCheckinComplete(result);
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

        {audioBlob && !isRecording && (
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

      {/* Primary Interaction Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-5">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="btn-3d btn-3d-indigo px-7 py-3.5 text-xs sm:text-sm font-black flex items-center gap-2.5 disabled:opacity-50"
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
          disabled={isRecording || isProcessing}
          className="btn-3d btn-3d-light px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Upload className="w-4 h-4 text-slate-500" />
          <span>Upload Audio File</span>
        </button>

        {/* Analyze Audio Button */}
        {audioBlob && !isRecording && (
          <button
            onClick={submitVoiceCheckin}
            disabled={isProcessing}
            className="btn-3d btn-3d-emerald px-7 py-3.5 text-xs sm:text-sm font-black flex items-center gap-2.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isProcessing ? 'Assessing Voice...' : 'Analyze My Check-in'}</span>
          </button>
        )}
      </div>

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
