from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.verification import Verification


class VerificationRepository(ABC):
    @abstractmethod
    def add(self, verification: Verification) -> Verification:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, verification_id: UUID) -> Verification | None:
        raise NotImplementedError

    @abstractmethod
    def list_recent(self, limit: int = 20) -> list[Verification]:
        raise NotImplementedError
