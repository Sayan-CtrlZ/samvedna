// SAMVEDNA AI (संवेदना) - Production Client Controller
const API_BASE = '/api/v1';

let currentLang = 'hi';
try {
  currentLang = localStorage.getItem('samvedna_selected_lang') || 'hi';
} catch (e) {
  console.warn('localStorage access restricted:', e);
}

let activeVictimId = 'VIC-MP-2024-881';
let audioContext = null;
let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let pcmProcessor = null;
let pcmSamples = [];
let isRecording = false;
let animationFrameId = null;
let recordingTimerInterval = null;
let recordingSeconds = 0;
let isListeningSTT = false;
let speechRecognizer = null;
let longitudinalChartInstance = null;
let stageChartInstance = null;
let impactChartInstance = null;

const SPEECH_LOCALES = {
  hi: 'hi-IN',
  en: 'en-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN'
};

// Safe DOM initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('[SAMVEDNA AI] Initializing client application...');
  
  try {
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) langSelect.value = currentLang;
  } catch (e) {}

  try { applyLocalization(currentLang); } catch (e) {}
  try { initWaveformVisualizer(); } catch (e) {}
  try { loadDistrictMetrics(); } catch (e) {}
  try { loadDistrictCases(); } catch (e) {}
  try { loadVictimDropdown(); } catch (e) {}
  try { loadCounsellorDossier(activeVictimId); } catch (e) {}
  try { pollAlerts(); } catch (e) {}
  
  setInterval(() => {
    try { pollAlerts(); } catch (e) {}
  }, 8000);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('lang')) {
    changeLanguage(urlParams.get('lang'));
  }
  if (urlParams.get('view') === 'official') {
    switchMainView('official');
    if (urlParams.get('sub')) {
      switchOfficialSubTab(urlParams.get('sub'));
    }
  }

  console.log('[SAMVEDNA AI] Client initialized successfully.');
});

// View Navigation: Victim Check-in vs Official Dashboard
function switchMainView(viewId) {
  const victimView = document.getElementById('view-victim');
  const officialView = document.getElementById('view-official');
  const victimTab = document.getElementById('tab-victim');
  const officialTab = document.getElementById('tab-official');

  if (viewId === 'victim') {
    if (victimView) victimView.classList.remove('hidden');
    if (officialView) officialView.classList.add('hidden');
    if (victimTab) {
      victimTab.className = 'px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-semibold bg-[#8B7FD6] text-white shadow-sm transition-all flex items-center space-x-1 sm:space-x-1.5';
    }
    if (officialTab) {
      officialTab.className = 'px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-medium text-slate-300 hover:text-white transition-all flex items-center space-x-1 sm:space-x-1.5';
    }
  } else {
    if (victimView) victimView.classList.add('hidden');
    if (officialView) officialView.classList.remove('hidden');
    if (victimTab) {
      victimTab.className = 'px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-medium text-slate-300 hover:text-white transition-all flex items-center space-x-1 sm:space-x-1.5';
    }
    if (officialTab) {
      officialTab.className = 'px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg font-semibold bg-[#8B7FD6] text-white shadow-sm transition-all flex items-center space-x-1 sm:space-x-1.5';
    }
    setTimeout(() => {
      try {
        if (longitudinalChartInstance) longitudinalChartInstance.resize();
      } catch (e) {}
    }, 150);
  }
}

// Official Sub-Tabs Navigation
function switchOfficialSubTab(subId) {
  const subpanels = ['district', 'counsellor', 'analytics'];
  subpanels.forEach(s => {
    const panel = document.getElementById(`subpanel-${s}`);
    const btn = document.getElementById(`subtab-${s}`);
    if (panel && btn) {
      if (s === subId) {
        panel.classList.remove('hidden');
        btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2557] text-white shadow-sm flex items-center space-x-1.5 transition-all';
      } else {
        panel.classList.add('hidden');
        btn.className = 'px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0F2557] hover:bg-slate-100 transition-colors flex items-center space-x-1.5';
      }
    }
  });

  if (subId === 'counsellor') {
    setTimeout(() => {
      try {
        if (longitudinalChartInstance) longitudinalChartInstance.resize();
      } catch (e) {}
    }, 150);
  } else if (subId === 'analytics') {
    setTimeout(() => {
      try {
        initAnalyticsCharts();
      } catch (e) {}
    }, 150);
  }
}

// Dynamic Multilingual Switcher
function changeLanguage(lang) {
  currentLang = lang;
  try {
    localStorage.setItem('samvedna_selected_lang', lang);
  } catch (e) {}

  const select = document.getElementById('languageSelect');
  if (select && select.value !== lang) {
    select.value = lang;
  }

  applyLocalization(lang);

  // Synchronize active speech recognition language if initialized
  if (speechRecognizer && SPEECH_LOCALES[lang]) {
    speechRecognizer.lang = SPEECH_LOCALES[lang];
  }
}

function applyLocalization(lang) {
  if (typeof TRANSLATIONS === 'undefined') return;
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'] || TRANSLATIONS['hi'] || {};

  // 1. Translate all [data-i18n] elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!dict[key]) return;

    const textSpan = el.querySelector('span:not([class*="fa"])');
    if (textSpan) {
      textSpan.innerText = dict[key];
    } else {
      const icon = el.querySelector('i');
      if (icon) {
        const iconClone = icon.cloneNode(true);
        el.innerHTML = '';
        el.appendChild(iconClone);
        el.appendChild(document.createTextNode(' ' + dict[key]));
      } else {
        el.innerText = dict[key];
      }
    }
  });

  // 2. Translate all [data-i18n-placeholder] inputs
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });

  // 3. Explicitly update chat input placeholder & send button
  const chatInput = document.getElementById('chatInput');
  if (chatInput && dict.chat_placeholder) {
    chatInput.placeholder = dict.chat_placeholder;
  }
  const btnSendChat = document.getElementById('btnSendChat');
  if (btnSendChat) {
    const span = btnSendChat.querySelector('span');
    if (span && dict.btn_send) span.innerText = dict.btn_send;
  }

  // 4. Update initial bot greeting if present
  const welcomeEl = document.getElementById('welcomeBotText');
  if (welcomeEl && dict.chat_welcome) {
    welcomeEl.innerText = dict.chat_welcome;
  }

  // 5. Update first message TTS button text if present
  const firstTTS = document.querySelector('#chatFeed button span');
  if (firstTTS && dict.btn_listen_audio) {
    firstTTS.innerText = dict.btn_listen_audio;
  }

  // 6. Update Voice Record status badge and button if idle
  if (!isRecording) {
    const statusBadge = document.getElementById('recordingStatusBadge');
    if (statusBadge && dict.status_ready) {
      statusBadge.innerText = dict.status_ready;
    }
    const recordBtnText = document.getElementById('recordBtnText');
    if (recordBtnText && dict.btn_start_record) {
      recordBtnText.innerText = dict.btn_start_record;
    }
  }

  // 7. Update supportive greeting headers if present
  const greetTitle = document.getElementById('supportiveGreetingTitle');
  const greetSub = document.getElementById('supportiveGreetingSub');
  if (greetTitle && dict.greet_title) greetTitle.innerText = dict.greet_title;
  if (greetSub && dict.greet_sub) greetSub.innerText = dict.greet_sub;
}

// Clear Chat Feed & Reset Backend Conversation Memory
async function clearChatFeed() {
  console.log('[LLM] Resetting conversation session for:', activeVictimId);
  try {
    const formData = new FormData();
    formData.append('victim_id', activeVictimId);
    await fetch(`${API_BASE}/victim/reset`, { method: 'POST', body: formData });
    console.log('[LLM] Conversation session memory cleared on server');
  } catch (e) {
    console.warn('Could not reset session on backend:', e);
  }

  const feed = document.getElementById('chatFeed');
  if (feed) {
    const welcomeTexts = {
      hi: 'नमस्ते। मैं संवेदना AI सहायक हूँ। राष्ट्रीय अत्याचार निवारण हेल्पलाइन (14566) के माध्यम से हम आपकी मानसिक स्थिति, विधिक सुरक्षा एवं पुनर्वास में सहायता हेतु सदैव उपलब्ध हैं। आज आप कैसा महसूस कर रहे हैं?',
      en: 'Hello. I am SAMVEDNA AI Assistant. Through the National Helpline Against Atrocities (14566), we are available 24/7 for psychological care, physical protection, and rehabilitation. How are you feeling today?',
      bn: 'নমস্কার। আমি সংবেদনা এআই সহকারী। জাতীয় নির্যাতন প্রতিরোধ হেল্পলাইন (14566)-এর মাধ্যমে আমরা আপনার পাশে আছি। আজ আপনি কেমন আছেন?',
      ta: 'வணக்கம். நான் சம்வேத்னா AI உதவியாளர். தேசிய வன்கொடுமை தடுப்பு உதவி எண் (14566) மூலம் உங்களுக்கு உதவ எப்போதும் தயாராக உள்ளோம். இன்று நீங்கள் எவ்வாறு உணர்கிறீர்கள்?',
      te: 'నమస్కారం. నేను సంవేద్న AI సహాయకుడిని. జాతీయ అత్యాచారాల నిరోధక హెల్ప్‌లైన్ (14566) ద్వారా మీ సహాయం కోసం మేము సిద్ధంగా ఉన్నాము. ఈ రోజు మీరు ఎలా ఉన్నారు?'
    };
    const welcome = welcomeTexts[currentLang] || welcomeTexts['hi'];
    const listenLabel = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btn_listen_audio) ? TRANSLATIONS[currentLang].btn_listen_audio : 'सुने (TTS)';

    feed.innerHTML = `
      <div class="flex items-start space-x-2.5">
        <div class="w-7 h-7 rounded-full bg-[#7C6EE6] flex items-center justify-center text-white flex-shrink-0 text-xs shadow-2xs">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div class="chat-bubble-bot max-w-[85%]">
          <p id="welcomeBotText">${welcome}</p>
          <div class="mt-2.5 flex items-center space-x-2">
            <button onclick="speakLatestBotMessage(this)" class="px-3 py-1 bg-white hover:bg-[#F0EEFC] text-[#5C4EB7] border border-[#E0DBFB] rounded-full text-[11px] font-semibold flex items-center space-x-1.5 shadow-2xs transition-all">
              <i class="fa-solid fa-volume-high text-[#7C6EE6]"></i>
              <span>${listenLabel}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Reset Emotional State card to baseline
  const moodBadge = document.getElementById('victimMoodBadge');
  const moodConfidence = document.getElementById('victimMoodConfidence');
  const moodStress = document.getElementById('victimMoodStressLevel');
  const moodText = document.getElementById('victimMoodSummaryText');
  const voiceCuesRow = document.getElementById('victimVoiceCuesRow');

  if (voiceCuesRow) voiceCuesRow.classList.add('hidden');
  const cBadge = document.getElementById('counsellorDeepEmotionBadge');
  const cText = document.getElementById('counsellorDeepVoiceSummaryText');
  if (cBadge) {
    cBadge.innerText = 'No Audio';
    cBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800';
  }
  if (cText) {
    cText.innerText = 'Awaiting recorded voice check-in for deep vocal biomarker extraction.';
  }

  if (moodBadge) {
    moodBadge.innerText = 'Neutral';
    moodBadge.className = 'px-2.5 py-0.5 rounded text-[11px] font-bold bg-sky-950 text-sky-300 border border-sky-800';
  }
  if (moodConfidence) moodConfidence.innerText = '80%';
  if (moodStress) {
    moodStress.innerText = 'Low';
    moodStress.className = 'font-bold text-emerald-400';
  }
  if (moodText) {
    moodText.innerText = currentLang === 'hi'
      ? 'सत्र रीसेट हो गया है। आप अपनी स्थिति साझा कर सकते हैं।'
      : 'Session reset. You can share your feelings or concerns anytime.';
  }
}

// Web Speech API - Speech to Text
function toggleSpeechToText() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('btnSpeechToText');
  const input = document.getElementById('chatInput');

  if (!SpeechRec) {
    alert('Speech recognition is not supported in this browser. Please type your message.');
    if (input) input.focus();
    return;
  }

  if (!isListeningSTT) {
    try {
      speechRecognizer = new SpeechRec();
      speechRecognizer.lang = SPEECH_LOCALES[currentLang] || 'hi-IN';
      speechRecognizer.continuous = false;
      speechRecognizer.interimResults = false;

      speechRecognizer.onstart = () => {
        isListeningSTT = true;
        if (btn) {
          btn.classList.add('bg-red-950', 'border-red-600', 'animate-pulse');
          btn.innerHTML = '<i class="fa-solid fa-microphone text-red-400"></i>';
        }
        if (input) input.placeholder = `Listening (${SPEECH_LOCALES[currentLang]})... Speak now...`;
      };

      speechRecognizer.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (input) {
          input.value = (input.value ? input.value + ' ' : '') + transcript;
        }
      };

      speechRecognizer.onerror = () => { stopSTT(); };
      speechRecognizer.onend = () => { stopSTT(); };
      speechRecognizer.start();
    } catch (err) {
      console.warn('STT Error:', err);
      stopSTT();
    }
  } else {
    stopSTT();
  }

  function stopSTT() {
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch(e) {}
    }
    isListeningSTT = false;
    if (btn) {
      btn.classList.remove('bg-red-950', 'border-red-600', 'animate-pulse');
      btn.innerHTML = '<i class="fa-solid fa-microphone-lines text-sky-400"></i>';
    }
    applyLocalization(currentLang);
  }
}

// Web Speech Synthesis - Text to Speech
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LOCALES[currentLang] || 'hi-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetCode = SPEECH_LOCALES[currentLang] || 'hi-IN';
    const matchedVoice = voices.find(v => v.lang.startsWith(targetCode.substring(0, 2)) || v.lang === targetCode);
    if (matchedVoice) utterance.voice = matchedVoice;

    console.log(`[TTS] Speaking response (${cleanText.length} chars) in ${targetCode}`);
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[TTS] Playback error:', e);
  }
}

function speakLatestBotMessage(btnEl) {
  try {
    const container = btnEl.closest('.chat-bubble-bot') || btnEl.closest('.bg-slate-800');
    if (!container) return;
    const text = container.innerText.replace('सुने (TTS)', '').replace('Listen (TTS)', '').trim();
    speakText(text);
  } catch (e) {}
}

// Waveform Canvas Visualizer
function initWaveformVisualizer() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  function drawIdle() {
    if (isRecording) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8B7FD6';
    ctx.beginPath();
    const sliceWidth = canvas.width / 40;
    let x = 0;
    for (let i = 0; i < 40; i++) {
      const y = (canvas.height / 2) + Math.sin(i * 0.4) * 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  }
  drawIdle();
}

// Concurrency & Debounce Protection
let isCheckinInProgress = false;
let lastCheckinTimestamp = 0;

function setUiProcessingState(loading, statusText = '') {
  setSendButtonLoading(loading);
  const recBtn = document.getElementById('recordBtn');
  if (recBtn) {
    if (loading) {
      recBtn.setAttribute('disabled', 'true');
      recBtn.classList.add('opacity-50', 'pointer-events-none');
    } else {
      recBtn.removeAttribute('disabled');
      recBtn.classList.remove('opacity-50', 'pointer-events-none');
    }
  }
  const statusBadge = document.getElementById('recordingStatusBadge');
  if (statusBadge && statusText) {
    statusBadge.innerText = statusText;
  }
}

function setBiomarkersAnalyzing() {
  const jEl = document.getElementById('acousticJitter');
  const sEl = document.getElementById('acousticShimmer');
  const tEl = document.getElementById('acousticTremor');
  const piEl = document.getElementById('acousticPitch');
  const hEl = document.getElementById('acousticHNR');
  const paEl = document.getElementById('acousticPause');
  if (jEl) jEl.innerText = 'Analyzing...';
  if (sEl) sEl.innerText = 'Analyzing...';
  if (tEl) tEl.innerText = 'Analyzing...';
  if (piEl) piEl.innerText = 'Analyzing...';
  if (hEl) hEl.innerText = 'Analyzing...';
  if (paEl) paEl.innerText = 'Analyzing...';
}

// Live Audio Recording & Feature Extraction
let liveVoiceCheckinTranscript = '';
let liveVoiceCheckinRec = null;

async function toggleAudioRecording() {
  if (isCheckinInProgress) {
    console.warn('[GUARD] Check-in currently in progress. Ignoring record click.');
    return;
  }

  const btnText = document.getElementById('recordBtnText');
  const icon = document.getElementById('recordIcon');
  const statusBadge = document.getElementById('recordingStatusBadge');
  const dict = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]) ? TRANSLATIONS[currentLang] : {};

  if (!isRecording) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        pcmSamples = [];
        pcmProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        pcmProcessor.onaudioprocess = (e) => {
          if (!isRecording) return;
          const channelData = e.inputBuffer.getChannelData(0);
          pcmSamples.push(new Float32Array(channelData));
        };

        source.connect(pcmProcessor);
        pcmProcessor.connect(audioContext.destination);

        // Fallback MediaRecorder
        audioChunks = [];
        try {
          mediaRecorder = new MediaRecorder(audioStream);
          mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
          mediaRecorder.start(250);
        } catch (e) {}

        // Start browser speech recognition in parallel to capture transcribed words
        liveVoiceCheckinTranscript = '';
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            liveVoiceCheckinRec = new SpeechRec();
            liveVoiceCheckinRec.lang = SPEECH_LOCALES[currentLang] || 'hi-IN';
            liveVoiceCheckinRec.continuous = true;
            liveVoiceCheckinRec.interimResults = true;
            liveVoiceCheckinRec.onresult = (e) => {
              let text = '';
              for (let i = 0; i < e.results.length; i++) {
                text += e.results[i][0].transcript + ' ';
              }
              if (text.trim()) {
                liveVoiceCheckinTranscript = text.trim();
              }
            };
            liveVoiceCheckinRec.onerror = () => {};
            liveVoiceCheckinRec.start();
          } catch (e) {
            console.warn('[VOICE-STT] Browser SpeechRecognition start notice:', e);
          }
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = document.getElementById('waveformCanvas');
        const ctx = canvas.getContext('2d');

        function drawLiveWave() {
          if (!isRecording) return;
          animationFrameId = requestAnimationFrame(drawLiveWave);
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = '#FAF9FE';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = '#7C6EE6';
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        }
        drawLiveWave();

        isRecording = true;
        recordingSeconds = 0;
        if (btnText) btnText.innerText = dict.btn_stop_record || 'Stop Recording';
        if (icon) icon.className = 'fa-solid fa-stop text-[#E03131]';

        recordingTimerInterval = setInterval(() => {
          recordingSeconds++;
          if (statusBadge) {
            statusBadge.innerText = `🔴 Recording (${recordingSeconds}s)...`;
            statusBadge.className = 'px-3 py-0.5 rounded-full text-[11px] bg-[#FFEAEA] text-[#E03131] border border-[#FFD0D0] font-bold animate-pulse';
          }
        }, 1000);

        return;
      } catch (err) {
        console.warn('Microphone access denied or unavailable:', err);
        if (statusBadge) {
          statusBadge.innerText = 'Microphone permission denied';
        }
      }
    } else {
      alert('Microphone recording is not supported in this browser. Please use text check-in.');
      return;
    }
  } else {
    // Stop recording
    isRecording = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (recordingTimerInterval) clearInterval(recordingTimerInterval);

    if (liveVoiceCheckinRec) {
      try { liveVoiceCheckinRec.stop(); } catch(e) {}
    }
    const capturedTranscript = liveVoiceCheckinTranscript.trim();

    if (btnText) btnText.innerText = dict.btn_start_record || 'Start Voice Check-in';
    if (icon) icon.className = 'fa-solid fa-microphone';
    if (statusBadge) {
      statusBadge.innerText = '⚡ Extracting Prosody...';
      statusBadge.className = 'px-3 py-0.5 rounded-full text-[11px] bg-[#EBF3FF] text-[#1D4ED8] border border-[#BFDBFE] font-bold animate-pulse';
    }

    if (pcmProcessor) {
      try { pcmProcessor.disconnect(); } catch (e) {}
    }
    if (audioStream) {
      try { audioStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch(e) {}
    }

    if (pcmSamples.length > 0) {
      const wavBlob = encodePCMToWAV(pcmSamples, audioContext ? audioContext.sampleRate : 44100);
      setBiomarkersAnalyzing();
      await uploadAudioCheckin(wavBlob, capturedTranscript);
    } else if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      setBiomarkersAnalyzing();
      await uploadAudioCheckin(audioBlob, capturedTranscript);
    } else {
      if (statusBadge) {
        statusBadge.innerText = 'Ready to listen';
        statusBadge.className = 'status-pill status-ready text-slate-600 font-medium';
      }
    }

    initWaveformVisualizer();
  }
}

// Convert Float32 PCM to Standard 16-bit Mono RIFF WAV Blob
function encodePCMToWAV(chunks, sourceSampleRate) {
  let totalLength = 0;
  for (let i = 0; i < chunks.length; i++) totalLength += chunks[i].length;

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    merged.set(chunks[i], offset);
    offset += chunks[i].length;
  }

  const targetSampleRate = 16000;
  let downsampled;
  if (sourceSampleRate !== targetSampleRate) {
    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(totalLength / ratio);
    downsampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const origIdx = Math.floor(i * ratio);
      downsampled[i] = merged[origIdx] || 0;
    }
  } else {
    downsampled = merged;
  }

  const buffer = new ArrayBuffer(44 + downsampled.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + downsampled.length * 2, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16 bits per sample

  writeString(view, 36, 'data');
  view.setUint32(40, downsampled.length * 2, true);

  let p = 44;
  for (let i = 0; i < downsampled.length; i++) {
    const s = Math.max(-1, Math.min(1, downsampled[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    p += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Multilingual Quick Presets
const PRESET_SCENARIOS = {
  hi: {
    critical_panic: 'रात को 4 लोग घर के बाहर आकर गोली मारने की धमकी दे रहे थे। बहुत डर लग रहा है।',
    elevated_threat: 'अगले हफ्ते कोर्ट में गवाही है और मुझे बहुत घबराहट हो रही है।',
    depressive_flat: 'गांव में हमारा सामाजिक बहिष्कार कर दिया गया है, कोई बात नहीं करता। बहुत अकेलापन लग रहा है।',
    neutral: 'आज पहले से थोड़ा ठीक महसूस कर रहा हूँ, धन्यवाद।'
  },
  en: {
    critical_panic: 'Last night 4 people came outside my house threatening to shoot me. I am terrified.',
    elevated_threat: 'I have court testimony scheduled next week and I am feeling very anxious.',
    depressive_flat: 'We have been ostracized in the village and no one speaks to us. I feel completely alone.',
    neutral: 'I am feeling somewhat better today than before, thank you.'
  },
  bn: {
    critical_panic: 'গত রাতে ৪ জন লোক এসে আমাকে গুলি করার হুমকি দিয়েছে। খুব ভয় করছে।',
    elevated_threat: 'পরের সপ্তাহে আদালতে সাক্ষ্য দিতে হবে, খুব দুশ্চিন্তা হচ্ছে।',
    depressive_flat: 'গ্রামে আমাদের সামাজিক বয়কট করা হয়েছে, কেউ কথা বলে না। খুব একা লাগছে।',
    neutral: 'আজ আগের চেয়ে কিছুটা ভালো লাগছে, ধন্যবাদ।'
  },
  ta: {
    critical_panic: 'நேற்று இரவு 4 பேர் என் வீட்டின் வெளியே வந்து சுடுவதாக மிரட்டினர். எனக்கு மிகவும் பயமாக இருக்கிறது.',
    elevated_threat: 'அடுத்த வாரம் நீதிமன்றத்தில் சாட்சியம் அளிக்க வேண்டும், மிகுந்த பதற்றமாக உள்ளது.',
    depressive_flat: 'ஊரில் எங்களை சமூக புறக்கணிப்பு செய்துள்ளனர், யாரும் பேசுவதில்லை. மிகவும் தனிமையாக உள்ளது.',
    neutral: 'இன்று முன்பை விட சற்று நன்றாக உணர்கிறேன், நன்றி.'
  },
  te: {
    critical_panic: 'నిన్న రాత్రి 4 గురు మా ఇంటి బయటకు వచ్చి కాల్చి చంపుతామని బెదిరించారు. చాలా భయంగా ఉంది.',
    elevated_threat: 'వచ్చే వారం కోర్టులో సాక్ష్యం ఇవ్వాలి, చాలా ఆందోళనగా ఉంది.',
    depressive_flat: 'గ్రామంలో మమ్మల్ని సామాజికంగా బహిష్కరించారు, ఎవరూ మాట్లాడటం లేదు. చాలా ఒంటరితనంగా ఉంది.',
    neutral: 'ఈ రోజు మునుపటి కంటే కొంచెం మెరుగ్గా ఉంది, ధన్యవాదాలు.'
  }
};

// Immediate UI Helpers (0ms Latency Perception)
function appendUserMessage(text) {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;
  const userDiv = document.createElement('div');
  userDiv.className = 'flex items-start space-x-2.5 justify-end';
  userDiv.innerHTML = `
    <div class="chat-bubble-user max-w-[85%] leading-relaxed">
      ${text}
    </div>
    <div class="w-7 h-7 rounded-full bg-[#0F2557] flex items-center justify-center text-white flex-shrink-0 text-xs shadow-2xs">
      <i class="fa-solid fa-user"></i>
    </div>
  `;
  feed.appendChild(userDiv);
  feed.scrollTop = feed.scrollHeight;
}

function showTypingIndicator() {
  const feed = document.getElementById('chatFeed');
  if (!feed) return null;
  const id = 'typingIndicator_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex items-start space-x-2.5';
  const thinkingLabel = currentLang === 'hi' 
    ? 'संवेदना AI उत्तर तैयार कर रही है...' 
    : (currentLang === 'en' ? 'SAMVEDNA AI is thinking...' : 'Thinking...');

  div.innerHTML = `
    <div class="w-7 h-7 rounded-full bg-[#7C6EE6] flex items-center justify-center text-white flex-shrink-0 text-xs shadow-2xs animate-pulse">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="bg-[#F4F2FF] text-slate-600 p-3 rounded-2xl rounded-tl-none border border-[#E8E4FD] max-w-[85%] flex items-center space-x-2 text-xs shadow-2xs">
      <span class="flex space-x-1 items-center">
        <span class="w-1.5 h-1.5 bg-[#8B7FD6] rounded-full animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-1.5 h-1.5 bg-[#8B7FD6] rounded-full animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-1.5 h-1.5 bg-[#8B7FD6] rounded-full animate-bounce" style="animation-delay: 300ms"></span>
      </span>
      <span class="italic text-[11px] text-[#5C4EB7] font-medium">${thinkingLabel}</span>
    </div>
  `;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

function setSendButtonLoading(loading) {
  const btn = document.getElementById('btnSendChat');
  const icon = document.getElementById('sendChatIcon');
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.classList.add('opacity-70', 'cursor-not-allowed');
    if (icon) icon.className = 'fa-solid fa-circle-notch fa-spin text-xs';
  } else {
    btn.classList.remove('opacity-70', 'cursor-not-allowed');
    if (icon) icon.className = 'fa-solid fa-paper-plane text-xs';
  }
}

// Upload Audio Checkin & Trigger Fast Response
async function uploadAudioCheckin(blob, userSpokenText = '') {
  const progressBox = document.getElementById('voiceAnalysisProgress');
  const progressText = document.getElementById('voiceProgressText');
  const statusBadge = document.getElementById('recordingStatusBadge');

  if (progressBox && progressText) {
    progressBox.classList.remove('hidden');
    progressText.innerText = 'Analyzing your check-in...';
  }

  // Instant visual feedback in chat: show transcribed user speech or audio label
  const msgText = userSpokenText ? `🎤 <em>"${userSpokenText}"</em>` : '🎤 <em>[Recorded Voice Check-in submitted...]</em>';
  appendUserMessage(msgText);
  const typingId = showTypingIndicator();
  setSendButtonLoading(true);

  const formData = new FormData();
  formData.append('victim_id', activeVictimId);
  formData.append('language', currentLang);
  formData.append('channel', 'Web_Voice_Checkin');
  const chatVal = document.getElementById('chatInput') && document.getElementById('chatInput').value.trim() ? document.getElementById('chatInput').value.trim() : '';
  formData.append('text_content', userSpokenText || chatVal);
  formData.append('audio_file', blob, 'victim_voice.wav');

  if (progressText) {
    setTimeout(() => { progressText.innerText = 'Understanding your response with SAMVEDNA AI...'; }, 200);
  }

  try {
    const res = await fetch(`${API_BASE}/victim/checkin`, { method: 'POST', body: formData });
    const data = await res.json();

    if (statusBadge) {
      statusBadge.innerText = 'Analyzed';
      statusBadge.className = 'px-2.5 py-0.5 rounded text-[11px] bg-emerald-950 text-emerald-300 font-bold';
    }
    if (progressBox) progressBox.classList.add('hidden');

    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
    handleCheckinResponse(data, msgText, true);

    // Automatically speak the response aloud for voice check-in
    if (data && data.ai_response) {
      setTimeout(() => {
        speakText(data.ai_response);
      }, 350);
    }
  } catch (err) {
    console.error('Audio upload error:', err);
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
    if (progressBox) progressBox.classList.add('hidden');
    if (statusBadge) {
      statusBadge.innerText = 'Ready to listen';
      statusBadge.className = 'status-pill status-ready text-slate-600 font-medium';
    }
  }
}

// File Upload Handler
async function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Instant user feedback
  appendUserMessage(`📁 <em>Uploaded audio file: ${file.name}</em>`);
  const typingId = showTypingIndicator();
  setSendButtonLoading(true);

  const formData = new FormData();
  formData.append('victim_id', activeVictimId);
  formData.append('language', currentLang);
  formData.append('channel', 'Audio_Upload');
  formData.append('audio_file', file);
  formData.append('text_content', 'Uploaded audio check-in file');

  try {
    const res = await fetch(`${API_BASE}/victim/checkin`, { method: 'POST', body: formData });
    const data = await res.json();
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
    handleCheckinResponse(data, `📁 [Audio File: ${file.name}]`, true);
  } catch (err) {
    console.error('File upload error:', err);
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
  }
}

// Preset Simulation Handler (Multilingual & Zero Latency Perception)
async function applyPreset(presetName) {
  const langPresets = PRESET_SCENARIOS[currentLang] || PRESET_SCENARIOS['en'] || PRESET_SCENARIOS['hi'];
  const sampleText = langPresets[presetName] || PRESET_SCENARIOS['en'][presetName];

  // Immediately render user message
  appendUserMessage(sampleText);
  // Immediately show typing indicator
  const typingId = showTypingIndicator();
  setSendButtonLoading(true);

  const formData = new FormData();
  formData.append('victim_id', activeVictimId);
  formData.append('language', currentLang);
  formData.append('channel', 'Web_Simulation');
  formData.append('text_content', sampleText);
  formData.append('scenario_preset', presetName);

  try {
    const res = await fetch(`${API_BASE}/victim/checkin`, { method: 'POST', body: formData });
    const data = await res.json();
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
    handleCheckinResponse(data, sampleText, true);
  } catch (err) {
    console.error('Preset checkin error:', err);
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
  }
}

// Submit Text Chat Check-in (Instant Message + Fast Groq LPU Response)
async function submitCheckin(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  // Clear input immediately
  input.value = '';

  // Immediately display user message and animated thinking bubble
  appendUserMessage(text);
  const typingId = showTypingIndicator();
  setSendButtonLoading(true);

  const formData = new FormData();
  formData.append('victim_id', activeVictimId);
  formData.append('language', currentLang);
  formData.append('channel', 'Web_Chat');
  formData.append('text_content', text);

  try {
    const res = await fetch(`${API_BASE}/victim/checkin`, { method: 'POST', body: formData });
    const data = await res.json();
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
    handleCheckinResponse(data, text, true);
  } catch (err) {
    console.error('Checkin error:', err);
    removeTypingIndicator(typingId);
    setSendButtonLoading(false);
  }
}

// Handle Check-in Response & Update UI Elements
function handleCheckinResponse(data, userMsg, userAlreadyAppended = false) {
  const feed = document.getElementById('chatFeed');
  const dict = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]) ? TRANSLATIONS[currentLang] : {};

  if (feed) {
    if (!userAlreadyAppended) {
      let displayMsg = userMsg;
      if (userMsg.includes('🎤') && data.transcription && !data.transcription.startsWith('[')) {
        displayMsg = `🎤 <em>"${data.transcription}"</em>`;
      }
      appendUserMessage(displayMsg);
    }

    // Append SAMVEDNA AI Empathetic Message Bubble
    const aiDiv = document.createElement('div');
    aiDiv.className = 'flex items-start space-x-2.5';
    aiDiv.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-[#7C6EE6] flex items-center justify-center text-white flex-shrink-0 text-xs shadow-2xs">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="chat-bubble-bot max-w-[85%]">
        <p>${data.ai_response || 'हम आपकी सहायता के लिए सदैव उपलब्ध हैं।'}</p>
        <div class="mt-2.5 flex items-center space-x-2">
          <button onclick="speakLatestBotMessage(this)" class="px-3 py-1 bg-white hover:bg-[#F0EEFC] text-[#5C4EB7] border border-[#E0DBFB] rounded-full text-[11px] font-medium flex items-center space-x-1.5 shadow-2xs transition-all">
            <i class="fa-solid fa-volume-high"></i>
            <span>${dict.btn_listen_audio || 'Listen (TTS)'}</span>
          </button>
        </div>
      </div>
    `;
    feed.appendChild(aiDiv);
    feed.scrollTop = feed.scrollHeight;
  }

  // Update Emotional State Summary in Victim View
  if (data.emotional_state) {
    const es = data.emotional_state;
    console.log(`[EMOTION] Prediction: ${es.mood} | Confidence: ${es.confidence} | Stress: ${es.distress_level}`);

    const moodBadge = document.getElementById('victimMoodBadge');
    const moodConfidence = document.getElementById('victimMoodConfidence');
    const moodStress = document.getElementById('victimMoodStressLevel');
    const moodText = document.getElementById('victimMoodSummaryText');

    if (moodBadge) {
      moodBadge.innerText = es.mood || 'Neutral';
      if (['Fearful', 'Overwhelmed', 'Critical'].includes(es.mood)) {
        moodBadge.className = 'px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEAEA] text-[#E03131] border border-[#FFD0D0] animate-pulse';
      } else if (['Anxious', 'Distressed', 'Angry'].includes(es.mood)) {
        moodBadge.className = 'px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF4E5] text-[#D97706] border border-[#FDE68A]';
      } else if (es.mood === 'Sad') {
        moodBadge.className = 'px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#F0EEFC] text-[#5C4EB7] border border-[#DDD6FE]';
      } else {
        moodBadge.className = 'px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F9F4] text-[#00A389] border border-[#B7EFE3]';
      }
    }

    if (moodConfidence) {
      const confPct = Math.round((es.confidence || 0.8) * 100);
      moodConfidence.innerText = `${confPct}%`;
    }

    if (moodStress) {
      const sLevel = (es.distress_level || 'low').toUpperCase();
      moodStress.innerText = sLevel.charAt(0) + sLevel.slice(1).toLowerCase();
      if (sLevel === 'CRITICAL' || sLevel === 'HIGH') {
        moodStress.className = 'font-bold text-[#E03131]';
      } else if (sLevel === 'MODERATE') {
        moodStress.className = 'font-bold text-[#D97706]';
      } else {
        moodStress.className = 'font-bold text-[#00A389]';
      }
    }

    if (moodText && es.non_technical_summary) {
      moodText.innerText = es.non_technical_summary;
    }
  }

  // Update Technical & Deep Acoustic Biomarkers
  if (data.voice_metrics) {
    const vm = data.voice_metrics;
    const v = vm.calculated_features || vm;
    const obs = vm.acoustic_observations || {};

    console.log(`[VOICE-DEEP] Emotion: ${vm.primary_vocal_emotion} | Stress: ${vm.vocal_stress_score} | Stability: ${obs.vocal_stability}`);

    // Update Victim Voice Cues Badges
    const voiceCuesRow = document.getElementById('victimVoiceCuesRow');
    const voiceEmotionText = document.getElementById('victimVoiceEmotionText');
    const vocalStabilityText = document.getElementById('victimVocalStabilityText');
    const breathingText = document.getElementById('victimBreathingText');

    if (vm.has_audio) {
      if (voiceCuesRow) {
        voiceCuesRow.classList.remove('hidden');
        if (voiceEmotionText) voiceEmotionText.innerText = vm.primary_vocal_emotion || 'Vocal Check-in';
        if (vocalStabilityText) vocalStabilityText.innerText = `Stability: ${obs.vocal_stability || 'Steady'}`;
        if (breathingText) breathingText.innerText = `Breathing: ${obs.breathing_pattern || 'Normal'}`;
      }

      // Authentic DSP numbers from real audio analysis
      const jEl = document.getElementById('acousticJitter');
      const sEl = document.getElementById('acousticShimmer');
      const tEl = document.getElementById('acousticTremor');
      const piEl = document.getElementById('acousticPitch');
      const hEl = document.getElementById('acousticHNR');
      const paEl = document.getElementById('acousticPause');

      if (jEl) jEl.innerText = `${v.jitter_pct}%`;
      if (sEl) sEl.innerText = `${v.shimmer_pct}%`;
      if (tEl) tEl.innerText = `${v.tremor_intensity} / 100`;
      if (piEl) piEl.innerText = `${v.f0_mean_hz || v.pitch_mean_hz} Hz`;
      if (hEl) hEl.innerText = `${v.hnr_db} dB`;
      if (paEl) paEl.innerText = `${Math.round(v.pause_ratio * 100)}%`;

      // Counsellor Deep Audio Perception Card
      const cBadge = document.getElementById('counsellorDeepEmotionBadge');
      const cText = document.getElementById('counsellorDeepVoiceSummaryText');
      if (cBadge && vm.primary_vocal_emotion) {
        cBadge.innerText = vm.primary_vocal_emotion;
        if (['Fear / Terror', 'Acute Distress', 'Despair / Hopelessness'].includes(vm.primary_vocal_emotion)) {
          cBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 animate-pulse';
        } else if (['Anxious Hesitation', 'Agitation / Anger'].includes(vm.primary_vocal_emotion)) {
          cBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800';
        } else {
          cBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800';
        }
      }
      if (cText && vm.clinical_voice_summary) {
        cText.innerText = vm.clinical_voice_summary;
      }
    } else {
      // Text-only: Clean display, no fake numbers
      if (voiceCuesRow) voiceCuesRow.classList.add('hidden');
      const jEl = document.getElementById('acousticJitter');
      const sEl = document.getElementById('acousticShimmer');
      const tEl = document.getElementById('acousticTremor');
      const piEl = document.getElementById('acousticPitch');
      const hEl = document.getElementById('acousticHNR');
      const paEl = document.getElementById('acousticPause');
      if (jEl) jEl.innerText = '—';
      if (sEl) sEl.innerText = '—';
      if (tEl) tEl.innerText = '—';
      if (piEl) piEl.innerText = '—';
      if (hEl) hEl.innerText = '—';
      if (paEl) paEl.innerText = '—';
    }
  }

  // Automatic speech playback on voice check-ins
  if (userMsg.includes('🎤') && data.ai_response) {
    speakText(data.ai_response);
  }

  try { pollAlerts(); } catch (e) {}
  try { loadDistrictMetrics(); } catch (e) {}
  try { loadDistrictCases(); } catch (e) {}
  try { if (activeVictimId) loadCounsellorDossier(activeVictimId); } catch (e) {}
}

// One-Touch Emergency SOS Action
async function triggerEmergencySOS() {
  const confirmSOS = confirm("🚨 EMERGENCY CONFIRMATION / आपातकालीन पुष्टि:\n\nDo you want to dispatch immediate armed police security & high-priority nodal crisis alert?");
  if (!confirmSOS) return;

  const formData = new FormData();
  formData.append('victim_id', activeVictimId);
  formData.append('location', 'Lat: 26.4948, Lng: 77.9940 (Special Protected Sector)');
  formData.append('emergency_note', 'PHYSICAL INTIMIDATION & THREAT ALERT ACTIVATED');

  try {
    const res = await fetch(`${API_BASE}/victim/sos`, { method: 'POST', body: formData });
    const data = await res.json();
    alert(`🚨 EMERGENCY SOS DISPATCHED!\n\nAlert ID: ${data.alert_id}\nSuperintendent of Police & District Crisis Cell mobilized.`);
    pollAlerts();
    switchMainView('official');
  } catch (err) {
    console.error('SOS error:', err);
  }
}

// Load District Summary Metrics
async function loadDistrictMetrics() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    const data = await res.json();

    const mTotal = document.getElementById('metricTotalCases');
    const mCrit = document.getElementById('metricCriticalCases');
    const mHigh = document.getElementById('metricHighCases');
    const mBail = document.getElementById('metricBailCases');

    if (mTotal) mTotal.innerText = data.total_monitored_cases;
    if (mCrit) mCrit.innerText = data.critical_cases;
    if (mHigh) mHigh.innerText = data.high_risk_cases;
    if (mBail && data.vulnerability_flags) mBail.innerText = data.vulnerability_flags.accused_out_on_bail;
  } catch (err) {
    console.error('Metrics error:', err);
  }
}

// Load Prioritized Triage Cases
async function loadDistrictCases() {
  const filterEl = document.getElementById('caseRiskFilter');
  const filter = filterEl ? filterEl.value : 'ALL';
  try {
    const res = await fetch(`${API_BASE}/dashboard/cases?risk_filter=${filter}`);
    const data = await res.json();
    const container = document.getElementById('caseQueueContainer');
    if (!container) return;
    container.innerHTML = '';

    data.cases.forEach(c => {
      const isCrit = c.current_risk_level === 'CRITICAL';
      const isHigh = c.current_risk_level === 'HIGH';

      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border ${isCrit ? 'bg-red-50/80 border-red-200' : (isHigh ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50/80 border-slate-200')} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-slate-300`;
      
      card.innerHTML = `
        <div class="space-y-1.5 max-w-2xl">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded text-xs font-black ${isCrit ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' : (isHigh ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')}">
              ${c.current_risk_level} (${c.current_dds}/100)
            </span>
            <span class="text-xs font-bold text-slate-900">${c.victim_code}</span>
            <span class="text-[11px] text-slate-500 font-medium">| ${c.district}, ${c.state}</span>
            <span class="text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-semibold">${c.legal_stage}</span>
            ${c.accused_on_bail ? '<span class="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 font-bold">Accused on Bail</span>' : ''}
          </div>
          <p class="text-xs text-slate-800 font-semibold">${c.sections_invoked}</p>
          <p class="text-[11px] text-slate-600 leading-relaxed">${c.summary}</p>
        </div>

        <div class="flex items-center space-x-2 flex-shrink-0">
          <button onclick="openCounsellorDossierDirect('${c.victim_id}')" class="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all">
            <i class="fa-solid fa-user-doctor text-[#7C6EE6]"></i>
            <span>Dossier</span>
          </button>
          <button onclick="dispatchPoliceSecurity('${c.victim_id}', '${c.district}')" class="px-3.5 py-2 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all">
            <i class="fa-solid fa-shield"></i>
            <span>Sec 15A Protection</span>
          </button>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error('Cases error:', err);
  }
}

// Open Counsellor Dossier Direct
function openCounsellorDossierDirect(victimId) {
  const sel = document.getElementById('counsellorVictimSelect');
  if (sel) sel.value = victimId;
  loadCounsellorDossier(victimId);
  switchMainView('official');
  switchOfficialSubTab('counsellor');
}

// Dispatch Police Security Order
async function dispatchPoliceSecurity(victimId, district) {
  alert(`✅ ORDER ISSUED under Section 15A(6)(b) of SC/ST (PoA) Act.\n\nSuperintendent of Police (${district}) instructed to deploy armed guard picket at victim residence.`);
  try { pollAlerts(); } catch (e) {}
}

// Load Victim Dropdown
async function loadVictimDropdown() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/cases`);
    const data = await res.json();
    const select = document.getElementById('counsellorVictimSelect');
    if (!select) return;
    select.innerHTML = '';

    data.cases.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.victim_id;
      opt.innerText = `${c.victim_code} - ${c.district} (${c.current_risk_level} ${c.current_dds})`;
      if (c.victim_id === activeVictimId) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Victim select error:', err);
  }
}

// Load Counsellor Dossier & Chart
async function loadCounsellorDossier(victimId) {
  activeVictimId = victimId;
  try {
    const res = await fetch(`${API_BASE}/counsellor/case-file/${victimId}`);
    const data = await res.json();

    if (data.longitudinal_trajectory) {
      renderLongitudinalChart(data.longitudinal_trajectory);
    }
  } catch (err) {
    console.error('Dossier error:', err);
  }
}

function renderLongitudinalChart(trajectory) {
  const canvas = document.getElementById('longitudinalChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  if (longitudinalChartInstance) {
    try { longitudinalChartInstance.destroy(); } catch(e) {}
  }

  const labels = trajectory.map((t, idx) => `Week ${idx + 1}`);
  const ddsValues = trajectory.map(t => t.dds);
  const voiceValues = trajectory.map(t => t.voice_stress);

  try {
    longitudinalChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Composite Dynamic Distress Score (DDS)',
            data: ddsValues,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 6,
            pointBackgroundColor: '#ef4444'
          },
          {
            label: 'Voice Acoustic Stress Score',
            data: voiceValues,
            borderColor: '#38bdf8',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#38bdf8'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(226, 232, 240, 0.8)' }, ticks: { color: '#64748b' } },
          x: { grid: { color: 'rgba(226, 232, 240, 0.5)' }, ticks: { color: '#64748b' } }
        },
        plugins: { legend: { labels: { color: '#1e293b', font: { size: 11, weight: '600' } } } }
      }
    });
  } catch (e) {
    console.warn('Chart render error:', e);
  }
}

async function saveCounsellorNote(event) {
  if (event) event.preventDefault();
  const obsEl = document.getElementById('noteObservations');
  const obs = obsEl ? obsEl.value : '';
  if (!obs.trim()) return;

  const formData = new FormData();
  formData.append('victim_id', activeVictimId);
  formData.append('counsellor_name', 'Dr. Psychologist (Tele-MANAS)');
  formData.append('clinical_observations', obs);

  try {
    await fetch(`${API_BASE}/counsellor/note`, { method: 'POST', body: formData });
    if (obsEl) obsEl.value = '';
    alert('✅ Clinical Note Recorded Successfully!');
  } catch (err) {
    console.error('Save note error:', err);
  }
}

function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  const stageCanvas = document.getElementById('stageVulnerabilityChart');
  if (stageCanvas && !stageChartInstance) {
    const stageCtx = stageCanvas.getContext('2d');
    stageChartInstance = new Chart(stageCtx, {
      type: 'bar',
      data: {
        labels: ['FIR / Complaint', 'Bail Hearing', 'Chargesheet', 'Court Deposition', 'Relief Disbursement', 'Rehabilitation'],
        datasets: [{
          label: 'Average Distress Index (DDS)',
          data: [58, 86, 52, 91, 69, 38],
          backgroundColor: [
            'rgba(56, 189, 248, 0.7)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(56, 189, 248, 0.7)',
            'rgba(220, 38, 38, 0.9)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.7)'
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(226, 232, 240, 0.8)' } },
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const impactCanvas = document.getElementById('interventionImpactChart');
  if (impactCanvas && !impactChartInstance) {
    const impactCtx = impactCanvas.getContext('2d');
    impactChartInstance = new Chart(impactCtx, {
      type: 'bar',
      data: {
        labels: ['Armed Police Picket (Sec 15A)', 'Tele-MANAS Trauma Care', 'Fast-Track Relief DBT', 'Safe Shelter Relocation'],
        datasets: [
          {
            label: 'Pre-Intervention Distress',
            data: [88, 79, 74, 86],
            backgroundColor: 'rgba(239, 68, 68, 0.75)',
            borderRadius: 6
          },
          {
            label: 'Post-Intervention (30 Days)',
            data: [38, 42, 35, 31],
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(226, 232, 240, 0.8)' } },
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
        },
        plugins: { legend: { labels: { color: '#1e293b', font: { weight: '600' } } } }
      }
    });
  }
}

async function pollAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts/feed`);
    const data = await res.json();

    const badge = document.getElementById('activeAlertsBadge');
    if (badge) {
      if (data.total_active > 0) {
        badge.innerText = data.total_active;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    const feed = document.getElementById('alertsDrawerFeed');
    if (feed) {
      feed.innerHTML = '';
      data.alerts.forEach(a => {
        const isCrit = a.severity === 'EMERGENCY_SOS' || a.severity === 'CRITICAL';
        const el = document.createElement('div');
        el.className = `p-3.5 rounded-xl border ${isCrit ? 'bg-red-50/80 border-red-200' : 'bg-slate-50 border-slate-200'} space-y-2 text-xs shadow-sm`;
        el.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="font-bold ${isCrit ? 'text-red-700' : 'text-amber-700'}">${a.severity}</span>
            <span class="text-[10px] text-slate-500 font-medium">${a.timestamp.substring(11, 16)}</span>
          </div>
          <p class="font-bold text-slate-900">${a.victim_name} (${a.district}, ${a.state})</p>
          <p class="text-slate-600 text-[11px] leading-relaxed">${a.trigger_reason}</p>
        `;
        feed.appendChild(el);
      });
    }

  } catch (err) {
    console.error('Alert poll error:', err);
  }
}

function toggleAlertsDrawer() {
  const drawer = document.getElementById('alertsDrawer');
  if (drawer) drawer.classList.toggle('translate-x-full');
}
