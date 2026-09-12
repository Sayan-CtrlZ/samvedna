"""Dedicated Multimodal Fusion Layer for SAMVEDNA AI.

Implements the 8 core fusion rules:
1. Text meaning has priority when determining semantic intent.
2. Voice should refine the interpretation, not blindly replace text.
3. High arousal DOES NOT automatically mean distress (e.g. excitement, joy).
4. A greeting should remain a greeting (casual check-in, distress = none).
5. Positive emotion must remain positive (no manufactured distress).
6. Neutral text must remain neutral unless voice/context provides meaningful evidence otherwise.
7. Disagreement is handled defensively by reducing confidence rather than inventing severe distress.
8. Genuinely uncertain signals return 'uncertain' and clarification mode.
"""
from typing import Any, Dict, List, Optional
from app.services.nlp_engine import CaseInsensitiveStr, FlexibleEmotionStr


class MultimodalFusionEngine:
    """
    Combines Text Analysis (Primary Semantic Signal) and Voice Analysis
    (Secondary Prosodic Refinement) into a structured FINAL USER STATE.
    """

    def interpret(
        self,
        text_metrics: Dict[str, Any],
        voice_metrics: Optional[Dict[str, Any]] = None,
        recent_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        voice_metrics = voice_metrics or {}
        has_voice = bool(voice_metrics.get("has_audio"))
        
        # Apply STT Confidence Penalty
        stt_conf = text_metrics.get("stt_confidence")
        if stt_conf is not None and stt_conf < 0.6:
            penalty = max(0.2, stt_conf / 0.6)
            if "nlp_distress_score" in text_metrics:
                text_metrics["nlp_distress_score"] *= penalty
            text_metrics["emotion_confidence"] = float(text_metrics.get("emotion_confidence", 0.70)) * penalty

        # 1. Primary Text Semantics
        text_intent = str(text_metrics.get("intent", "other"))
        text_valence = str(text_metrics.get("valence", "neutral")).lower()
        text_emotion = str(text_metrics.get("emotion", "neutral"))
        text_distress = str(text_metrics.get("distress_level", "none")).lower()
        text_confidence = float(text_metrics.get("emotion_confidence", text_metrics.get("classification_confidence", 0.70)))
        text_arousal = str(text_metrics.get("arousal", "low")).lower()
        threat_detected = bool(text_metrics.get("witness_threat_detected", False))
        self_harm_detected = bool(text_metrics.get("self_harm_ideation_detected", False))

        # 2. Secondary Voice Prosody
        voice_valence = str(voice_metrics.get("voice_valence", voice_metrics.get("valence", "uncertain"))).lower() if has_voice else "uncertain"
        voice_arousal = str(voice_metrics.get("arousal", "uncertain")).lower() if has_voice else "uncertain"
        voice_confidence = float(voice_metrics.get("voice_confidence", voice_metrics.get("emotion_confidence", 0.0))) if has_voice else 0.0
        voice_tension = float(voice_metrics.get("vocal_tension", voice_metrics.get("acoustic_stress_score", 0.0))) if has_voice else 0.0
        voice_stability = str(voice_metrics.get("vocal_stability", "Stable")) if has_voice else "N/A"

        # Initialize final interpretation from text semantics (Rule 1 & Rule 2)
        intent = text_intent
        valence = text_valence
        emotion = text_emotion
        distress = text_distress
        confidence = text_confidence
        arousal = text_arousal

        # Prosodic arousal refinement
        if has_voice and voice_arousal in {"high", "medium", "low"}:
            # Voice prosody reflects vocal intensity
            arousal = voice_arousal

        reason_parts = [f"Text establishes primary semantic intent as '{text_intent}'."]
        concordance_state = "text_only" if not has_voice else "text_primary_voice_supporting"

        # 3. Voice Refinement & Rule Evaluations
        if has_voice:
            # Rule 3: High arousal voice + positive text = joy/excitement, NOT stress!
            if text_valence == "positive" and voice_arousal == "high":
                arousal = "high"
                confidence = min(0.95, text_confidence + 0.05 * voice_confidence)
                reason_parts.append("High vocal arousal aligns with positive enthusiasm and excitement.")
                concordance_state = "concordant_positive_high_arousal"

            # Rule 7: Text says fine/positive, but voice is uncertain/tense -> do not invent severe distress
            elif text_valence in {"positive", "neutral"} and (voice_valence == "negative" or voice_tension >= 50):
                if voice_tension >= 65 and voice_confidence >= 0.70:
                    # Meaningful evidence of masked tension
                    concordance_state = "voice_distress_masked_by_text"
                    confidence = max(0.45, text_confidence - 0.15)
                    if distress == "none":
                        distress = "low"
                    reason_parts.append("Acoustic tension indicates possible underlying strain despite composed wording.")
                else:
                    # Uncertain/mild tension: reduce confidence slightly, maintain text dominance
                    confidence = max(0.40, text_confidence - 0.10 * voice_confidence)
                    reason_parts.append("Voice shows slight hesitation or ambiguous tension; text interpretation remains dominant.")

            # Co-occurring Distress (text negative + voice tense)
            elif text_valence == "negative" and (voice_valence == "negative" or voice_tension >= 45):
                confidence = min(0.95, text_confidence + 0.12 * voice_confidence)
                if distress == "low" and voice_tension >= 55:
                    distress = "moderate"
                reason_parts.append("Acoustic tension reinforces distress detected in semantic text.")
                concordance_state = "concordant_distress"

            # Voice uncertain: does not override text
            elif voice_valence == "uncertain":
                confidence = max(0.45, text_confidence - 0.05)
                reason_parts.append("Voice acoustics have ambiguous valence; text semantics govern interpretation.")

        # 4. Response Mode & Category Selection
        # Prioritize TEXT intent and valence for the conversation mode.
        # LLM will receive the full context (including acoustic tension and DDS)
        # to dynamically generate the most appropriate response, without being forced
        # into a crisis mode by a single acoustic feature.

        if threat_detected or self_harm_detected:
            mode = "distress_support"
            distress = "high"
            reason_parts.append("Severe threat or self-harm indicators require safety-oriented support.")
        elif intent == "distress_support_seeking":
            mode = "supportive" if distress != "high" else "distress_support"
            reason_parts.append("Support-seeking intent triggers empathetic supportive guidance.")
        elif intent == "greeting":
            mode = "casual"
            distress = "none" if not has_voice else distress
            reason_parts.append("Greeting input classified as casual check-in.")
        elif intent in {"information_seeking", "question"}:
            mode = "neutral"
            reason_parts.append("Informational request classified as neutral informative response mode.")
        elif valence == "positive":
            mode = "positive"
            reason_parts.append("Positive user expression confirmed.")
        elif valence == "negative":
            mode = "supportive"
            reason_parts.append("Negative valence triggers compassionate supportive response.")
        elif valence == "neutral":
            mode = "neutral"
            reason_parts.append("Neutral user statement handled in calm neutral mode.")
        elif valence == "uncertain":
            mode = "clarification"
            reason_parts.append("Ambiguous signals handled via clarification mode.")
        else:
            mode = "casual" if intent == "casual_conversation" else "neutral"

        final_intent = FlexibleEmotionStr(intent)
        final_valence = CaseInsensitiveStr(valence)
        final_emotion = FlexibleEmotionStr(emotion)

        return {
            "intent": final_intent,
            "valence": final_valence,
            "emotion": final_emotion,
            "arousal": arousal,
            "distress_level": distress,
            "confidence": round(confidence, 2),
            "reason": " ".join(reason_parts),
            "response_mode": mode,
            "text_analysis": {
                "intent": text_intent,
                "valence": text_valence,
                "emotion": text_emotion,
                "distress_level": text_distress,
                "confidence": text_confidence,
            },
            "voice_evidence": {
                "available": has_voice,
                "valence": voice_valence,
                "arousal": voice_arousal,
                "tension_score": voice_tension,
                "stability": voice_stability,
                "confidence": voice_confidence,
            },
            # Compatibility aliases consumed by existing UI and LLM prompt
            "mood": self._mood_for(str(final_emotion), str(final_valence)),
            "concordance_state": concordance_state,
            "non_technical_summary": self._summary(mode),
        }

    @staticmethod
    def _mood_for(emotion: str, valence: str) -> str:
        valence_upper = valence.upper()
        if valence_upper == "POSITIVE":
            return "Positive/Relieved"
        if valence_upper == "NEUTRAL":
            return "Neutral"
        if "fear" in emotion.lower():
            return "Fearful"
        if "overwhelm" in emotion.lower() or "distress" in emotion.lower():
            return "Distressed"
        if "worry" in emotion.lower() or "stress" in emotion.lower() or "anxiety" in emotion.lower():
            return "Anxious"
        if "anger" in emotion.lower() or "frustrat" in emotion.lower():
            return "Angry"
        if "sad" in emotion.lower():
            return "Sad"
        return "Neutral"

    @staticmethod
    def _summary(mode: str) -> str:
        summaries = {
            "casual": "A normal conversational check-in.",
            "positive": "A positive emotional check-in.",
            "neutral": "A neutral information or everyday check-in.",
            "supportive": "A supportive response may be helpful.",
            "distress_support": "A safety-focused supportive response may be helpful.",
            "clarification": "The available signals are uncertain.",
        }
        return summaries.get(mode, "Standard check-in.")


multimodal_fusion_engine = MultimodalFusionEngine()
