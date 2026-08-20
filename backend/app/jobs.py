"""
MVP job store, kept in memory so the scaffold runs with zero external
services. Swap this for a SQLAlchemy model backed by Postgres before
going to production with multiple users/instances - an in-memory dict
won't survive a restart or work across multiple API processes.

Suggested Postgres schema (SQLAlchemy) for that step:

    class Run(Base):
        id = Column(String, primary_key=True)
        user_id = Column(String, ForeignKey("users.id"))
        name = Column(String)
        status = Column(String)
        parameters = Column(JSON)
        result = Column(JSON, nullable=True)
        created_at = Column(DateTime)
        finished_at = Column(DateTime, nullable=True)
"""
import uuid
from datetime import datetime, timezone
from threading import Lock

_runs: dict[str, dict] = {}
_lock = Lock()


def create_run(name: str, parameters: dict) -> dict:
    run_id = str(uuid.uuid4())
    run = {
        "id": run_id,
        "name": name,
        "parameters": parameters,
        "status": "queued",
        "result": None,
        "created_at": datetime.now(timezone.utc),
        "finished_at": None,
    }
    with _lock:
        _runs[run_id] = run
    return run


def update_run(run_id: str, **fields) -> None:
    with _lock:
        if run_id in _runs:
            _runs[run_id].update(fields)


def get_run(run_id: str) -> dict | None:
    with _lock:
        return _runs.get(run_id)


def list_runs() -> list[dict]:
    with _lock:
        return sorted(_runs.values(), key=lambda r: r["created_at"], reverse=True)
