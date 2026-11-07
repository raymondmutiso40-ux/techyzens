from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.api.router import api_router
from app.api.v1.auth import router as auth_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "TenderPilot / BidDesk AI: Autonomous Business Development Intelligence System. "
        "From tender notice to a review-ready draft, with your people making every call. "
        "Implements the 7 Moves: Find, Extract, Score, Match, Draft, Check, Send... and then it stops."
    ),
    lifespan=lifespan
)

# CORS Middleware for local Vite dev and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router (/api/v1)
app.include_router(api_router)

# Also mount /auth and /api aliases for direct frontend client compatibility
app.include_router(auth_router)
app.include_router(api_router, prefix="/api")

# Mount Static Assets & Dist
frontend_dist = Path(__file__).resolve().parent.parent / "tenderpilot" / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="dist-assets")

static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "sms_provider": "Thrivewave" if settings.ENABLE_SMS_ALERTS else "Disabled",
        "daily_spend_cap": settings.DAILY_SPEND_CAP_USD,
        "per_tender_spend_cap": settings.PER_TENDER_SPEND_CAP_USD
    }

@app.get("/{full_path:path}", tags=["SPA Catch-all"])
async def serve_spa_app(full_path: str = ""):
    # If API or docs route, skip
    if full_path.startswith(("api", "auth", "docs", "openapi.json", "health", "static", "assets")):
        return {"detail": "Not Found"}
    
    # If a specific static file in frontend_dist exists (e.g. favicon.svg, images, icons), serve it
    if frontend_dist.exists() and full_path:
        requested_file = frontend_dist / full_path
        if requested_file.is_file():
            return FileResponse(requested_file)

    # Try serving compiled React Vite dist
    if frontend_dist.exists() and (frontend_dist / "index.html").exists():
        return FileResponse(frontend_dist / "index.html")
    
    # Try fallback static directory
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
        
    return {"message": "TenderPilot API running. Open /docs for OpenAPI documentation."}
