from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from . import jobs
from .model_runner import run_solve_sync
from .schemas import RunRequest, RunSummary, RunResult, RunStatus, ObjectiveResult

app = FastAPI(title="Routing Optimization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _execute(run_id: str, params: dict, timeout: int):
    jobs.update_run(run_id, status="running")
    result = run_solve_sync(params, timeout_seconds=timeout)
    from datetime import datetime, timezone
    jobs.update_run(
        run_id,
        status=result.get("status", "failed"),
        result=result,
        finished_at=datetime.now(timezone.utc),
    )


@app.post("/api/runs", response_model=RunSummary)
def create_run(req: RunRequest, background_tasks: BackgroundTasks):
    params = req.parameters.model_dump()
    run = jobs.create_run(req.name, params)
    background_tasks.add_task(_execute, run["id"], params, params.get("time_limit_seconds", 300))
    return RunSummary(id=run["id"], name=run["name"], status=RunStatus.queued, created_at=run["created_at"])


@app.get("/api/runs", response_model=list[RunSummary])
def list_runs():
    return [
        RunSummary(id=r["id"], name=r["name"], status=r["status"], created_at=r["created_at"], finished_at=r["finished_at"])
        for r in jobs.list_runs()
    ]


@app.get("/api/runs/{run_id}", response_model=RunSummary)
def get_run_status(run_id: str):
    run = jobs.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return RunSummary(id=run["id"], name=run["name"], status=run["status"], created_at=run["created_at"], finished_at=run["finished_at"])


@app.get("/api/runs/{run_id}/result", response_model=RunResult)
def get_run_result(run_id: str):
    run = jobs.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    r = run.get("result") or {}
    return RunResult(
        id=run["id"],
        status=run["status"],
        objectives=ObjectiveResult(**r.get("objectives", {})) if r.get("objectives") else None,
        routes=r.get("routes"),
        inventory_levels=r.get("inventory_levels"),
        solve_time_seconds=r.get("solve_time_seconds"),
        error_message=r.get("error_message"),
        debug=r.get("debug"),
    )