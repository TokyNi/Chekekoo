from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.entities.verification import Analysis


class FactCheckProviderError(Exception):
    """Erreur explicite lors de l'interrogation du fournisseur de vérification."""


class FactCheckProvider(ABC):
    @abstractmethod
    def analyze(self, content: str) -> Analysis:
        raise NotImplementedError
