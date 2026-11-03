from fastapi import APIRouter

from app.api.v1.routes.verifications import router as verifications_router

api_router = APIRouter()
api_router.include_router(verifications_router)
