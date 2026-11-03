from __future__ import annotations

from dataclasses import dataclass

from app.domain.entities.verification import Verification
from app.domain.repositories.fact_check_provider import FactCheckProvider
from app.domain.repositories.verification_repository import VerificationRepository


@dataclass(frozen=True, slots=True)
class CreateVerificationCommand:
    content: str
    source_url: str | None = None


class CreateVerificationUseCase:
    def __init__(
        self,
        repository: VerificationRepository,
        fact_check_provider: FactCheckProvider,
    ) -> None:
        self._repository = repository
        self._fact_check_provider = fact_check_provider

    def execute(self, command: CreateVerificationCommand) -> Verification:
        content = command.content.strip()
        if not content:
            raise ValueError("Le contenu à vérifier ne peut pas être vide.")
        analysis = self._fact_check_provider.analyze(content)
        verification = Verification.create(
            content=command.content,
            source_url=command.source_url,
            analysis=analysis,
        )
        return self._repository.add(verification)
