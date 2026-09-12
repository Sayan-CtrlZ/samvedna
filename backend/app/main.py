import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.routers import victim, dashboard, counsellor, alerts

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description='AI-based Dynamic Mental Health Monitoring & Distress Prediction System for Atrocity Victims (NHAA 14566)'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8000', 'http://127.0.0.1:8000'],
    allow_origin_regex=r'https?://.*',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(victim.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(counsellor.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)

client_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "client", "dist"))
client_assets_dir = os.path.join(client_dist_dir, "assets")

if os.path.exists(client_assets_dir):
    app.mount("/assets", StaticFiles(directory=client_assets_dir), name="assets")

@app.get("/")
@app.get("/{full_path:path}")
async def serve_ui(full_path: str = ""):
    # If path starts with api/ or docs or openapi.json, return 404 if not matched by routers
    if full_path.startswith("api/") or full_path in ["docs", "openapi.json", "redoc"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
    client_index = os.path.join(client_dist_dir, "index.html")
    if os.path.exists(client_index):
        return FileResponse(client_index)
    return {"message": "SAMVEDNA Backend Active", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supported_languages": settings.SUPPORTED_LANGUAGES
    }
