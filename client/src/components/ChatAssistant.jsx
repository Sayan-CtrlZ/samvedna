import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, RotateCcw, MessageSquare, ShieldCheck, User } from 'lucide-react';

export default function ChatAssistant({ onCheckinComplete, isProcessing, setIsProcessing }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello. I am here to support you and listen to whatever is on your mind. You can share your thoughts or concerns safely. How are you feeling today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech-to-Text Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

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
  }, []);

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
              const res = await fetch('/api/v1/victim/transcribe', {
                method: 'POST',
                body: formData,
              });
              if (res.ok) {
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

  // Text-to-Speech (Read Aloud)
  const speakMessage = (id, text) => {
    if (!window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
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
      formData.append('victim_id', 'VIC-MP-2024-881');
      formData.append('channel', 'Web_Text_Chat');
      formData.append('text_content', text);

      const response = await fetch('/api/v1/victim/checkin', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const data = await response.json();

      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: data.ai_response || 'Thank you for sharing. We are here with you.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (onCheckinComplete) {
        onCheckinComplete(data);
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
      formData.append('victim_id', 'VIC-MP-2024-881');
      await fetch('/api/v1/victim/reset', { method: 'POST', body: formData });
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

  return (
    <div className="neu-card p-6 sm:p-7 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/60 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[inset_2px_2px_4px_#cad4e2,inset_-2px_-2px_4px_#ffffff]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Support Assistant</h3>
            <p className="text-[11px] text-slate-500">Confidential, supportive conversation</p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="neu-btn px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          title="Clear Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Recessed Chat Feed */}
      <div className="neu-inset-deep flex-1 p-4 overflow-y-auto space-y-3.5 mb-4">
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
                    ? 'bg-indigo-600 text-white shadow-[2px_2px_5px_#cad4e2]'
                    : 'bg-white text-indigo-600 shadow-[2px_2px_5px_#cad4e2]'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <ShieldCheck className="w-4 h-4 text-indigo-600" />}
              </div>

              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-[4px_4px_10px_#cad4e2]'
                    : 'bg-[#edf2f8] text-slate-800 shadow-[4px_4px_10px_#cad4e2,-3px_-3px_8px_#ffffff] border border-white/60'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div
                  className={`mt-2 flex items-center justify-between gap-2 text-[10px] ${
                    isUser ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.time}</span>
                  {!isUser && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.text)}
                      className={`hover:text-indigo-600 flex items-center gap-1 transition-colors ${
                        isSpeaking ? 'text-indigo-600 font-bold' : ''
                      }`}
                      title={isSpeaking ? 'Stop listening' : 'Listen aloud'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking ? 'Playing...' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSpeechInput}
          disabled={isTranscribing}
          className={`neu-btn p-3 text-slate-600 flex-shrink-0 transition-all ${
            isListeningSpeech ? 'text-rose-600 bg-rose-50 shadow-[inset_2px_2px_5px_#fecdd3]' : ''
          }`}
          title={isTranscribing ? 'Transcribing...' : isListeningSpeech ? 'Click to stop & transcribe' : 'Speak message'}
        >
          {isTranscribing ? (
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : isListeningSpeech ? (
            <MicOff className="w-4 h-4 animate-pulse text-rose-600" />
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
              ? 'Listening... click mic again to finish'
              : 'Type a message or concern...'
          }
          disabled={isProcessing || isTranscribing}
          className="neu-inset flex-1 px-4 py-3 text-xs sm:text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-400 transition-all disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="neu-btn px-4 py-3 bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
          }}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
