import os
import sys
import socket

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    sys.path.insert(0, backend_dir)
    
    local_ip = get_local_ip()
    port = int(os.environ.get("PORT", 8000))
    
    print("=" * 75)
    print(" SAMVEDNA AI - NHAA 14566 Distress Prediction & Victim Care System")
    print("=" * 75)
    print(f" Local Access (Host PC):    http://127.0.0.1:{port} or http://localhost:{port}")
    print(f" Mobile / Wi-Fi Access:     http://{local_ip}:{port}")
    print(f" Swagger REST API Docs:     http://127.0.0.1:{port}/docs")
    print("=" * 75)
    print(" Server is LIVE and listening on 0.0.0.0:8000. Press CTRL+C to stop.")
    print("=" * 75)
    
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
