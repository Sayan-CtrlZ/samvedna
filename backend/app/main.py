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

static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
if os.path.exists(static_dir):
    app.mount('/static', StaticFiles(directory=static_dir), name='static')

@app.get('/')
async def serve_ui():
    index_path = os.path.join(static_dir, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {'message': 'SAMVEDNA AI Backend Active', 'docs': '/docs'}

@app.get('/download-notes')
@app.get('/download/pdf')
async def download_backend_notes():
    pdf_path = os.path.join(static_dir, 'SAMVEDNA_AI_Backend_Complete_Notes.pdf')
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename='SAMVEDNA_AI_Backend_Complete_Notes.pdf'
        )
    return {'error': 'PDF file not found'}

@app.get('/download-frontend-notes')
@app.get('/download/frontend-pdf')
async def download_frontend_notes():
    pdf_path = os.path.join(static_dir, 'SAMVEDNA_AI_Frontend_Complete_Notes.pdf')
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename='SAMVEDNA_AI_Frontend_Complete_Notes.pdf'
        )
    return {'error': 'Frontend PDF file not found'}

@app.get('/download-aiml-notes')
@app.get('/download/aiml-pdf')
async def download_aiml_notes():
    pdf_path = os.path.join(static_dir, 'SAMVEDNA_AI_AIML_Complete_Notes.pdf')
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename='SAMVEDNA_AI_AIML_Complete_Notes.pdf'
        )
    return {'error': 'AI/ML PDF file not found'}

@app.get('/download-research-notes')
@app.get('/download/research-pdf')
async def download_research_notes():
    pdf_path = os.path.join(static_dir, 'SAMVEDNA_AI_Research_Impact_Validation_Notes.pdf')
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename='SAMVEDNA_AI_Research_Impact_Validation_Notes.pdf'
        )
    return {'error': 'Research PDF file not found'}

@app.get('/download-presentation')
@app.get('/download/pptx')
async def download_presentation():
    pptx_path = os.path.join(static_dir, 'SAMVEDNA_AI_SIH_Presentation.pptx')
    if os.path.exists(pptx_path):
        return FileResponse(
            pptx_path,
            media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            filename='SAMVEDNA_AI_SIH_Presentation.pptx'
        )
    return {'error': 'Presentation PPTX file not found'}

@app.get('/download-presentation-pdf')
@app.get('/download/presentation-pdf')
async def download_presentation_pdf():
    pdf_path = os.path.join(static_dir, 'SAMVEDNA_AI_SIH_Presentation.pdf')
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename='SAMVEDNA_AI_SIH_Presentation.pdf'
        )
    return {'error': 'Presentation PDF file not found'}




@app.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'system': settings.PROJECT_NAME,
        'version': settings.VERSION,
        'supported_languages': settings.SUPPORTED_LANGUAGES
    }
