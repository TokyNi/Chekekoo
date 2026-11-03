from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Iterator
from uuid import UUID

from app.domain.entities.verification import (
    Analysis,
    SourceReview,
    Verification,
    VerificationStatus,
    Verdict,
)
from app.domain.repositories.verification_repository import VerificationRepository


class SQLiteVerificationRepository(VerificationRepository):
    def __init__(self, database_path: str) -> None:
        if database_path == ":memory:":
            self._database_path = f"file:checkeko-{id(self)}?mode=memory&cache=shared"
        else:
            self._database_path = database_path
            Path(database_path).parent.mkdir(parents=True, exist_ok=True)
        self._memory_anchor = (
            sqlite3.connect(self._database_path, uri=True)
            if database_path == ":memory:"
            else None
        )
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS verifications (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    source_url TEXT,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    analysis_json TEXT NOT NULL
                )
                """
            )

    def add(self, verification: Verification) -> Verification:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO verifications
                    (id, content, source_url, status, created_at, analysis_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    str(verification.id),
                    verification.content,
                    verification.source_url,
                    verification.status.value,
                    verification.created_at.isoformat(),
                    json.dumps(self._analysis_to_dict(verification.analysis)),
                ),
            )
        return verification

    def get_by_id(self, verification_id: UUID) -> Verification | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM verifications WHERE id = ?",
                (str(verification_id),),
            ).fetchone()
        return self._from_row(row) if row else None

    def list_recent(self, limit: int = 20) -> list[Verification]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM verifications ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [self._from_row(row) for row in rows]

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(
            self._database_path,
            uri=self._database_path.startswith("file:"),
        )
        connection.row_factory = sqlite3.Row
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    @staticmethod
    def _analysis_to_dict(analysis: Analysis) -> dict[str, object]:
        return {
            "reliability_score": analysis.reliability_score,
            "confidence_score": analysis.confidence_score,
            "verdict": analysis.verdict.value,
            "summary": analysis.summary,
            "arguments": analysis.arguments,
            "conclusion": analysis.conclusion,
            "sources": [
                {
                    "name": source.name,
                    "url": source.url,
                    "date": source.date,
                    "position": source.position,
                    "evidence": source.evidence,
                }
                for source in analysis.sources
            ],
        }

    @staticmethod
    def _from_row(row: sqlite3.Row) -> Verification:
        data = json.loads(row["analysis_json"])
        analysis = Analysis(
            reliability_score=data["reliability_score"],
            confidence_score=data["confidence_score"],
            verdict=Verdict(data["verdict"]),
            summary=data["summary"],
            arguments=data["arguments"],
            conclusion=data["conclusion"],
            sources=[SourceReview(**source) for source in data["sources"]],
        )
        return Verification(
            id=UUID(row["id"]),
            content=row["content"],
            source_url=row["source_url"],
            analysis=analysis,
            status=VerificationStatus(row["status"]),
            created_at=datetime.fromisoformat(row["created_at"]),
        )
