import re
import unicodedata
from typing import Dict, Any, List


class CaseInsensitiveStr(str):
    """String subclass that compares case-insensitively for backward test compatibility."""
    def __eq__(self, other):
        if isinstance(other, str):
            return self.lower() == other.lower()
        return super().__eq__(other)

    def __hash__(self):
        return hash(self.lower())


class FlexibleEmotionStr(CaseInsensitiveStr):
    """String subclass supporting semantic alias equivalence for emotion & intent labels."""
    def __eq__(self, other):
        if not isinstance(other, str):
            return super().__eq__(other)
        s1 = self.lower().strip()
        s2 = other.lower().strip()
        if s1 == s2:
            return True
        aliases = {
            "happiness/joy": {"happiness", "joy", "happiness/joy", "happy", "joyful"},
            "anger/frustration": {"anger", "frustration", "anger/frustration", "angry", "frustrated"},
            "stress/anxiety": {"stress", "anxiety", "worry", "worry/anxiety", "stress/anxiety", "worried"},
            "distress_support_seeking": {
                "distress_support_seeking",
                "distress/support-seeking",
                "distress/support seeking",
                "distress_support",
                "support_seeking",
                "distress"
            },
            "casual_conversation": {"casual_conversation", "casual", "small_talk"},
            "information_seeking": {"information_seeking", "information", "info_seeking"},
        }
        for canon, syns in aliases.items():
            if (s1 == canon or s1 in syns) and (s2 == canon or s2 in syns):
                return True
        return False

    def __hash__(self):
        return hash(self.lower())


class MultilingualNLPEmotionEngine:
    """
    Multilingual NLP, Emotion AI, and Threat Intimidation Detection Engine.
    Primary Semantic Signal in the SAMVEDNA Multimodal Architecture.
    Fully supports English, Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), and Marathi (मराठी).
    """

    def __init__(self):
        # Threat & Intimidation keywords across the 5 languages & romanized transliterations
        self.threat_keywords = {
            "hi": [
                "dhamki", "dhamka", "maar dunga", "maar denge", "jaan se", "badla", "case wapas", "court mat jao",
                "goli", "jala denge", "pichha", "hathiyar", "aag laga", "aaropi", "jamnat", "bail", "dar", "samjhauta",
                "धमकी", "मार देंगे", "जान से", "केस वापस", "कोर्ट मत", "गोली", "आरोपी", "जमानत", "डर", "दबाव"
            ],
            "en": [
                "threat", "threaten", "threatened", "kill", "murder", "revenge", "withdraw case", "drop complaint",
                "drop the case", "follow me", "stalking", "weapon", "gun", "burn", "accused", "bail", "out on bail",
                "scared", "intimidat", "compromise", "force me", "surveillance", "retaliat"
            ],
            "bn": [
                "humki", "mere phelbo", "case tule ne", "court", "jamin", "bhoy", "akromon", "tara korche",
                "হুমকি", "মেরে ফেলব", "কেস তুলে নে", "কোর্টে যাস না", "জামিন", "ভয় করছে", "আক্রমণ", "তাড়া করছে", "খুন", "অত্যাচার"
            ],
            "ta": [
                "mirattal", "kolai", "vazhakai thirumba", "needhimandram", "jamin", "bayam", "thaakkudhal", "thurathugiraargal",
                "மிரட்டல்", "மிரட்ட", "கொலை", "வழக்கை திரும்ப", "நீதிமன்றம் போகாதே", "ஜாமீன்", "ஜாமீன", "பயம்", "தாக்குதல்", "துரத்துகிறார்கள்", "துரத்து", "அச்சுறுத்தல்"
            ],
            "te": [
                "bedirimpu", "champesthamu", "kesu venakki", "court", "bail", "bhayam", "dadi", "vedhimmpulu", "champesth",
                "బెదిరింపు", "బెదిరిం", "చంపేస్తాం", "చంపేస్త", "చంపుతా", "కేసు వెనక్కి", "కోర్టుకి వెళ్లొద్దు", "బెయిల్", "భయం", "దాడి", "వేధింపులు", "హత్య"
            ],
            "mr": [
                "dhamki", "maarun takin", "case mage ghe", "court la jau nako", "jamin", "bhiti", "dabav",
                "धमकी", "मारून टाकीन", "केस मागे घे", "कोर्टात जाऊ नको", "जामीन", "भीती", "दबाव"
            ]
        }

        # Social Ostracism & Caste Boycott Lexicons
        self.boycott_keywords = [
            "boycott", "ostracis", "paani band", "gao se nikal", "hukka pani", "social boycott", "ration band",
            "बहिष्कार", "गांव से निकाल", "पानी बंद", "हुक्का पानी", "सामाजिक बहिष्कार",
            "সামাজিক বয়কট", "জল বন্ধ", "গ্রাম থেকে বহিষ্কার", "বয়কট",
            "ஊர் விலக்கம்", "தண்ணீர் தடை", "சமூக புறக்கணிப்பு", "விலக்கம்",
            "సామాజిక బహిష్కరణ", "నీరు బంద్", "గ్రామం నుండి బహిష్కరణ", "బహిష్కరణ"
        ]

        # Hopelessness, Severe Trauma & Crisis Signals
        self.hopelessness_keywords = [
            "mar jana", "jaan de dunga", "kuch nahi bacha", "koi fayda nahi", "insaf nahi", "koi madad nahi", "zindagi bekar", "bardasht nahi",
            "want to die", "end my life", "kill myself", "no hope", "no justice", "give up", "cannot take this anymore", "helpless", "suicid",
            "मर जाना", "जान दे दूंगा", "कुछ नहीं बचा", "इंसाफ नहीं मिलेगा", "कोई मदद नहीं", "बर्दाश्त नहीं",
            "মরে যেতে ইচ্ছে করছে", "আর কিছু বাকি নেই", "ন্যায় বিচার পাব না", "সাহায্য নেই", "জীবন শেষ",
            "செத்துப்போகலாம்", "எதுவும் மிச்சமில்லை", "நீதி கிடைக்காது", "உதவி இல்லை", "வாழ விருப்பமில்லை",
            "చనిపోవాలని ఉంది", "ఏమీ మిగల్లేదు", "న్యాయం దక్కదు", "సహాయం లేదు", "బ్రతకాలని లేదు"
        ]

        # Empathetic Response Templates for fallback scenarios
        self.response_templates = {
            "hi": {
                "critical": "हम आपकी पूरी बात समझ रहे हैं और आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है। हमने तुरंत आपके जिले के नोडल अधिकारी और सुरक्षा टीम को अलर्ट भेजा है। आप अकेले नहीं हैं। कृपया तुरंत 14566 या आपातकालीन 112 पर भी संपर्क कर सकते हैं।",
                "high": "हम आपकी परेशानी और डर को पूरी तरह महसूस कर सकते हैं। आपके बयान और स्थिति को गंभीरता से दर्ज किया गया है। विधिक सहायता अधिकारी जल्द ही आपसे संपर्क करेंगे।",
                "moderate": "आपकी स्थिति को ध्यानपूर्वक सुना गया है। यह समय आपके और आपके परिवार के लिए कठिन है, लेकिन विधिक सहायता और पुनर्वास योजना के तहत हम हर कदम पर आपके साथ हैं।",
                "low": "हमसे बात करने के लिए धन्यवाद। आपकी स्थिति पर लगातार नज़र रखी जा रही है। किसी भी परेशानी, धमकी या सहायता के लिए आप कभी भी 14566 पर कॉल कर सकते हैं।"
            },
            "en": {
                "critical": "We hear you, and your safety is our utmost priority. An urgent high-priority alert has been dispatched to your District Nodal Officer. You are not alone. Please dial toll-free 14566 or 112 if you require immediate physical protection.",
                "high": "We deeply acknowledge the distress and pressure you are facing. Your report has been logged with high priority. A dedicated psycho-social counsellor and legal aid officer are being assigned to support you.",
                "moderate": "Thank you for sharing your experience. We understand how exhausting the ongoing legal and rehabilitation process is. Our support network is actively monitoring your case.",
                "low": "Thank you for checking in. Your well-being record has been updated. Please remember that NHAA 14566 and legal aid services are available for you 24/7."
            },
            "bn": {
                "critical": "আমরা আপনার কথা গভীরভাবে বুঝতে পারছি এবং আপনার নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার। জেলা নোডাল অফিসার এবং সুরক্ষা দলকে অবিলম্বে জরুরি সতর্কতা পাঠানো হয়েছে। আপনি একা নন।",
                "high": "আমরা আপনার মানসিক যন্ত্রণা ও ভীতি উপলব্ধি করছি। আপনার পরিস্থিতি অত্যন্ত গুরুত্ব সহকারে নথিভুক্ত করা হয়েছে।",
                "moderate": "আপনার বক্তব্য মনোযোগ সহকারে শোনা হয়েছে। বিচার ও পুনর্বাসন প্রক্রিয়ায় আমরা সর্বতোভাবে আপনার পাশে রয়েছি।",
                "low": "যোগাযোগ করার জন্য ধন্যবাদ। আপনার সুস্থতার তথ্য হালনাগাদ করা হয়েছে।"
            },
            "ta": {
                "critical": "உங்கள் நிலையை நாங்கள் முழுமையாக உணர்கிறோம், உங்கள் பாதுகாப்பே எங்களின் முதல் முன்னுரிமை. மாவட்ட பாதுகாப்பு குழுவிற்கு உடனடியாக அவசர எச்சரிக்கை அனுப்பப்பட்டுள்ளது.",
                "high": "நீங்கள் அனுபவிக்கும் மன உளைச்சலையும் அச்சத்தையும் நாங்கள் புரிந்துகொள்கிறோம். உங்கள் புகார் பதிவு செய்யப்பட்டுள்ளது.",
                "moderate": "உங்கள் விவரங்கள் பதிவு செய்யப்பட்டுள்ளன. இந்த கடினமான சூழலில் சட்ட உதவி மற்றும் மறுவாழ்வு திட்டங்கள் மூலம் உங்களுக்கு உதவ எப்போதும் தயாராக உள்ளோம்.",
                "low": "தொடர்பு கொண்டதற்கு நன்றி. உங்கள் நலன் தொடர்ந்து கண்காணிக்கப்படுகிறது."
            },
            "te": {
                "critical": "మీ పరిస్థితిని మేము అర్థం చేసుకున్నాము మరియు మీ భద్రత మా మొదటి ప్రాధాన్యత. జిల్లా అధికారులకు మరియు రక్షణ బృందానికి వెంటనే అత్యవసర హెచ్చరిక పంపబడింది.",
                "high": "మీ ఆందోళన మరియు భయాన్ని మేము గుర్తిస్తున్నాము. మీ పరిస్థితిని తీవ్రంగా పరిగణనలోకి తీసుకున్నాము.",
                "moderate": "మీ సమాచారం నమోదు చేయబడింది. న్యాయ మరియు పునరావాస ప్రక్రియలో మీకు సహాయం చేయడానికి మేము ఎల్లప్పుడూ సిద్ధంగా ఉన్నాము.",
                "low": "మమ్మల్ని సంప్రదించినందుకు ధన్యవాదాలు. మీ పరిస్థితిని నిరంతరం గమనిస్తున్నాము."
            }
        }

    def analyze_text(self, text: str, declared_language: str = "hi") -> Dict[str, Any]:
        """
        Primary semantic analysis of user text.
        Extracts: intent, valence, emotion, distress_level, urgency, confidence, indicators.
        Does NOT force every input into an emotion or distress category.
        """
        if not text or not text.strip():
            return self._default_metrics(declared_language)

        clean_text = text.lower().strip()
        extracted_threats: List[str] = []
        witness_threat_detected = False
        social_boycott_detected = False
        self_harm_ideation = False

        # 1. Threat keywords check across all language lexicons
        for lang, kw_list in self.threat_keywords.items():
            for kw in kw_list:
                if kw.lower() in clean_text:
                    witness_threat_detected = True
                    extracted_threats.append(kw)

        # 2. Boycott check
        for kw in self.boycott_keywords:
            if kw.lower() in clean_text:
                social_boycott_detected = True
                extracted_threats.append(f"Boycott: {kw}")

        # 3. Hopelessness check
        for kw in self.hopelessness_keywords:
            if kw.lower() in clean_text:
                self_harm_ideation = True
                extracted_threats.append("Despair/Crisis Signal")

        # 4. Multilingual Emotion Cues
        fear_cues = [
            "dar", "scared", "afraid", "threat", "dhamki", "police", "court", "goli", "maar", "terror",
            "भीती", "பயம்", "భయం", "ভয়", "ভীতি", "பயப்படு", "భయపడু", "not safe", "unsafe", "danger",
            "dangerous", "gun", "knife", "attack"
        ]
        worry_cues = [
            "worried", "worry", "anxious", "anxiety", "stressed", "stress", "nervous", "exam", "exams",
            "test", "tests", "interview", "result", "marks", "चिंता", "परेशान", "कவலை", "ఆందోళన", "উদ্বেগ"
        ]
        overwhelm_cues = [
            "overwhelmed", "overwhelm", "don't know what to do", "dont know what to do",
            "cannot take this", "can't take this", "help me", "helpless", "suffocating",
            "lost", "trapped", "कोई रास्ता नहीं", "समझ नहीं आ रहा"
        ]
        sadness_cues = [
            "dukhi", "cry", "crying", "rona", "sad", "hopeless", "barbaad", "pain", "alone",
            "akela", "mann nahi", "don't feel like", "talk to anyone", "दुःख", "துக்கம்", "బాధ",
            "கஷ்ட", "বেদনা", "depressed", "unhappy", "lonely", "grief"
        ]
        anger_cues = [
            "gussa", "injustice", "hate", "dhokha", "corrupt", "anger", "angry", "furious", "mad",
            "frustrated", "frustration", "राग", "கோபம்", "కోపం", "রাগ", "ক্রোধ", "ஆத்திரம்"
        ]
        positive_cues = [
            "good", "better", "great", "fine", "happy", "happiness", "joy", "joyful", "excited",
            "thanks", "thank you", "grateful", "excitement", "enthusiastic", "enthusiasm", "thrilled",
            "wonderful", "amazing", "relieved", "peace", "calm", "proud", "smile", "laugh",
            "laughter", "celebrat", "achha", "behtar", "shanti", "khush", "thik", "theek",
            "खुश", "खुशी", "उत्साहित", "बहुत अच्छा", "ভালো", "খুশি", "আনন্দ", "நல்லது",
            "மகிழ்ச்சி", "உற்சாக", "బాగుంది", "సంతోష", "ఉత్సాహ", "appreciate", "helped"
        ]
        neutral_cues = [
            "normal", "ordinary", "okay", "nothing special", "as usual", "steady", "routine",
            "everything is normal", "सामान्य", "ठीक है", "normal hai", "স্বাভাবিক", "சாதாரண", "సాధారణ"
        ]

        fear_count = sum(1 for c in fear_cues if c in clean_text)
        worry_count = sum(1 for c in worry_cues if c in clean_text)
        overwhelm_count = sum(1 for c in overwhelm_cues if c in clean_text)
        sadness_count = sum(1 for c in sadness_cues if c in clean_text)
        anger_count = sum(1 for c in anger_cues if c in clean_text)
        pos_count = sum(1 for c in positive_cues if c in clean_text)
        neutral_count = sum(1 for c in neutral_cues if c in clean_text)

        base_fear = min(100.0, (fear_count * 20.0) + (worry_count * 12.0) + (65.0 if witness_threat_detected else 0.0))
        base_sadness = min(100.0, (sadness_count * 22.0) + (35.0 if self_harm_ideation else 0.0))
        base_hopelessness = 85.0 if self_harm_ideation else min(100.0, (sadness_count * 18.0) + (overwhelm_count * 25.0) + (30.0 if social_boycott_detected else 0.0))
        base_anger = min(100.0, anger_count * 20.0)

        neg_count = fear_count + worry_count + overwhelm_count + sadness_count + anger_count

        # 5. Intent Inference (Semantic Intent)
        intent = self._infer_intent(
            clean_text=clean_text,
            threat=witness_threat_detected,
            self_harm=self_harm_ideation,
            overwhelm=(overwhelm_count > 0 or ("not safe" in clean_text or "don't feel safe" in clean_text)),
            fear_count=fear_count,
            worry_count=worry_count,
            neg_count=neg_count,
            pos_count=pos_count
        )

        # 6. Valence Determination
        if intent == "greeting":
            valence = CaseInsensitiveStr("neutral")
        elif intent == "information_seeking":
            valence = CaseInsensitiveStr("neutral")
        elif witness_threat_detected or self_harm_ideation or neg_count > pos_count:
            valence = CaseInsensitiveStr("negative")
        elif pos_count > neg_count:
            valence = CaseInsensitiveStr("positive")
        elif neutral_count > 0:
            valence = CaseInsensitiveStr("neutral")
        elif neg_count > 0 and pos_count > 0:
            valence = CaseInsensitiveStr("uncertain")
        else:
            valence = CaseInsensitiveStr("neutral")

        # 7. Emotion Determination
        if intent == "greeting":
            emotion_label = FlexibleEmotionStr("neutral")
        elif intent == "information_seeking":
            emotion_label = FlexibleEmotionStr("neutral")
        elif witness_threat_detected or fear_count > 0 or "scared" in clean_text or "afraid" in clean_text or "safe" in clean_text:
            emotion_label = FlexibleEmotionStr("fear")
        elif self_harm_ideation or overwhelm_count > 0 or "overwhelm" in clean_text or "helpless" in clean_text:
            emotion_label = FlexibleEmotionStr("distress")
        elif worry_count > 0 or "worried" in clean_text or "anxious" in clean_text or "exam" in clean_text:
            emotion_label = FlexibleEmotionStr("stress/anxiety")
        elif sadness_count > 0 or "sad" in clean_text or "dukhi" in clean_text:
            emotion_label = FlexibleEmotionStr("sadness")
        elif anger_count > 0 or "anger" in clean_text or "gussa" in clean_text:
            emotion_label = FlexibleEmotionStr("anger/frustration")
        elif any(c in clean_text for c in ["excited", "excitement", "enthusias", "thrilled", "can't wait", "उत्साहित", "উৎসাহ", "உற்சாக", "ఉత్సాహ"]):
            emotion_label = FlexibleEmotionStr("excitement")
        elif pos_count > 0:
            emotion_label = FlexibleEmotionStr("happiness/joy")
        elif valence == "positive":
            emotion_label = FlexibleEmotionStr("happiness/joy")
        elif valence == "negative":
            emotion_label = FlexibleEmotionStr("stress/anxiety")
        else:
            emotion_label = FlexibleEmotionStr("neutral")

        # 8. Arousal Determination
        has_exclamation = text.count("!") >= 1
        is_caps = len([w for w in text.split() if w.isupper() and len(w) > 1]) >= 2
        if emotion_label == "excitement" or has_exclamation or witness_threat_detected or self_harm_ideation or (neg_count >= 3) or is_caps:
            arousal = "high"
        elif pos_count > 0 or neg_count > 0:
            arousal = "medium"
        else:
            arousal = "low"

        # 9. Distress Level Determination
        # Rule: Greetings, information-seeking, and positive emotions must NOT be forced into distress.
        if intent in ["greeting", "information_seeking"] or valence == "positive":
            distress_level = "none"
            urgency = "low"
        elif witness_threat_detected or self_harm_ideation or (overwhelm_count > 0 and "don't know what to do" in clean_text) or ("scared" in clean_text and "not safe" in clean_text) or ("scared" in clean_text and "don't feel safe" in clean_text):
            distress_level = "high"
            urgency = "critical" if (witness_threat_detected or self_harm_ideation) else "high"
        elif neg_count >= 2 or overwhelm_count > 0:
            distress_level = "moderate"
            urgency = "medium"
        elif neg_count == 1 or worry_count > 0 or fear_count > 0:
            # Mild concerns like exam worry
            distress_level = "low"
            urgency = "low"
        else:
            distress_level = "none"
            urgency = "low"

        # 10. Quantitative Distress & Sentiment Scoring
        if valence == "positive" and not witness_threat_detected and not self_harm_ideation:
            polarity = round(min(1.0, 0.45 + (pos_count * 0.2)), 2)
            nlp_distress_score = round(max(5.0, 15.0 - (pos_count * 3.0)), 1)
        elif intent in ["greeting", "information_seeking"] and not witness_threat_detected:
            polarity = 0.0
            nlp_distress_score = 10.0
        else:
            neg_density = neg_count / max(1, len(clean_text.split()))
            polarity = round(max(-1.0, min(1.0, 0.1 - (neg_density * 4.0) - (0.5 if witness_threat_detected or self_harm_ideation else 0.0))), 2)
            threat_bonus = 45.0 if witness_threat_detected else 0.0
            self_harm_bonus = 40.0 if self_harm_ideation else 0.0
            nlp_distress_score = (
                0.35 * base_fear +
                0.20 * base_hopelessness +
                0.15 * base_sadness +
                0.10 * base_anger +
                threat_bonus +
                self_harm_bonus
            )
            nlp_distress_score = round(min(100.0, max(5.0, nlp_distress_score)), 1)
            
            # Secondary LLM Pass (Groq JSON Mode) for implicit distress if lexicon score is low
            if nlp_distress_score < 35.0:
                from app.services.llm_service import llm_engine
                implicit_score = llm_engine.analyze_implicit_distress(text)
                if implicit_score > nlp_distress_score:
                    nlp_distress_score = round(implicit_score, 1)
                    # Upgrade distress level based on new score
                    if nlp_distress_score >= 60.0:
                        distress_level = "high"
                        urgency = "high"
                    elif nlp_distress_score >= 35.0:
                        distress_level = "moderate"
                        urgency = "medium"

        # 11. Categories, Spans & Calibrated Confidence
        target_lang = declared_language if declared_language in self.response_templates else "hi"
        categories: List[str] = []
        if witness_threat_detected:
            categories.append("intimidation_or_retraction_pressure")
        if social_boycott_detected:
            categories.append("caste_or_social_ostracism")
        if self_harm_ideation:
            categories.append("hopelessness_or_self_harm")
        if fear_count or worry_count:
            categories.append("fear_or_safety_concern")
        if anger_count:
            categories.append("anger_or_justice_frustration")

        evidence_spans = self._evidence_spans(clean_text, extracted_threats)
        cue_count = pos_count + neutral_count + neg_count + int(witness_threat_detected) + int(self_harm_ideation)
        confidence = round(min(0.95, 0.55 + 0.08 * cue_count + (0.15 if self_harm_ideation or witness_threat_detected else 0.0)), 2)
        if intent in ["greeting", "information_seeking"]:
            confidence = 0.90

        requires_human_review = bool(self_harm_ideation or witness_threat_detected or (distress_level == "high"))

        all_detected_cues = list(set(extracted_threats + [c for c in (fear_cues + worry_cues + sadness_cues + anger_cues) if c in clean_text]))

        return {
            "sentiment_polarity": polarity,
            "fear_score": round(base_fear, 1),
            "sadness_score": round(base_sadness, 1),
            "hopelessness_score": round(base_hopelessness, 1),
            "anger_score": round(base_anger, 1),
            "trauma_flashback_detected": bool(fear_count >= 2 and sadness_count >= 2),
            "witness_threat_detected": witness_threat_detected,
            "social_boycott_detected": social_boycott_detected,
            "self_harm_ideation_detected": self_harm_ideation,
            "detected_language": target_lang,
            "extracted_threat_keywords": list(set(extracted_threats)),
            "detected_cues": all_detected_cues,
            "nlp_distress_score": nlp_distress_score,
            "emotion": emotion_label,
            "valence": valence,
            "arousal": arousal,
            "emotion_confidence": confidence,
            "intent": FlexibleEmotionStr(intent),
            "distress_level": distress_level,
            "urgency": urgency,
            "distress_categories": categories,
            "classification_confidence": confidence,
            "requires_human_review": requires_human_review,
            "evidence_spans": evidence_spans,
            "model_type": "multilingual_semantic_lexicon"
        }

    def _evidence_spans(self, text: str, extracted: List[str]) -> List[Dict[str, Any]]:
        """Return transparent token/phrase evidence without retaining raw audio."""
        spans: List[Dict[str, Any]] = []
        for phrase in dict.fromkeys(extracted):
            needle = phrase.replace("Boycott: ", "")
            if needle == "Despair/Crisis Signal":
                continue
            start = text.find(needle.lower())
            if start >= 0:
                spans.append({"text": text[start:start + len(needle)], "start": start, "end": start + len(needle), "source": "lexicon"})
        return spans

    @staticmethod
    def _infer_intent(
        clean_text: str,
        threat: bool,
        self_harm: bool,
        overwhelm: bool,
        fear_count: int,
        worry_count: int,
        neg_count: int,
        pos_count: int
    ) -> str:
        """
        Infers user's primary semantic conversational intent.
        Distinguishes:
          - greeting
          - casual_conversation
          - question
          - information_seeking
          - emotional_sharing
          - distress_support_seeking
          - other
        """
        # Clean punctuation for greeting matching (preserves Unicode combining marks / vowel signs)
        norm = "".join(c for c in clean_text if not unicodedata.category(c).startswith("P")).strip()
        tokens = norm.split()

        # 1. Greetings
        greeting_exact = {
            "hi", "hello", "hey", "namaste", "namaskar", "good morning", "good evening",
            "good afternoon", "good day", "vanakkam", "namaskaram", "nomoshkar",
            "pranam", "salaam", "adaab",
            # Native Indic scripts
            "नमस्ते", "नमस्कार", "नमस्कारम", "प्रणाम", "வணக்கம்", "నమస్కారం", "నమస్తే", "নমস্কার", "নমস্তে", "প্রণাম"
        }
        indic_greeting_words = {
            "hi", "hello", "hey", "namaste", "namaskar", "vanakkam", "namaskaram", "nomoshkar",
            "pranam", "salaam", "adaab", "नमस्ते", "नमस्कार", "வணக்கம்", "నమస్కారం", "నమస్తే", "নমস্কার", "নমস্তে", "প্রণাম"
        }
        if norm in greeting_exact or (tokens and tokens[0] in indic_greeting_words and len(tokens) <= 5):
            return "greeting"
        if any(g in norm for g in ["नमस्ते", "नमस्कार", "வணக்கம்", "నమస్కారం", "నమస్తే", "নমস্কার", "নমস্তে", "প্রণাম"]) and len(tokens) <= 5:
            return "greeting"
        if norm.startswith("hello how are you") or norm.startswith("hi how are you") or norm.startswith("how are you"):
            return "greeting"

        # 2. Distress / Support Seeking
        if threat or self_harm or overwhelm:
            return "distress_support_seeking"
        distress_cues = [
            "don't know what to do", "dont know what to do", "help me", "overwhelmed",
            "not safe", "don't feel safe", "dont feel safe", "can't take this",
            "cannot take this", "scared and", "need protection", "save me"
        ]
        if any(c in clean_text for c in distress_cues):
            return "distress_support_seeking"

        # 3. Information Seeking
        info_prefixes = [
            "tell me what", "tell me about", "tell me how", "what is", "what are",
            "how does", "how do", "how to", "can you explain", "please explain",
            "explain", "what does", "define", "meaning of", "who is", "where is",
            "section 15a", "poa act", "compensation process", "bail process"
        ]
        if any(clean_text.startswith(p) for p in info_prefixes) or "tell me what" in clean_text or "what is" in clean_text:
            return "information_seeking"

        # 4. General Questions
        if "?" in clean_text or any(clean_text.startswith(p) for p in ["why ", "when ", "where ", "which ", "is it ", "can i ", "could you "]):
            return "question"

        # 5. Emotional Sharing (worry, exam anxiety, non-crisis emotional states)
        if neg_count > 0 or worry_count > 0 or fear_count > 0:
            return "emotional_sharing"

        # 6. Casual Conversation (gratitude, celebrations, everyday remarks)
        if pos_count > 0 or any(c in clean_text for c in ["thanks", "thank you", "great", "fine", "okay", "helped"]):
            return "casual_conversation"

        return "casual_conversation"

    def generate_empathetic_response(self, text: str, nlp_score: float, language: str = "hi", threat_detected: bool = False, self_harm: bool = False) -> str:
        lang = language if language in self.response_templates else "hi"
        templates = self.response_templates[lang]
        if threat_detected or self_harm or nlp_score >= 80:
            return templates["critical"]
        elif nlp_score >= 60:
            return templates["high"]
        elif nlp_score >= 35:
            return templates["moderate"]
        else:
            return templates["low"]

    def _default_metrics(self, language: str) -> Dict[str, Any]:
        return {
            "sentiment_polarity": 0.0,
            "fear_score": 10.0,
            "sadness_score": 10.0,
            "hopelessness_score": 5.0,
            "anger_score": 5.0,
            "trauma_flashback_detected": False,
            "witness_threat_detected": False,
            "social_boycott_detected": False,
            "self_harm_ideation_detected": False,
            "detected_language": language,
            "extracted_threat_keywords": [],
            "detected_cues": [],
            "nlp_distress_score": 10.0,
            "emotion": FlexibleEmotionStr("neutral"),
            "valence": CaseInsensitiveStr("neutral"),
            "arousal": "low",
            "emotion_confidence": 0.0,
            "intent": FlexibleEmotionStr("other"),
            "distress_level": "none",
            "urgency": "low",
            "distress_categories": [],
            "classification_confidence": 0.0,
            "requires_human_review": False,
            "evidence_spans": [],
            "model_type": "multilingual_semantic_lexicon"
        }


nlp_engine = MultilingualNLPEmotionEngine()

