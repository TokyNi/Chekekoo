from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4


class VerificationStatus(StrEnum):
    COMPLETED = "completed"


class Verdict(StrEnum):
    TRUE = "true"
    MOSTLY_TRUE = "mostly_true"
    PARTIALLY_TRUE = "partially_true"
    MISLEADING = "misleading"
    FALSE = "false"
    UNVERIFIABLE = "unverifiable"


@dataclass(slots=True)
class SourceReview:
    name: str
    url: str
    date: str | None
    position: str
    evidence: str


@dataclass(slots=True)
class Analysis:
    reliability_score: float | None
    confidence_score: float | None
    verdict: Verdict
    summary: str
    arguments: list[str]
    conclusion: str
    sources: list[SourceReview]


@dataclass(slots=True)
class Verification:
    content: str
    source_url: str | None
    analysis: Analysis
    id: UUID
    status: VerificationStatus
    created_at: datetime

    @classmethod
    def create(
        cls,
        content: str,
        analysis: Analysis,
        source_url: str | None = None,
    ) -> Verification:
        normalized = content.strip()
        if not normalized:
            raise ValueError("Le contenu à vérifier ne peut pas être vide.")

        url = source_url.strip() if source_url else None
        if url == "":
            url = None

        return cls(
            id=uuid4(),
            content=normalized,
            source_url=url,
            analysis=analysis,
            status=VerificationStatus.COMPLETED,
            created_at=datetime.now(timezone.utc),
        )
