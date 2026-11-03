from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.deps import (
    get_create_verification_use_case,
    get_verification_repository,
)
from app.api.v1.schemas.verification import (
    CreateVerificationRequest,
    VerificationResponse,
)
from app.application.use_cases.create_verification import (
    CreateVerificationCommand,
    CreateVerificationUseCase,
)
from app.domain.repositories.fact_check_provider import FactCheckProviderError
from app.domain.repositories.verification_repository import VerificationRepository

router = APIRouter(tags=["verifications"])


@router.post(
    "/verifications",
    response_model=VerificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_verification(
    payload: CreateVerificationRequest,
    use_case: CreateVerificationUseCase = Depends(get_create_verification_use_case),
) -> VerificationResponse:
    try:
        verification = use_case.execute(
            CreateVerificationCommand(
                content=payload.content,
                source_url=str(payload.source_url) if payload.source_url else None,
            )
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except FactCheckProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return VerificationResponse.from_entity(verification)


@router.get(
    "/verifications",
    response_model=list[VerificationResponse],
)
def list_verifications(
    repository: VerificationRepository = Depends(get_verification_repository),
) -> list[VerificationResponse]:
    return [
        VerificationResponse.from_entity(item)
        for item in repository.list_recent()
    ]


@router.get(
    "/verifications/{verification_id}",
    response_model=VerificationResponse,
)
def get_verification(
    verification_id: UUID,
    repository: VerificationRepository = Depends(get_verification_repository),
) -> VerificationResponse:
    verification = repository.get_by_id(verification_id)
    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vérification introuvable.",
        )
    return VerificationResponse.from_entity(verification)
