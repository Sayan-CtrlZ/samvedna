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
    allow_origins=['*'],
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
async def serve_ui():
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
