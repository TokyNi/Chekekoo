from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.domain.entities.verification import Verification


class CreateVerificationRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=8000)
    source_url: HttpUrl | None = None


class SourceReviewResponse(BaseModel):
    name: str
    url: str
    date: str | None
    position: str
    evidence: str


class AnalysisResponse(BaseModel):
    reliability_score: float | None
    confidence_score: float | None
    verdict: str
    summary: str
    arguments: list[str]
    conclusion: str
    sources: list[SourceReviewResponse]


class VerificationResponse(BaseModel):
    id: UUID
    content: str
    source_url: str | None
    status: str
    created_at: datetime
    analysis: AnalysisResponse

    @classmethod
    def from_entity(cls, verification: Verification) -> VerificationResponse:
        return cls(
            id=verification.id,
            content=verification.content,
            source_url=verification.source_url,
            status=verification.status.value,
            created_at=verification.created_at,
            analysis=AnalysisResponse(
                reliability_score=verification.analysis.reliability_score,
                confidence_score=verification.analysis.confidence_score,
                verdict=verification.analysis.verdict.value,
                summary=verification.analysis.summary,
                arguments=verification.analysis.arguments,
                conclusion=verification.analysis.conclusion,
                sources=[
                    SourceReviewResponse(
                        name=source.name,
                        url=source.url,
                        date=source.date,
                        position=source.position,
                        evidence=source.evidence,
                    )
                    for source in verification.analysis.sources
                ],
            ),
        )
