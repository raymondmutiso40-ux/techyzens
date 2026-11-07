from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.database import init_db
from app.api.router import api_router

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
        "BidDesk AI: Autonomous Business Development Intelligence System. "
        "From tender notice to a review-ready draft, with your people making every call. "
        "Implements the 7 Moves: Find, Extract, Score, Match, Draft, Check, Send... and then it stops."
    ),
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router)

# Mount Static Assets & Dashboard
static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/", tags=["Dashboard"])
@app.get("/dashboard", tags=["Dashboard"])
async def serve_dashboard():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "BidDesk AI API running. Open /docs for OpenAPI documentation."}

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
