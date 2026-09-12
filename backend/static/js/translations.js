// SAMVEDNA AI - Centralized Multilingual Localization Dictionary
// Fully localized for 5 Languages: English, Hindi, Bengali, Tamil, Telugu

const TRANSLATIONS = {
  hi: {
    speech_code: 'hi-IN',
    app_title: 'संवेदना AI',
    app_subtitle: 'राष्ट्रीय हेल्पलाइन (NHAA 14566) • 24/7 मानसिक स्वास्थ्य एवं सुरक्षा सहायता',
    nav_victim_checkin: 'पीड़ित चेक-इन',
    nav_official_dashboard: 'अधिकारिक डैशबोर्ड',
    btn_emergency_sos: 'EMERGENCY SOS',

    // Hero Greeting
    greet_title: 'पिछली बातचीत के बाद से आपकी स्थिति कैसी है?',
    greet_sub: 'संक्षिप्त संदेश साझा करें या वॉइस चेक-इन रिकॉर्ड करें। हमारे AI सहायक आपकी सुरक्षा एवं मानसिक स्थिति को समझने हेतु 24/7 उपलब्ध हैं।',

    // Voice Check-in Card
    voice_checkin_title: 'वॉइस चेक-इन',
    voice_checkin_sub: 'अपनी भावनाएं साझा करने हेतु स्वाभाविक रूप से बोलें',
    status_ready: 'सुनने के लिए तैयार',
    btn_start_record: 'वॉइस चेक-इन शुरू करें',
    btn_stop_record: 'रिकॉर्डिंग रोकें',
    btn_upload_audio: 'ऑडियो फाइल चुनें',

    // Emotional State Card
    emotional_state_title: 'मानसिक एवं भावनात्मक स्थिति',
    label_confidence: 'सटीकता',
    label_stress: 'तनाव का स्तर',
    mood_help_text: 'अपनी स्थिति साझा करें। आपके वॉइस बायोमार्कर्स एवं संदेश हमें आपकी मानसिक स्थिति समझने में मदद करते हैं।',
    disclaimer_text: 'संवादात्मक एवं वॉइस संकेतों पर आधारित — यह चिकित्सीय निदान नहीं है।',

    // Quick Situational Scenarios
    quick_scenarios_label: 'त्वरित परिस्थितिजन्य परिदृश्य:',
    scenario_critical: '🚨 गंभीर धमकी व भय',
    scenario_elevated: '⚠️ कोर्ट में गवाही का डर',
    scenario_depressed: '🌧️ सामाजिक बहिष्कार व अकेलापन',
    scenario_neutral: '🌱 आज पहले से बेहतर',

    // Support Hotlines
    hotlines_title: 'राष्ट्रीय सहायता हेल्पलाइन (24/7 निःशुल्क)',

    // Chatbot Header & Welcome Message
    chat_title: 'संवेदना AI सहायक',
    chat_llm_badge: 'Groq LPU Powered',
    chat_gemini_badge: 'Groq LPU Powered',
    chat_sub: 'सहानुभूतिपूर्ण, सुरक्षित एवं गोपनीय संवादात्मक साथी',
    btn_reset: 'रीसेट',
    chat_welcome: 'नमस्ते। मैं संवेदना AI सहायक हूँ। राष्ट्रीय अत्याचार निवारण हेल्पलाइन (14566) के माध्यम से हम आपकी सुरक्षा, मानसिक शांति और पुनर्वास में सहायता हेतु सदैव उपलब्ध हैं। आज आप कैसा महसूस कर रहे हैं?',
    chat_placeholder: 'अपनी स्थिति या चिंता यहाँ लिखें...',
    btn_send: 'भेजें',
    btn_speech_to_text: 'बोलकर लिखें',
    btn_listen_audio: 'सुने (TTS)',
    thinking_label: 'संवेदना AI उत्तर तैयार कर रही है...'
  },

  en: {
    speech_code: 'en-IN',
    app_title: 'SAMVEDNA AI',
    app_subtitle: 'National Helpline Against Atrocities (NHAA 14566) • 24/7 Dynamic Mental Health Support',
    nav_victim_checkin: 'Victim Check-in',
    nav_official_dashboard: 'Official Dashboard',
    btn_emergency_sos: 'EMERGENCY SOS',

    // Hero Greeting
    greet_title: 'How are things since we last spoke?',
    greet_sub: 'Share a short message or record a voice check-in. Our trauma-informed assistant powered by Groq LPU AI is here to listen and help you through each step.',

    // Voice Check-in Card
    voice_checkin_title: 'Voice Check-in',
    voice_checkin_sub: 'Speak naturally to share your feelings',
    status_ready: 'Ready to listen',
    btn_start_record: 'Start Voice Check-in',
    btn_stop_record: 'Stop Recording',
    btn_upload_audio: 'Upload Audio',

    // Emotional State Card
    emotional_state_title: 'Emotional State Estimation',
    label_confidence: 'Confidence',
    label_stress: 'Stress Level',
    mood_help_text: 'Take a moment to check in. Your voice and message indicators help us understand how you are feeling.',
    disclaimer_text: 'Based on conversational & voice signals — not a clinical diagnosis.',

    // Quick Situational Scenarios
    quick_scenarios_label: 'Quick Situational Scenarios:',
    scenario_critical: '🚨 Direct Intimidation',
    scenario_elevated: '⚠️ Court Fear',
    scenario_depressed: '🌧️ Social Isolation',
    scenario_neutral: '🌱 Calmer Today',

    // Support Hotlines
    hotlines_title: 'National Support Hotlines (24/7 Free)',

    // Chatbot Header & Welcome Message
    chat_title: 'SAMVEDNA AI Assistant',
    chat_llm_badge: 'Groq LPU Powered',
    chat_gemini_badge: 'Groq LPU Powered',
    chat_sub: 'Empathetic trauma-informed conversational companion',
    btn_reset: 'Reset',
    chat_welcome: 'Hello. I am SAMVEDNA AI Assistant. Through the National Helpline Against Atrocities (14566), we are available 24/7 for psychological care, physical protection, and rehabilitation. How are you feeling today?',
    chat_placeholder: 'Share your thoughts or concerns here...',
    btn_send: 'Send',
    btn_speech_to_text: 'Voice to Text',
    btn_listen_audio: 'Listen (TTS)',
    thinking_label: 'SAMVEDNA AI is thinking...'
  },

  bn: {
    speech_code: 'bn-IN',
    app_title: 'সংবেদনা এআই (SAMVEDNA)',
    app_subtitle: 'জাতীয় হেল্পলাইন (14566) • ২৪/৭ মানসিক স্বাস্থ্য ও নিরাপত্তা সহায়তা',
    nav_victim_checkin: 'ভিকটিম চেক-ইন',
    nav_official_dashboard: 'অফিসিয়াল ড্যাশবোর্ড',
    btn_emergency_sos: 'জরুরি এসওএস (SOS)',

    // Hero Greeting
    greet_title: 'আমাদের শেষ কথা বলার পর থেকে কেমন আছেন?',
    greet_sub: 'একটি সংক্ষিপ্ত বার্তা পাঠান বা ভয়েস চেক-ইন রেকর্ড করুন। আমরা আপনাকে প্রতিটি পদক্ষেপে সাহায্য করতে এখানে আছি।',

    // Voice Check-in Card
    voice_checkin_title: 'ভয়েস চেক-ইন',
    voice_checkin_sub: 'আপনার অনুভূতি শেয়ার করতে স্বাভাবিকভাবে কথা বলুন',
    status_ready: 'শোনার জন্য প্রস্তুত',
    btn_start_record: 'ভয়েস চেক-ইন শুরু করুন',
    btn_stop_record: 'রেকর্ডিং বন্ধ করুন',
    btn_upload_audio: 'অডিও ফাইল আপলোড',

    // Emotional State Card
    emotional_state_title: 'মানসিক অবস্থার মূল্যায়ন',
    label_confidence: 'নির্ভুলতা',
    label_stress: 'মানসিক চাপের স্তর',
    mood_help_text: 'আপনার মনের অবস্থা শেয়ার করুন। আপনার ভয়েস এবং বার্তা আমাদের বুঝতে সাহায্য করে।',
    disclaimer_text: 'ভয়েস ও টেক্সট সংকেতের ওপর ভিত্তি করে — এটি কোনো ক্লিনিকাল ডায়াগনোসিস নয়।',

    // Quick Situational Scenarios
    quick_scenarios_label: 'দ্রুত পরিস্থিতিগত দৃশ্যপট:',
    scenario_critical: '🚨 সরাসরি হুমকি ও ভয়',
    scenario_elevated: '⚠️ আদালতে সাক্ষ্যের ভয়',
    scenario_depressed: '🌧️ সামাজিক একাকীত্ব',
    scenario_neutral: '🌱 আজ কিছুটা শান্ত',

    // Support Hotlines
    hotlines_title: 'জাতীয় সহায়তা হেল্পলাইন (২৪/৭ ফ্রি)',

    // Chatbot Header & Welcome Message
    chat_title: 'সংবেদনা এআই সহকারী',
    chat_llm_badge: 'Groq LPU Powered',
    chat_gemini_badge: 'Groq LPU Powered',
    chat_sub: 'সহানুভূতিশীল ও নিরাপদ কথোপকথন সহকারী',
    btn_reset: 'রিসেট',
    chat_welcome: 'নমস্কার। আমি সংবেদনা এআই সহকারী। জাতীয় নির্যাতন প্রতিরোধ হেল্পলাইন (14566)-এর মাধ্যমে আমরা আপনার মানসিক স্বাস্থ্য, নিরাপত্তা ও পুনর্বাসনে পাশে আছি। আজ আপনি কেমন আছেন?',
    chat_placeholder: 'আপনার মনের কথা বা উদ্বেগ এখানে লিখুন...',
    btn_send: 'পাঠান',
    btn_speech_to_text: 'মুখে বলুন',
    btn_listen_audio: 'শুনুন (TTS)',
    thinking_label: 'সংবেদনা এআই চিন্তা করছে...'
  },

  ta: {
    speech_code: 'ta-IN',
    app_title: 'சம்வேத்னா AI (SAMVEDNA)',
    app_subtitle: 'தேசிய உதவி எண் (14566) • 24/7 மனநல மற்றும் பாதுகாப்பு ஆதரவு',
    nav_victim_checkin: 'பாதிக்கப்பட்டோர் பதிவு',
    nav_official_dashboard: 'அதிகாரப்பூர்வ பலகை',
    btn_emergency_sos: 'அவசர உதவி (SOS)',

    // Hero Greeting
    greet_title: 'நாம் கடைசியாகப் பேசியதிலிருந்து எப்படி இருக்கிறீர்கள்?',
    greet_sub: 'ஒரு குறுஞ்செய்தியைப் பகிரவும் அல்லது குரல் பதிவைச் செய்யவும். உங்களுக்கு ஒவ்வொரு நிலையிலும் உதவ நாங்கள் தயாராக உள்ளோம்.',

    // Voice Check-in Card
    voice_checkin_title: 'குரல் பதிவு',
    voice_checkin_sub: 'உங்கள் உணர்வுகளைப் பகிர இயல்பாகப் பேசுங்கள்',
    status_ready: 'கேட்க தயார்',
    btn_start_record: 'குரல் பதிவைத் தொடங்கவும்',
    btn_stop_record: 'பதிவை நிறுத்தவும்',
    btn_upload_audio: 'ஆடியோ பதிவேற்றவும்',

    // Emotional State Card
    emotional_state_title: 'மனநிலை மதிப்பீடு',
    label_confidence: 'துல்லியம்',
    label_stress: 'மன அழுத்த நிலை',
    mood_help_text: 'உங்கள் நிலையைப் பகிரவும். உங்கள் குரல் மற்றும் செய்தி உங்கள் நிலையைப் புரிந்துகொள்ள உதவுகிறது.',
    disclaimer_text: 'குரல் மற்றும் உரையாடல் அடிப்படையிலானது — மருத்துவக் கணிப்பு அல்ல.',

    // Quick Situational Scenarios
    quick_scenarios_label: 'விரைவு சூழல் தேர்வுகள்:',
    scenario_critical: '🚨 நேரடி மிரட்டல்',
    scenario_elevated: '⚠️ நீதிமன்ற பயம்',
    scenario_depressed: '🌧️ சமூக புறக்கணிப்பு',
    scenario_neutral: '🌱 இன்று அமைதியாக உள்ளது',

    // Support Hotlines
    hotlines_title: 'தேசிய உதவி எண்கள் (24/7 இலவசம்)',

    // Chatbot Header & Welcome Message
    chat_title: 'சம்வேத்னா AI உதவியாளர்',
    chat_llm_badge: 'Groq LPU Powered',
    chat_gemini_badge: 'Groq LPU Powered',
    chat_sub: 'பாதுகாப்பான மற்றும் ஆறுதலான உரையாடல் துணை',
    btn_reset: 'மீட்டமை',
    chat_welcome: 'வணக்கம். நான் சம்வேத்னா AI உதவியாளர். தேசிய வன்கொடுமை தடுப்பு உதவி எண் (14566) மூலம் உங்களுக்கு மனநல ஆதரவு மற்றும் பாதுகாப்பு அளிக்க எப்போதும் தயாராக உள்ளோம். இன்று நீங்கள் எவ்வாறு உணர்கிறீர்கள்?',
    chat_placeholder: 'உங்கள் நிலையை இங்கே எழுதவும்...',
    btn_send: 'அனுப்பு',
    btn_speech_to_text: 'பேசி எழுதுக',
    btn_listen_audio: 'கேட்க (TTS)',
    thinking_label: 'சம்வேத்னா AI யோசிக்கிறது...'
  },

  te: {
    speech_code: 'te-IN',
    app_title: 'సంవేద్న AI (SAMVEDNA)',
    app_subtitle: 'జాతీయ హెల్ప్‌లైన్ (14566) • 24/7 మానసిక ఆరోగ్య రక్షణ వ్యవస్థ',
    nav_victim_checkin: 'బాధితుల చెక్-ఇన్',
    nav_official_dashboard: 'అధికారిక డాష్‌బోర్డ్',
    btn_emergency_sos: 'అత్యవసర SOS',

    // Hero Greeting
    greet_title: 'మనం చివరగా మాట్లాడినప్పటి నుండి పరిస్థితి ఎలా ఉంది?',
    greet_sub: 'చిన్న సందేశాన్ని పంపండి లేదా వాయిస్ చెక్-ఇన్ రికార్డ్ చేయండి. ప్రతి దశలో మీకు సహాయం చేయడానికి మేము సిద్ధంగా ఉన్నాము.',

    // Voice Check-in Card
    voice_checkin_title: 'వాయిస్ చెక్-ఇన్',
    voice_checkin_sub: 'మీ భావాలను పంచుకోవడానికి సహజంగా మాట్లాడండి',
    status_ready: 'వినడానికి సిద్ధంగా ఉంది',
    btn_start_record: 'వాయిస్ రికార్డ్ ప్రారంభించండి',
    btn_stop_record: 'రికార్డింగ్ ఆపండి',
    btn_upload_audio: 'ఆడియో అప్‌లోడ్',

    // Emotional State Card
    emotional_state_title: 'మానసిక స్థితి అంచనా',
    label_confidence: 'ఖచ్చితత్వం',
    label_stress: 'ఒత్తిడి స్థాయి',
    mood_help_text: 'మీ పరిస్థితిని పంచుకోండి. మీ వాయిస్ మరియు సందేశం మీ భావోద్వేగాలను అర్థం చేసుకోవడానికి సహాయపడతాయి.',
    disclaimer_text: 'వాయిస్ మరియు సంభాషణ సంకేతాల ఆధారంగా — ఇది క్లినికల్ రోగ నిర్ధారణ కాదు.',

    // Quick Situational Scenarios
    quick_scenarios_label: 'త్వరిత పరిస్థితుల దృశ్యాలు:',
    scenario_critical: '🚨 ప్రత్యక్ష బెదిరింపు & భయం',
    scenario_elevated: '⚠️ కోర్టు సాక్ష్యం భయం',
    scenario_depressed: '🌧️ సామాజిక బహిష్కరణ',
    scenario_neutral: '🌱 ఈ రోజు ప్రశాంతంగా ఉంది',

    // Support Hotlines
    hotlines_title: 'జాతీయ సహాయ హెల్ప్‌లైన్లు (24/7 ఉచితం)',

    // Chatbot Header & Welcome Message
    chat_title: 'సంవేద్న AI సహాయకుడు',
    chat_llm_badge: 'Groq LPU Powered',
    chat_gemini_badge: 'Groq LPU Powered',
    chat_sub: 'సానుభూతితో కూడిన సురక్షిత సంభాషణ సహచరుడు',
    btn_reset: 'రీసెట్',
    chat_welcome: 'నమస్కారం. నేను సంవేద్న AI సహాయకుడిని. జాతీయ అత్యాచారాల నిరోధక హెల్ప్‌లైన్ (14566) ద్వారా మీ మానసిక ఆరోగ్యం, భద్రత మరియు పునరావాసానికి మేము సిద్ధంగా ఉన్నాము. ఈ రోజు మీరు ఎలా ఉన్నారు?',
    chat_placeholder: 'మీ ఆలోచనలను లేదా ఆందోళనలను ఇక్కడ రాయండి...',
    btn_send: 'పంపండి',
    btn_speech_to_text: 'వాయిస్ టైపింగ్',
    btn_listen_audio: 'వినండి (TTS)',
    thinking_label: 'సంవేద్న AI ఆలోచిస్తోంది...'
  }
};
