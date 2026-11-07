from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.tenders import router as tenders_router
from app.api.v1.pipeline import router as pipeline_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.team import router as team_router
from app.api.v1.spend import router as spend_router
from app.api.v1.audit import router as audit_router
from app.api.v1.monitors import router as monitors_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(tenders_router)
api_router.include_router(pipeline_router)
api_router.include_router(reviews_router)
api_router.include_router(team_router)
api_router.include_router(spend_router)
api_router.include_router(audit_router)
api_router.include_router(monitors_router)
