import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, RotateCcw, MessageSquare, ShieldCheck, User, ShieldAlert, Activity, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export default function ChatAssistant({
  onCheckinComplete,
  onTriggerSos,
  isProcessing: externalIsProcessing,
  setIsProcessing: externalSetIsProcessing,
  latestVoiceResult,
  selectedVictimId = 'VIC-MH-114',
  language = 'en'
}) {
  const [internalIsProcessing, setInternalIsProcessing] = useState(false);
  const isProcessing = externalIsProcessing !== undefined ? externalIsProcessing : internalIsProcessing;
  const setIsProcessing = externalSetIsProcessing || setInternalIsProcessing;

  const defaultWelcomeMessage = {
    id: 'welcome',
    sender: 'assistant',
    text: 'Hello. I am here to support you and listen to whatever is on your mind. You can share your thoughts or concerns safely. How are you feeling today?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const deduplicateMessages = (msgList) => {
    if (!Array.isArray(msgList)) return [defaultWelcomeMessage];
    const seenIds = new Set();
    const result = [];
    for (const m of msgList) {
      if (m && m.id && !seenIds.has(m.id)) {
        seenIds.add(m.id);
        result.push(m);
      }
    }
    return result.length > 0 ? result : [defaultWelcomeMessage];
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`samvedna_chat_${selectedVictimId}`);
      if (!saved) return [defaultWelcomeMessage];
      const parsed = JSON.parse(saved);
      return deduplicateMessages(parsed);
    } catch (e) {
      return [defaultWelcomeMessage];
    }
  });

  const [inputText, setInputText] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastProcessedCheckinIdRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(`samvedna_chat_${selectedVictimId}`, JSON.stringify(deduplicateMessages(messages)));
    } catch (e) {
      console.warn('Chat storage warning:', e);
    }
  }, [messages, selectedVictimId]);

  // Sync Voice Check-in results directly into the chat conversation (without duplicating text chat)
  useEffect(() => {
    if (latestVoiceResult) {
      const checkinId = latestVoiceResult.checkin_id || latestVoiceResult._ts;

      // Skip if already processed or if this was triggered via Web_Text_Chat
      if (!checkinId || lastProcessedCheckinIdRef.current === checkinId || latestVoiceResult.channel === 'Web_Text_Chat') {
        lastProcessedCheckinIdRef.current = checkinId;
        return;
      }

      lastProcessedCheckinIdRef.current = checkinId;

      const userText =
        latestVoiceResult.transcript && latestVoiceResult.transcript.trim()
          ? latestVoiceResult.transcript
          : latestVoiceResult.status === 'silence_detected'
          ? 'Voice check-in audio recorded (unclear audio)'
          : 'Voice check-in audio recorded';

      const assistantText =
        latestVoiceResult.ai_response ||
        'Thank you for sharing your voice check-in. Your emotional stability and distress indicators have been assessed.';

      const userMsgId = `voice-user-${checkinId}`;
      const assistantMsgId = `voice-assistant-${checkinId}`;

      const userMessage = {
        id: userMsgId,
        sender: 'user',
        isVoice: true,
        text: userText,
        time: latestVoiceResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const assistantMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: assistantText,
        time: latestVoiceResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        composite_dds: latestVoiceResult.composite_dds,
        risk_level: latestVoiceResult.risk_level,
        threat_detected: latestVoiceResult.nlp_metrics?.witness_threat_detected || false,
        is_sos_active: latestVoiceResult.is_sos_active || false,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === userMsgId || m.id === assistantMsgId)) {
          return prev;
        }
        return [...prev, userMessage, assistantMessage];
      });
    }
  }, [latestVoiceResult]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Speech-to-Text Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListeningSpeech(false);
      };

      recognition.onerror = () => {
        setIsListeningSpeech(false);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const toggleSpeechInput = async () => {
    // 1. Native Web Speech API (Chrome, Edge, Chromium browsers)
    if (recognitionRef.current) {
      if (isListeningSpeech) {
        recognitionRef.current.stop();
        setIsListeningSpeech(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListeningSpeech(true);
        } catch (e) {
          console.warn('Speech start issue:', e);
        }
      }
      return;
    }

    // 2. Cross-browser Audio Fallback (Firefox, Safari, etc.)
    if (isListeningSpeech) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsListeningSpeech(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          if (audioBlob.size > 500) {
            setIsTranscribing(true);
            try {
              const formData = new FormData();
              formData.append('audio_file', audioBlob, 'mic_input.wav');
              const res = await fetch(getApiUrl('/api/v1/victim/transcribe'), {
                method: 'POST',
                body: formData,
              });
              if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const data = await res.json();
                if (data.transcript) {
                  setInputText((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
                }
              }
            } catch (err) {
              console.warn('Transcription error:', err);
            } finally {
              setIsTranscribing(false);
            }
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsListeningSpeech(true);
      } catch (err) {
        console.error('Microphone error in chat:', err);
        alert('Could not access microphone. Please ensure microphone permissions are granted.');
      }
    }
  };

  // Sarvam AI Text-to-Speech (Bulbul v1) Read Aloud Integration
  const activeAudioRef = useRef(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  const fallbackBrowserTts = (id, text) => {
    if (!window.speechSynthesis) {
      setSpeakingMessageId(null);
      setIsTtsLoading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsTtsLoading(false);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setIsTtsLoading(false);
    };

    setSpeakingMessageId(id);
    setIsTtsLoading(false);
    window.speechSynthesis.speak(utterance);
  };

  const speakMessage = async (id, text) => {
    // If user clicks on currently playing message -> stop playing
    if (speakingMessageId === id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      setIsTtsLoading(false);
      return;
    }

    // Stop any existing active playback
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setSpeakingMessageId(id);
    setIsTtsLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);

      const res = await fetch(getApiUrl('/api/v1/victim/tts'), {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.status === 'success' && data.audio_base64) {
          const audioUrl = `data:audio/wav;base64,${data.audio_base64}`;
          const audio = new Audio(audioUrl);
          activeAudioRef.current = audio;

          audio.onended = () => {
            setSpeakingMessageId(null);
            setIsTtsLoading(false);
            activeAudioRef.current = null;
          };

          audio.onerror = () => {
            fallbackBrowserTts(id, text);
          };

          await audio.play();
          setIsTtsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Sarvam AI TTS call failed, invoking browser fallback:', err);
    }

    // Fallback if Sarvam API is unconfigured or failed
    fallbackBrowserTts(id, text);
  };

  // Submit Text Message Check-in
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isProcessing) return;

    const userMessageId = `user-${Date.now()}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, sender: 'user', text, time: currentTime },
    ]);
    setInputText('');
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('victim_id', selectedVictimId);
      formData.append('channel', 'Web_Text_Chat');
      formData.append('text_content', text);
      formData.append('language', language);

      const response = await fetch(getApiUrl('/api/v1/victim/checkin'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Backend API URL not configured or returned non-JSON response');
      }
      const data = await response.json();
      const checkinId = data.checkin_id || `chat-${Date.now()}`;
      lastProcessedCheckinIdRef.current = checkinId;

      const assistantMessageId = `assistant-${checkinId}`;
      const assistantMessage = {
        id: assistantMessageId,
        sender: 'assistant',
        text: data.ai_response || 'Thank you for sharing. We are here with you.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        composite_dds: data.composite_dds,
        risk_level: data.risk_level,
        threat_detected: data.nlp_metrics?.witness_threat_detected || false,
        is_sos_active: data.is_sos_active || false,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === assistantMessageId)) {
          return prev;
        }
        return [...prev, assistantMessage];
      });

      if (onCheckinComplete) {
        onCheckinComplete({ ...data, checkin_id: checkinId, channel: 'Web_Text_Chat' });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: 'We could not reach the server right now. If you need urgent help, please call 14566 or dial 112.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Conversation
  const handleResetChat = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    try {
      const formData = new FormData();
      formData.append('victim_id', selectedVictimId || 'VIC-MP-881');
      await fetch(getApiUrl('/api/v1/victim/reset'), { method: 'POST', body: formData });
    } catch (e) {
      console.warn('Reset error:', e);
    }

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Conversation cleared. I am here whenever you are ready to share.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const presetPrompts = [
    {
      label: 'Feeling Overwhelmed',
      text: 'I am feeling completely overwhelmed and anxious right now.',
      chipStyle: 'bg-[#fff1f2] text-rose-800 border-rose-300 border-b-rose-400 hover:bg-rose-100',
    },
    {
      label: 'Threat / Intimidation',
      text: 'Someone from the accused side is watching or threatening me.',
      chipStyle: 'bg-[#fef2f2] text-red-800 border-red-300 border-b-red-400 hover:bg-red-100',
    },
    {
      label: 'Court / Legal Help',
      text: 'I need legal aid and information about witness protection for my upcoming trial.',
      chipStyle: 'bg-[#fffbeb] text-amber-800 border-amber-300 border-b-amber-400 hover:bg-amber-100',
    },
    {
      label: 'Feeling Calm & Safe',
      text: 'I am feeling safe and calm today after speaking with my support circle.',
      chipStyle: 'bg-[#ecfdf5] text-emerald-800 border-emerald-300 border-b-emerald-400 hover:bg-emerald-100',
    },
  ];

  const handleSelectPreset = (text) => {
    setInputText(text);
  };

  return (
    <div className="bg-white border-2 border-sky-200/80 shadow-md shadow-sky-100/40 rounded-2xl p-6 sm:p-7 flex flex-col h-[680px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">Conversational Care Hub</h3>
            <p className="text-[11px] text-slate-500 font-medium">Confidential, supportive empathetic care</p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="btn-3d btn-3d-light px-3 py-1.5 text-xs text-slate-600 flex items-center gap-1"
          title="Clear Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Recessed Chat Feed */}
      <div className="bg-[#f8fafc] border-2 border-slate-200 rounded-2xl flex-1 p-4 overflow-y-auto space-y-3.5 mb-3.5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeaking = speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-indigo-600 border border-slate-200 shadow-sm'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <ShieldCheck className="w-4 h-4 text-indigo-600" />}
              </div>

              <div
                className={`max-w-[84%] px-4 py-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-sm font-medium'
                    : 'bg-white text-slate-900 border-2 border-slate-200/90 shadow-xs'
                }`}
              >
                {msg.isVoice && isUser && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200 mb-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Voice Check-in</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Emergency Workflow Card (DDS >= 75 / Critical Distress / Threat Cues) */}
                {!isUser && (msg.composite_dds >= 75 || msg.risk_level === 'CRITICAL' || msg.threat_detected) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 animate-pulse" />
                        <span>Emergency Workflow Activated</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-snug">
                        Critical distress or threat cues detected. Priority alert created & magistrate protection flagged under Section 15A.
                      </p>
                      {onTriggerSos && (
                        <button
                          type="button"
                          onClick={onTriggerSos}
                          className="w-full py-1.5 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Instant Dispatch Emergency SOS</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div
                  className={`mt-2 flex items-center justify-between gap-2 text-[10px] ${
                    isUser ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.time}</span>
                  {!isUser && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.text)}
                      className={`hover:text-indigo-600 flex items-center gap-1 font-semibold transition-colors ${
                        isSpeaking ? 'text-indigo-600 font-bold' : ''
                      }`}
                      title={isSpeaking ? 'Stop listening' : 'Listen with Sarvam AI Voice'}
                    >
                      {isSpeaking && isTtsLoading ? (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                          <span>Sarvam AI...</span>
                        </span>
                      ) : isSpeaking ? (
                        <span className="flex items-center gap-1 text-indigo-600 font-bold">
                          <Volume2 className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
                          <span>Playing...</span>
                        </span>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking Dot Animation Indicator */}
        {isProcessing && (
          <div className="flex items-start gap-2.5 flex-row animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-white text-indigo-600 border border-slate-200 shadow-sm flex items-center justify-center text-xs flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-600 animate-pulse" />
            </div>
            <div className="bg-white border-2 border-indigo-100 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs">
              <span className="font-bold text-indigo-900 text-xs">SAMVEDNA AI is analyzing</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSpeechInput}
          disabled={isTranscribing}
          className={`btn-3d p-3 flex-shrink-0 ${
            isListeningSpeech
              ? 'btn-3d-red animate-pulse'
              : 'btn-3d-light text-slate-700'
          }`}
          title={isTranscribing ? 'Transcribing...' : isListeningSpeech ? 'Click to finish speaking' : 'Speak message'}
        >
          {isTranscribing ? (
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : isListeningSpeech ? (
            <MicOff className="w-4 h-4 fill-current" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isTranscribing
              ? 'Transcribing your voice...'
              : isListeningSpeech
              ? 'Listening... click mic again when finished'
              : 'Type what you are experiencing...'
          }
          disabled={isProcessing || isTranscribing}
          className="bg-white border-2 border-slate-300 focus:border-indigo-500 rounded-xl flex-1 px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-60 font-medium"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="btn-3d btn-3d-indigo px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-1.5 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
