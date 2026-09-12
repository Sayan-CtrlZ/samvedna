import json
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, url, method="GET", form_data=None):
    print(f"\n==========================================")
    print(f"Testing {name}: {method} {url}")
    print(f"==========================================")
    req = urllib.request.Request(url, method=method)
    if form_data:
        encoded = urllib.parse.urlencode(form_data).encode("utf-8")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        body = encoded
    else:
        body = None
    
    try:
        with urllib.request.urlopen(req, data=body, timeout=35) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            print(f"Status: {status}")
            try:
                parsed = json.loads(content)
                return status, parsed
            except Exception:
                return status, content[:200]
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
        return e.code, None
    except Exception as e:
        print(f"Error: {e}")
        return None, None

def run_tests():
    # 1. Health check
    status, health = test_endpoint("Health Check", f"{BASE_URL}/health")
    print(f"Health Response: {health}")
    
    # 2. Frontend Check
    status, frontend = test_endpoint("Frontend Page", f"{BASE_URL}/")
    print(f"Frontend snippet: {frontend[:120]}...")
    
    # 3. Test 6 Required User Inputs
    sentences = [
        ("Hi", "en"),
        ("I'm so happy today!", "en"),
        ("I'm really excited!", "en"),
        ("Tell me what FastAPI is.", "en"),
        ("I'm worried about my exam.", "en"),
        ("I feel overwhelmed and don't know what to do.", "en")
    ]
    
    print("\n" + "#" * 60)
    print("RUNNING 6 MANDATORY INPUTS THROUGH /api/v1/victim/checkin")
    print("#" * 60)
    
    results = {}
    for text, lang in sentences:
        form_payload = {
            "victim_id": f"TEST-VIC-{abs(hash(text)) % 10000}",
            "channel": "Web_Portal",
            "text_content": text,
            "language": lang
        }
        status, data = test_endpoint(f"Input: '{text}'", f"{BASE_URL}/api/v1/victim/checkin", "POST", form_payload)
        if data:
            fused = data.get("emotional_state") or data.get("fused_state") or {}
            results[text] = {
                "text": text,
                "intent": fused.get("intent"),
                "valence": fused.get("valence"),
                "emotion": fused.get("emotion"),
                "arousal": fused.get("arousal"),
                "distress_level": fused.get("distress_level"),
                "response_mode": fused.get("response_mode"),
                "confidence": fused.get("confidence"),
                "reason": fused.get("reason"),
                "response": data.get("ai_response") or data.get("empathetic_response") or data.get("response"),
            }
            print(f"\n>>> Input: \"{text}\"")
            print(f"    Intent:         {fused.get('intent')}")
            print(f"    Valence:        {fused.get('valence')}")
            print(f"    Emotion:        {fused.get('emotion')}")
            print(f"    Arousal:        {fused.get('arousal')}")
            print(f"    Distress Level: {fused.get('distress_level')}")
            print(f"    Response Mode:  {fused.get('response_mode')}")
            print(f"    Confidence:     {fused.get('confidence')}")
            print(f"    AI Response:    {results[text]['response']}")
            
    with open("example_outputs_live.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nOutputs saved to example_outputs_live.json successfully.")

if __name__ == "__main__":
    run_tests()
