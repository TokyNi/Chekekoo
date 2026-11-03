from functools import lru_cache

from app.application.use_cases.create_verification import CreateVerificationUseCase
from app.domain.repositories.verification_repository import VerificationRepository
from app.infrastructure.analysis.google_fact_check_provider import (
    GoogleFactCheckProvider,
)
from app.infrastructure.config.settings import get_settings
from app.infrastructure.persistence.sqlite_verification_repository import (
    SQLiteVerificationRepository,
)


@lru_cache
def get_verification_repository() -> VerificationRepository:
    return SQLiteVerificationRepository(get_settings().database_path)


def get_create_verification_use_case() -> CreateVerificationUseCase:
    return CreateVerificationUseCase(
        get_verification_repository(),
        GoogleFactCheckProvider(get_settings().fact_check_api_key),
    )
