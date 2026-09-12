# SAMVEDNA AI (संवेदना)
## AI-Assisted Mental Health Monitoring & Distress Prediction Infrastructure
### National Helpline Against Atrocities (NHAA 14566) • Statutory Protection Framework

---

## 1. Executive Summary

SAMVEDNA AI is a production-grade, multimodal psychiatric distress monitoring and early crisis intervention platform. Designed to support victims under the **Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989** and affiliated human rights frameworks, the system bridges the critical institutional gap between formal legal complaint registration and longitudinal victim rehabilitation.

Following complaint registration, victims routinely experience severe, unmonitored psychological trauma resulting from:
- Extrajudicial intimidation and death threats by accused perpetrators.
- Bail release of perpetrators in geographical proximity to victim dwellings.
- Hostile social ostracism, communal boycotts, and deprivation of essential resources.
- Prolonged judicial depositions, procedural dread, and financial distress.

SAMVEDNA AI continuously monitors victim well-being through voluntary omnichannel check-ins (Web, Voice, Mobile, WhatsApp/IVR bridges). By fusing physical acoustic vocal biomarkers with multilingual semantic signals, clinical trauma baselines, and legal vulnerability metrics, the platform forecasts acute distress spikes 48 to 72 hours before critical decompensation, automatically alerting District Magistrates, Police Nodal Officers, and Tele-MANAS counsellors.

---

## 2. Core Architecture & Technical Innovations

```
                             +-----------------------------------+
                             |     Omnichannel Victim Check-in   |
                             |   (Voice Audio / Text Input / UI) |
                             +-----------------+-----------------+
                                               |
                     +-------------------------+-------------------------+
                     | In-Memory Buffer (Zero-Disk Volatile RAM)        |
                     +-------------------------+-------------------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
     +-------------------------------+                   +-------------------------------+
     |  Acoustic Signal Processing   |                   |   Sarvam Saaras v3 STT Bridge |
     |  - Wiener-Khinchin FFT Prosody|                   |   - saaras:v3 verbatim mode   |
     |  - F0 Mean & Pitch Volatility |                   |   - Direct RAM byte stream    |
     |  - Jitter (RAP %) & Shimmer % |                   |   - Fallback on network loss  |
     |  - HNR (dB) & Vocal Tremor    |                   +---------------+---------------+
     +---------------+---------------+                                   |
                     |                                                   v
                     |                                   +-------------------------------+
                     |                                   |   Multilingual NLP Engine     |
                     |                                   |   - Threat & intimidation cues|
                     |                                   |   - Social boycott detection  |
                     |                                   |   - 5 Indic languages + EN    |
                     +-----------------+-----------------+-------------------------------+
                                       |
                                       v
                     +-----------------------------------+
                     |    Multimodal Fusion & Concordance|
                     |   - Valence & Arousal Mapping     |
                     |   - Emotional State Calibration   |
                     +-----------------+-----------------+
                                       |
                     +-----------------+-----------------+
                     |                                   |
                     v                                   v
     +-------------------------------+   +-----------------------------------------------+
     | Dynamic Distress Scoring (DDS)|   | Conversational Empathy Engine (Groq LPU)      |
     | - 5-Component Weighted Fusion |   | - Primary: openai/gpt-oss-120b (MoE, 0.71s)   |
     | - Section 15A Safety Override |   | - Failover 1: openai/gpt-oss-20b              |
     | - Velocity Spike Detection    |   | - Failover 2: Local Offline Synthesizer       |
     | - XAI Attribution Engine      |   | - Strict Non-Prescriptive Guardrails          |
     +---------------+---------------+   +-----------------------+-----------------------+
                     |                                           |
                     +---------------------+---------------------+
                                           |
                                           v
                     +-----------------------------------+
                     |   Intervention & Triage Router    |
                     |   - Real-time Alert Hub           |
                     |   - District Magistrate Dashboard |
                     |   - Police Picket Dispatch (S.15A)|
                     |   - Tele-MANAS Counsellor Bench   |
                     +-----------------------------------+
```

### 2.1. Acoustic Voice Stress Analytics
* Located in: `backend/app/services/voice_analytics.py`
* **Signal Pipeline**:
  - Direct byte-level wave decoding from volatile RAM (`io.BytesIO`) without temporary disk writes.
  - Wiener-Khinchin FFT autocorrelation ($O(N \log N)$) using `numpy.fft.rfft` and `numpy.fft.irfft` for sub-20ms frame pitch tracking.
  - Extraction of Fundamental Frequency ($F_0$), Jitter (Relative Average Perturbation %), Shimmer (Local Amplitude Perturbation %), Harmonics-to-Noise Ratio (HNR in dB), and 4–8 Hz physiological vocal tremor modulation.
  - Real-time noise gate filtering and calibrated voice activity detection (VAD).

### 2.2. Zero-Disk Indic Speech-to-Text (STT) Bridge
* Located in: `backend/app/services/stt_bridge.py`
* **Model**: Sarvam AI Saaras v3 (`saaras:v3`).
* **Configuration**: `mode="verbatim"`, `language_code="unknown"`.
* **Zero-Disk Invariant**: Audio streams are transmitted as raw in-memory byte buffers directly to Sarvam API endpoints. If the connection times out or fails, the bridge executes graceful degradation ($NLP_{score} = 0.0$, $NLP_{confidence} = \text{"low"}$) and prompts the scoring engine to reweight remaining operational components.

### 2.3. Conversational Empathy & Guardrail Engine
* Located in: `backend/app/services/llm_service.py`
* **Inference Silicon**: Groq Language Processing Units (LPU) running open-weight models.
* **Cascade Architecture**:
  1. Primary Tier: `openai/gpt-oss-120b` (Open-weight MoE, ~0.71s TTFT, ~477 tok/s)
  2. Failover Tier 1: `openai/gpt-oss-20b` (~0.77s TTFT, ~938 tok/s)
  3. Failover Tier 2: Deterministic Local Offline Dynamic Synthesizer (100% edge-resilient)
* **Clinical Guardrails**:
  - Non-diagnostic: Zero psychiatric labeling (e.g., does not diagnose PTSD, clinical depression).
  - Non-prescriptive: Zero pharmacological recommendations.
  - Non-speculative: Zero prediction of court or legal trial outcomes.
  - Context-Aware Conditioning: Casual greetings ("Hi", "Hello") and positive expressions ("I am happy today") are met with warm, natural conversation without inappropriate crisis helpline disclosures. High-risk statements immediately activate grounding protocols, Section 15A statutory protection guidance, and emergency hotline routing.

### 2.4. Restored Dynamic Distress Score (DDS) & Longitudinal Risk Model
* Located in: `backend/app/services/distress_scoring.py`
* **Standard 5-Component Weighted Fusion**:
  $$\text{DDS}_t = 0.28 \cdot \text{Voice} + 0.28 \cdot \text{NLP} + 0.20 \cdot \text{Clinical} + 0.16 \cdot \text{Legal} + 0.08 \cdot \text{Engagement}$$
* **Missing Modality Redistribution**:
  If voice or audio is unavailable, weights automatically redistribute proportionally over available components ($\sum w_i = 1.0$).
* **Statutory Safety Overrides**:
  - Threat / Witness Intimidation Flag: $\text{DDS}_t \leftarrow \max(\text{DDS}_t, 72.0) + 12.0$
  - Self-Harm / Crisis Ideation Flag: $\text{DDS}_t \leftarrow \max(\text{DDS}_t, 85.0) + 10.0$
* **Velocity Escalation Detection**:
  $$\Delta\text{DDS} = \text{DDS}_t - \text{DDS}_{t-1}$$
  An escalation velocity $\Delta\text{DDS} \ge 18.0\text{ points}$ triggers an automated Acute Crisis Alert to the District Magistrate and Superintendent of Police.

### 2.5. Explainable AI (XAI) Attribution
* Located in: `backend/app/services/xai_explainer.py`
* Generates clear, evidentiary factor contributions for judges, protection officers, and clinical psychologists (e.g., *Direct Perpetrator Threat: 34%*, *Vocal Tremor & Acoustic Constriction: 28%*, *Bail Proximity Vulnerability: 20%*).

---

## 3. Repository Structure

```
samvedna/
├── client/                     # Modern Neumorphic React + Tailwind + Lucide frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # Navigation and tactile SOS trigger
│   │   │   ├── VoiceCheckin.jsx        # Waveform recorder and voice assessment
│   │   │   ├── ChatAssistant.jsx       # Conversational support with TTS and STT
│   │   │   ├── WellbeingMetrics.jsx    # Well-being score and vocal characteristics
│   │   │   ├── OfficialDashboard.jsx   # Priority triage and protection orders
│   │   │   ├── EmergencyHelplines.jsx  # 24/7 statutory helpline quick links
│   │   │   └── EmergencySosModal.jsx   # One-click emergency dispatch modal
│   │   ├── App.jsx                     # Root application layout
│   │   └── index.css                   # Neumorphic soft-shadow utility tokens
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── models/             # Pydantic schemas and domain models
│   │   ├── routers/
│   │   │   ├── counsellor.py   # Counsellor workbench and longitudinal charts
│   │   │   ├── dashboard.py    # Official district triage and priority queue
│   │   │   └── victim.py       # Omnichannel check-in, voice ingestion, SOS
│   │   ├── services/
│   │   │   ├── alert_service.py       # Multi-agency alert dispatch hub
│   │   │   ├── distress_scoring.py    # Restored 5-component DDS engine
│   │   │   ├── intervention.py        # Section 15A statutory protocol matcher
│   │   │   ├── llm_service.py         # Conversational empathy service
│   │   │   ├── mood_estimator.py      # Discrete mood and affect classification
│   │   │   ├── multimodal_fusion.py   # Audio-text valence and arousal fusion
│   │   │   ├── nlp_engine.py          # Multilingual threat & boycott NLP
│   │   │   ├── stt_bridge.py          # Speech-to-text verbatim memory bridge
│   │   │   ├── voice_analytics.py     # Wiener-Khinchin FFT acoustic engine
│   │   │   └── xai_explainer.py       # Causal factor attribution engine
│   │   ├── config.py           # Centralized environment settings
│   │   ├── database.py         # Mock in-memory database & longitudinal records
│   │   └── main.py             # FastAPI application entry point
│   ├── static/                 # Fallback static assets
│   └── requirements.txt        # Backend dependency specification
├── .env.example                # Environment configuration template
├── .gitignore                  # Production Git ignore rules
├── Procfile                    # Deployment process configuration
├── render.yaml                 # Render cloud infrastructure blueprint
├── requirements.txt            # Root dependency specification
├── run_server.py               # Production ASGI server launcher
├── samvedna all explain.md     # System architecture and mathematical reference
├── test_api.py                 # REST endpoint automated validation suite
├── test_conversational_pipeline.py # Conversational empathy and guardrail test suite
├── test_dds.py                 # DDS formula and weight distribution unit tests
├── test_emotion_pipeline.py    # Affect and sentiment validation suite
├── test_groq_integration.py    # Groq LPU inference and fallback integration suite
├── test_stt_bridge.py          # Sarvam STT bridge and zero-disk memory test suite
└── test_system.py              # End-to-end DSP, NLP, and triage validation suite
```

---

## 4. Statutory & Regulatory Alignment

SAMVEDNA AI is built to operationalize statutory rights guaranteed under Indian law:

| Statute / Policy | Regulatory Mandate | System Operationalization |
| :--- | :--- | :--- |
| **Section 15A(1), SC/ST (PoA) Act** | Duty of State to protect victims, informants, and witnesses from intimidation, inducement, violence, or threats. | Automatic threat keyword detection triggers emergency police protection dispatch. |
| **Section 15A(6)(b), SC/ST (PoA) Act** | Immediate police escort, residence picketing, or temporary safe-house relocation. | One-click statutory protection requisition dispatched directly to Police Nodal Officers. |
| **Rule 5(1)(e), SC/ST (PoA) Rules** | Provision of immediate psychological and psychiatric trauma counselling. | Longitudinal distress tracking with direct escalation to Tele-MANAS (14416) counsellors. |
| **National Atrocity Helpline** | 24/7 toll-free access to justice and rehabilitation via NHAA 14566. | Native call center and omnichannel triage integration for helpline operators. |

---

## 5. Development & Setup Guide

### 5.1. Prerequisites
- **Python**: Version 3.10, 3.11, 3.12, or 3.13+
- **Operating System**: Linux (Ubuntu/Debian recommended), macOS, or Windows WSL2
- **Network Access**: Outbound HTTPS access to Groq (`api.groq.com`) and Sarvam AI (`api.sarvam.ai`)

### 5.2. Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/shalumishra024-byte/samvedna.git
   cd samvedna
   ```

2. **Create and Activate a Virtual Environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and provide your API keys:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```dotenv
   # Groq API Configuration (Fast LPU Inference)
   # Register at: https://console.groq.com/keys
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b

   # Sarvam AI STT Configuration (Saaras v3 Indic STT)
   # Register at: https://dashboard.sarvam.ai/
   SARVAM_API_KEY=sk_your_sarvam_api_key_here
   SARVAM_MODEL=saaras:v3
   SARVAM_MODE=verbatim

   # Server Settings
   PORT=8000
   HOST=0.0.0.0
   ENABLE_NOISE_GATE=True
   ```
   *Note: If API keys are omitted or invalid, SAMVEDNA AI automatically operates in resilient offline mode using local DSP heuristics and deterministic dynamic synthesis.*

---

## 6. Running the Application

### 6.1. Development / Production Server
Execute the server launcher:
```bash
python run_server.py
```
Or run directly via Uvicorn with reload support:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6.2. Frontend Development (Optional Live Hot-Reload)
To run the React Neumorphic client with live Vite hot-reloading:
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. All API calls automatically proxy to the FastAPI backend at port 8000.

To build the client for production serving via FastAPI:
```bash
cd client
npm run build
```

### 6.3. Service Access Points
Once started, navigate to:
- **Web Application Portal**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI / Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Redoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 7. Automated Test & Verification Suite

All modules can be verified using the automated test suites:

```bash
# 1. Core Signal Processing, DSP, NLP, and XAI Verification
python test_system.py

# 2. DDS Formula and Weight Redistribution Unit Tests
python test_dds.py

# 3. Sarvam Saaras v3 STT Bridge and Zero-Disk Invariant Tests
python test_stt_bridge.py

# 4. Groq LPU LLM Cascade and Empathy Response Tests
python test_groq_integration.py

# 5. Multimodal Conversational Pipeline & Guardrail Tests (15 cases)
python -m unittest test_conversational_pipeline.py

# 6. REST API Endpoint Integration Tests
python test_api.py
```

To run all validation suites in a single sequence:
```bash
python test_system.py && python test_dds.py && python test_stt_bridge.py && python test_groq_integration.py && python -m unittest test_conversational_pipeline.py && python test_api.py
```

---

## 8. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check, active providers, and uptime status. |
| `POST` | `/api/v1/victim/checkin` | Multipart endpoint accepting voice audio and/or text check-ins. Returns DDS score, biomarkers, and empathetic response. |
| `POST` | `/api/v1/victim/sos` | Instant emergency distress trigger; dispatches priority alerts to district nodal triage. |
| `POST` | `/api/v1/victim/reset` | Clears conversational memory buffer for the specified session ID. |
| `GET` | `/api/v1/victim/profile/{id}` | Retrieves historical check-in trajectories, demographics, and clinical notes. |
| `GET` | `/api/v1/dashboard/metrics` | Returns aggregate district-wide vulnerability and active alert counts. |
| `GET` | `/api/v1/dashboard/cases` | Returns priority-sorted victim queue with risk levels and recent escalation flags. |
| `GET` | `/api/v1/counsellor/case-file/{id}` | Detailed clinical workbench with 4-week longitudinal trajectory and biomarker spectrograms. |
| `POST` | `/api/v1/counsellor/intervene` | Requisitions statutory Section 15A protection, Tele-MANAS counselling, or financial relief. |

---

## 9. Security, Privacy & Compliance Invariants

1. **Zero-Disk Audio Invariant**:
   All uploaded audio frames are parsed in volatile RAM (`io.BytesIO`). No raw voice recordings are stored or persisted on server disk storage.
2. **Deterministic Data Sovereignty**:
   In high-security government installations, external API cascades can be isolated; the system functions completely on-premise using the local offline dynamic synthesizer.
3. **Audit Trail Logging**:
   All check-in traces are recorded with non-reidentifiable session keys, tracking confidence metrics, input modalities, and calculated distress vectors for clinical oversight.
4. **Data Minimization**:
   Personally Identifiable Information (PII) is decoupled from clinical acoustic biomarkers via hashed victim identification tokens.

---

## 10. License & Institutional Context

Developed as an open-architecture technological intervention for the National Helpline Against Atrocities (NHAA 14566) and the Ministry of Social Justice and Empowerment. Intended for institutional deployment by District Legal Services Authorities (DLSA), Special Courts, and state health administrations.
