from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from app.domain.entities.verification import Analysis, SourceReview, Verdict
from app.domain.repositories.fact_check_provider import (
    FactCheckProvider,
    FactCheckProviderError,
)

API_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"


def _verdict_for_rating(rating: str) -> Verdict:
    normalized = rating.strip().casefold()
    known_ratings = {
        "true": Verdict.TRUE,
        "vrai": Verdict.TRUE,
        "mostly true": Verdict.MOSTLY_TRUE,
        "mostly-true": Verdict.MOSTLY_TRUE,
        "plutôt vrai": Verdict.MOSTLY_TRUE,
        "partly true": Verdict.PARTIALLY_TRUE,
        "partially true": Verdict.PARTIALLY_TRUE,
        "half true": Verdict.PARTIALLY_TRUE,
        "partiellement vrai": Verdict.PARTIALLY_TRUE,
        "misleading": Verdict.MISLEADING,
        "trompeur": Verdict.MISLEADING,
        "false": Verdict.FALSE,
        "faux": Verdict.FALSE,
    }
    return known_ratings.get(normalized, Verdict.UNVERIFIABLE)


class GoogleFactCheckProvider(FactCheckProvider):
    def __init__(self, api_key: str | None) -> None:
        self._api_key = api_key

    def analyze(self, content: str) -> Analysis:
        if not self._api_key:
            return self._unverifiable(
                "Aucun fournisseur de fact-checking n'est configuré. "
                "Aucune source externe n'a été consultée."
            )

        query = urlencode({"query": content, "key": self._api_key})
        try:
            with urlopen(f"{API_URL}?{query}", timeout=8) as response:
                payload = json.loads(response.read())
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise FactCheckProviderError(
                "Le service de vérification des faits est indisponible."
            ) from exc

        if not isinstance(payload, dict):
            raise FactCheckProviderError(
                "Le service de vérification a renvoyé une réponse invalide."
            )
        claims = payload.get("claims", [])
        if not isinstance(claims, list):
            raise FactCheckProviderError(
                "Le service de vérification a renvoyé une réponse invalide."
            )

        sources: list[SourceReview] = []
        verdicts: list[Verdict] = []
        arguments: list[str] = []
        for claim in claims:
            if not isinstance(claim, dict):
                continue
            reviews = claim.get("claimReview", [])
            if not isinstance(reviews, list):
                continue
            for review in reviews:
                if not isinstance(review, dict):
                    continue
                publisher = review.get("publisher") or {}
                if not isinstance(publisher, dict):
                    publisher = {}
                rating = review.get("textualRating")
                title = review.get("title")
                url = review.get("url")
                if not isinstance(url, str) or not url.startswith(("https://", "http://")):
                    continue
                if not isinstance(rating, str):
                    rating = "Évaluation non fournie"
                if not isinstance(title, str):
                    title = claim.get("text", "Évaluation publiée")
                if not isinstance(title, str):
                    title = "Évaluation publiée"
                name = publisher.get("name")
                if not isinstance(name, str) or not name.strip():
                    name = "Éditeur non précisé"
                date = review.get("reviewDate")
                if not isinstance(date, str):
                    date = None
                sources.append(
                    SourceReview(
                        name=name,
                        url=url,
                        date=date,
                        position=rating,
                        evidence=title,
                    )
                )
                verdicts.append(_verdict_for_rating(rating))
                arguments.append(f"{name} : {rating} — {title}")

        if not sources:
            return self._unverifiable(
                "Aucune évaluation éditoriale correspondante n'a été trouvée."
            )

        unique_verdicts = set(verdicts)
        verdict = (
            next(iter(unique_verdicts))
            if len(unique_verdicts) == 1
            else Verdict.UNVERIFIABLE
        )
        if verdict == Verdict.UNVERIFIABLE:
            conclusion = (
                "Les sources ne permettent pas d'établir un verdict convergent."
            )
        else:
            conclusion = (
                f"Les évaluations consultées convergent vers "
                f"« {sources[0].position} »."
            )

        return Analysis(
            reliability_score=None,
            confidence_score=None,
            verdict=verdict,
            summary=(
                f"{len(sources)} évaluation(s) éditoriale(s) correspondante(s) "
                "ont été trouvée(s). Le service ne fournit pas de score calibré."
            ),
            arguments=arguments,
            conclusion=conclusion,
            sources=sources,
        )

    @staticmethod
    def _unverifiable(reason: str) -> Analysis:
        return Analysis(
            reliability_score=None,
            confidence_score=None,
            verdict=Verdict.UNVERIFIABLE,
            summary=reason,
            arguments=[],
            conclusion=(
                "Les éléments disponibles ne suffisent pas à établir la fiabilité "
                "de cette information."
            ),
            sources=[],
        )
