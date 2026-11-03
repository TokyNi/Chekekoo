from __future__ import annotations

from uuid import UUID

from app.domain.entities.verification import Verification
from app.domain.repositories.verification_repository import VerificationRepository


class InMemoryVerificationRepository(VerificationRepository):
    """Temporary adapter. PostgreSQL will replace this in a later step."""

    def __init__(self) -> None:
        self._items: dict[UUID, Verification] = {}

    def add(self, verification: Verification) -> Verification:
        self._items[verification.id] = verification
        return verification

    def get_by_id(self, verification_id: UUID) -> Verification | None:
        return self._items.get(verification_id)

    def list_recent(self, limit: int = 20) -> list[Verification]:
        return sorted(
            self._items.values(),
            key=lambda item: item.created_at,
            reverse=True,
        )[:limit]
