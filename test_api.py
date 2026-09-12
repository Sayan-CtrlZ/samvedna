import sys
import os
import asyncio

backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

import httpx
from app.main import app as target_fastapi_app

async def run_api_tests():
    print("=" * 65)
    print(" SAMVEDNA AI - REST API Endpoint Verification")
    print("=" * 65)
    
    transport = httpx.ASGITransport(app=target_fastapi_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        print(f" [1/6] GET /health -> {res.status_code} OK | System: {res.json().get('system')}")
        
        # 2. Serve UI
        res = await client.get("/")
        assert res.status_code == 200, f"Root UI route failed: {res.status_code}"
        print(f" [2/6] GET / -> {res.status_code} OK (HTML served)")
        
        # 3. Dashboard metrics
        res = await client.get("/api/v1/dashboard/metrics")
        assert res.status_code == 200, f"Dashboard metrics failed: {res.status_code}"
        print(f" [3/6] GET /api/v1/dashboard/metrics -> {res.status_code} OK | Cases: {res.json().get('total_monitored_cases')}")
        
        # 4. District triage queue
        res = await client.get("/api/v1/dashboard/cases")
        assert res.status_code == 200, f"Dashboard cases failed: {res.status_code}"
        print(f" [4/6] GET /api/v1/dashboard/cases -> {res.status_code} OK | Cases count: {len(res.json())}")
        
        # 5. Counsellor case file
        res = await client.get("/api/v1/counsellor/case-file/VIC-MP-2024-881")
        assert res.status_code == 200, f"Counsellor case file failed: {res.status_code}"
        print(f" [5/6] GET /api/v1/counsellor/case-file/VIC-MP-2024-881 -> {res.status_code} OK")
        
        # 6. Victim check-in (Text)
        res = await client.post(
            "/api/v1/victim/checkin",
            data={
                "victim_id": "VIC-MP-2024-881",
                "channel": "Web_Portal",
                "text_content": "मुझे बहुत डर लग रहा है, आरोपी ने फिर से धमकी दी है",
                "language": "hi"
            }
        )
        assert res.status_code == 200, f"Victim checkin failed: {res.status_code}"
        data = res.json()
        print(f" [6/6] POST /api/v1/victim/checkin -> {res.status_code} OK | DDS: {data.get('composite_dds')} | Risk: {data.get('risk_level')}")
        
    print("=" * 65)
    print(" ALL REST API ENDPOINTS VERIFIED (100% SUCCESS)!")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_api_tests())
