from typing import Dict, Any, List, Optional


class MoodEstimator:
    """
    Multimodal Emotional State & Mood Estimation Layer.
    Synthesizes:
      1. Text NLP signals (Fear, sadness, hopelessness, threat cues, sentiment polarity)
      2. Acoustic prosodic biomarkers (Pitch volatility, jitter, vocal tremor, pause ratio, energy)
      3. Conversational context & recent momentum
    Produces calibrated, non-diagnostic emotional estimations with signal concordance evaluation.
    """

    VALID_MOODS = [
        "Calm",
        "Neutral",
        "Sad",
        "Anxious",
        "Fearful",
        "Angry",
        "Distressed",
        "Overwhelmed",
        "Positive/Relieved",
        "Uncertain/Mixed"
    ]

    def estimate_mood(
        self,
        text_content: str,
        nlp_metrics: Dict[str, Any],
        voice_metrics: Dict[str, Any],
        recent_history: Optional[List[Dict[str, Any]]] = None,
        language: str = "hi"
    ) -> Dict[str, Any]:
        """
        Calculates a structured emotional state combining text and acoustic evidence.
        """
        text_lower = (text_content or "").lower().strip()

        # 1. Text Evidence Extraction
        fear_score = float(nlp_metrics.get("fear_score", 0.0))
        sadness_score = float(nlp_metrics.get("sadness_score", 0.0))
        hopelessness_score = float(nlp_metrics.get("hopelessness_score", 0.0))
        threat_detected = bool(nlp_metrics.get("witness_threat_detected", False))
        self_harm_detected = bool(nlp_metrics.get("self_harm_ideation_detected", False))
        sentiment_polarity = float(nlp_metrics.get("sentiment_polarity", 0.0))
        text_valence = str(nlp_metrics.get("valence", "NEUTRAL"))
        text_emotion = str(nlp_metrics.get("emotion", "neutral"))

        text_indicators: List[str] = []
        if threat_detected:
            text_indicators.append("reported direct threat or intimidation cues")
        if fear_score >= 60.0:
            text_indicators.append("expressed apprehension or fear")
        if sadness_score >= 60.0:
            text_indicators.append("expressed sadness or grief")
        if hopelessness_score >= 60.0:
            text_indicators.append("expressed feelings of helplessness")
        if sentiment_polarity > 0.35 and not threat_detected:
            text_indicators.append("positive or relieved wording")

        # 2. Voice Evidence Extraction
        calc = voice_metrics.get("calculated_features", {})
        voice_stress = float(voice_metrics.get("acoustic_stress_score", 25.0))
        pitch_volatility = float(calc.get("pitch_variation_hz", voice_metrics.get("pitch_volatility", 12.0)))
        jitter_pct = float(calc.get("jitter_pct", voice_metrics.get("jitter_pct", 1.2)))
        pause_ratio = float(calc.get("pause_ratio", voice_metrics.get("pause_ratio", 0.2)))
        tremor_intensity = float(calc.get("tremor_intensity", voice_metrics.get("tremor_intensity", 15.0)))
        feature_status = voice_metrics.get("feature_status", "SIMULATED_PRESET")

        voice_indicators: List[str] = []
        is_real_audio = "AUTHENTIC" in feature_status

        if voice_stress >= 65.0 or tremor_intensity >= 60.0:
            voice_indicators.append("elevated vocal stress & micro-tremor")
        elif voice_stress >= 45.0:
            voice_indicators.append("moderate vocal tension")

        if pitch_volatility >= 25.0:
            voice_indicators.append("elevated pitch variation")
        if jitter_pct >= 2.5:
            voice_indicators.append("vocal instability / tremor")
        if pause_ratio >= 0.35:
            voice_indicators.append("frequent hesitations and pauses")

        if not voice_indicators and is_real_audio:
            voice_indicators.append("stable pitch and controlled breathing")

        # 3. Contextual Momentum from Prior Turns
        prior_distress = 30.0
        if recent_history and len(recent_history) > 0:
            last_turn = recent_history[-1]
            prior_distress = float(last_turn.get("composite_dds", 30.0))

        # 4. Multimodal Fusion & State Determination
        deep_emotion = str(voice_metrics.get("primary_vocal_emotion", ""))
        voice_valence = str(voice_metrics.get("valence", "UNCERTAIN"))
        voice_arousal = str(voice_metrics.get("arousal", "low"))
        obs = voice_metrics.get("acoustic_observations", {})
        is_trembling_voice = obs.get("vocal_stability") in ["trembling", "choked_up", "cracking"] or tremor_intensity >= 55.0
        
        # Check for immediate critical crisis signals
        if self_harm_detected:
            mood = "Overwhelmed"
            distress_level = "critical"
            confidence = 0.92
            concordance = "concordant"
        elif threat_detected or (fear_score >= 70.0 and voice_stress >= 60.0) or ("Fear" in deep_emotion and not ("fine" in text_lower or "okay" in text_lower)):
            mood = "Fearful"
            distress_level = "critical" if voice_stress >= 75.0 or threat_detected else "high"
            confidence = 0.90 if is_real_audio else 0.82
            concordance = "concordant"
        elif hopelessness_score >= 65.0 or (sadness_score >= 65.0 and pause_ratio >= 0.40) or ("Grief" in deep_emotion and voice_stress >= 65.0):
            mood = "Distressed"
            distress_level = "high"
            confidence = 0.86
            concordance = "concordant"
        elif text_valence == "POSITIVE" and not threat_detected and fear_score < 25.0:
            # Text is the stronger valence cue.  High-energy but stable voice
            # must not overwrite explicit happiness/excitement as anxiety.
            mood = "Positive/Relieved"
            distress_level = "low"
            confidence = float(nlp_metrics.get("emotion_confidence", 0.70))
            concordance = "positive_text_with_high_arousal_voice" if voice_valence == "UNCERTAIN" and voice_arousal == "high" else "concordant"
        elif fear_score >= 50.0 or (voice_valence == "NEGATIVE" and voice_stress >= 42.0) or is_trembling_voice or "Hesitation" in deep_emotion:
            # Check for conflict: user says "I'm fine" but voice shows high stress / trembling
            if ("fine" in text_lower or "theek" in text_lower or "okay" in text_lower or "thik" in text_lower or "good" in text_lower) and (voice_stress >= 48.0 or is_trembling_voice or "Fear" in deep_emotion or "Distress" in deep_emotion):
                mood = "Anxious"
                distress_level = "moderate"
                confidence = 0.84
                concordance = "voice_distress_masked_by_text"
                text_indicators.append("verbal statement of reassurance contrasting with acoustic voice tension")
            else:
                mood = "Anxious"
                distress_level = "moderate"
                confidence = 0.80
                concordance = "concordant"
        elif sadness_score >= 20.0 or (pause_ratio >= 0.45 and voice_stress >= 40.0) or "Grief" in deep_emotion:
            mood = "Sad"
            distress_level = "moderate"
            confidence = 0.80
            concordance = "concordant"
        elif (sentiment_polarity > 0.40 and voice_stress < 40.0 and fear_score < 25.0) or "Calm" in deep_emotion or "Relief" in deep_emotion:
            mood = "Positive/Relieved" if sentiment_polarity > 0.3 else "Calm"
            distress_level = "low"
            confidence = 0.88
            concordance = "concordant"
        elif voice_stress < 35.0 and fear_score < 30.0 and sadness_score < 20.0:
            mood = "Calm" if sentiment_polarity > 0.1 else "Neutral"
            distress_level = "low"
            confidence = 0.82
            concordance = "concordant"
        else:
            mood = "Uncertain/Mixed"
            distress_level = "moderate" if (voice_stress > 45.0 or fear_score > 40.0) else "low"
            confidence = 0.58
            concordance = "mixed_signals"

        # 5. Non-Technical Human-Centric Summary (for Victim UI)
        summary = self._generate_victim_facing_summary(mood, distress_level, concordance, language)

        return {
            "mood": mood,
            "valence": "POSITIVE" if mood == "Positive/Relieved" else ("NEGATIVE" if mood in ["Sad", "Anxious", "Fearful", "Angry", "Distressed", "Overwhelmed"] else "NEUTRAL"),
            "arousal": voice_arousal if voice_metrics.get("has_audio") else nlp_metrics.get("arousal", "low"),
            "confidence": round(confidence, 2),
            "distress_level": distress_level,
            "voice_indicators": voice_indicators,
            "text_indicators": text_indicators,
            "concordance_state": concordance,
            "non_technical_summary": summary,
            "raw_scores": {
                "nlp_distress": round(nlp_metrics.get("nlp_distress_score", 0.0), 1),
                "voice_stress": round(voice_stress, 1),
                "prior_momentum_dds": round(prior_distress, 1)
            }
        }

    def _generate_victim_facing_summary(
        self,
        mood: str,
        distress_level: str,
        concordance: str,
        language: str
    ) -> str:
        """
        Creates a gentle, empathetic non-diagnostic summary for the user interface.
        """
        summaries = {
            "hi": {
                "Fearful": "आपकी बात और आवाज़ से लग रहा है कि आप किसी बात को लेकर भयभीत या असुरक्षित महसूस कर रहे हैं।",
                "Anxious": "आपकी बातचीत से संकेत मिलता है कि आप इस समय कुछ चिंतित या तनाव में महसूस कर रहे हैं।",
                "Overwhelmed": "ऐसा प्रतीत होता है कि इस समय आप पर मानसिक दबाव बहुत अधिक है। हम आपकी सहायता के लिए उपस्थित हैं।",
                "Distressed": "आपकी बातचीत से लग रहा है कि आप काफी परेशान हैं। हम हर कदम पर आपके साथ हैं।",
                "Sad": "आपकी बात से दुःख और मानसिक थकान का संकेत मिल रहा है।",
                "Positive/Relieved": "यह जानकर अच्छा लगा कि आप पहले से कुछ बेहतर और राहत महसूस कर रहे हैं।",
                "Calm": "आपकी बातचीत से स्थिरता और शांति का अनुभव हो रहा है।",
                "Neutral": "आपकी स्थिति सामान्य प्रतीत हो रही है। आप जो भी साझा करना चाहें, हम सुन रहे हैं।",
                "Uncertain/Mixed": "हम आपकी बात को समझ रहे हैं। आप जैसा भी महसूस कर रहे हैं, खुलकर बता सकते हैं।"
            },
            "en": {
                "Fearful": "Your check-in suggests you may be feeling afraid or concerned for your safety.",
                "Anxious": "Your check-in suggests you may be feeling somewhat anxious or under tension right now.",
                "Overwhelmed": "It feels like things may be quite heavy for you at the moment. We are here to support you.",
                "Distressed": "Your check-in suggests you may be going through significant emotional strain.",
                "Sad": "Your response suggests you may be feeling low or emotionally exhausted.",
                "Positive/Relieved": "It is encouraging to hear that you are feeling somewhat more at ease today.",
                "Calm": "Your check-in suggests a relatively steady and calm state of mind.",
                "Neutral": "Your responses appear steady. Please feel free to share whatever is on your mind.",
                "Uncertain/Mixed": "We are listening closely. Take all the time you need to share how you are feeling."
            }
        }

        lang_dict = summaries.get(language, summaries["en"])
        base_summary = lang_dict.get(mood, lang_dict["Uncertain/Mixed"])

        if concordance == "voice_distress_masked_by_text":
            if language == "hi":
                return "आपने सब ठीक बताया है, हालांकि आवाज़ के संकेतों में कुछ तनाव महसूस हो रहा है। यदि आप चाहें, तो खुलकर बात कर सकते हैं।"
            else:
                return "You mentioned you are doing okay, though your voice check-in suggests some possible underlying tension. If you'd like, you can tell me how you're truly feeling."

        return base_summary


mood_estimator = MoodEstimator()
