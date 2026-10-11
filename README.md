# Multi-Objective Freight Routing Optimization Tool

An interactive research software application developed by Soheila Saeidi at Florida Atlantic University.

This application provides a web-based interface for a multi-period, multi-vehicle freight transportation optimization model developed using FeLooPy. The model considers transportation costs, route-related risk, and pickup-and-delivery operations.

The tool allows users to configure model scenarios, run optimization experiments, and examine computed routing solutions through an interactive dashboard.

**Researcher:** Soheila Saeidi, Florida Atlantic University

**Web application:** https://vrp-optimizer.vercel.app

## How it fits together

```
Browser --> React frontend --> FastAPI backend --> (queue) --> solver worker --> Postgres
                                                                       |
                                                              runs your FeLooPy model
```

- **frontend/** - React + Vite app. A form for scenario parameters
  (alpha/beta node counts, fleet size, planning periods, etc.), and a
  results dashboard (KPIs, an inventory chart via Recharts, a route
  table).
- **backend/app/model_template.py** - your original script, parameterized.
  Everything that was a hardcoded constant (`alpha = 3`, cost ranges,
  etc.) now comes from a JSON params file. Emits a JSON results file
  instead of a printed report.
- **backend/app/model_runner.py** - runs `model_template.py` as an
  isolated subprocess per solve. This matters because FeLooPy's
  `data_toolkit` is global/stateful - two concurrent solves in one
  Python process would collide.
- **backend/app/main.py** - FastAPI app exposing `POST /api/runs`,
  `GET /api/runs/{id}`, `GET /api/runs/{id}/result`.
- **backend/app/jobs.py** - in-memory run store for the MVP. Swap for
  the Postgres model sketched in that file once you need runs to
  survive a restart or work across multiple API instances.

## Run it locally

Backend:
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite dev server URL - it proxies `/api` to `localhost:8000`.

## Known gap to check before relying on results

`extract_results()` in `model_template.py` assumes FeLooPy exposes
solved values via `mdl.get_obj(i)` / `mdl.get("varname")`. That's the
documented pattern, but if your installed FeLooPy version names things
differently, run one solve, inspect `dir(mdl)` after `flp.search(...)`
returns, and adjust that one function - nothing else needs to change.

## Path to a production, multi-user tool

This scaffold intentionally starts simple. To go from demo to
production for external users:

1. **Move solving off the request thread.** Stand up Redis + Celery
   (stubbed in `model_runner.py`) so a 10-minute MILP solve doesn't
   tie up an API worker. The frontend already polls for status, so
   this is a backend-only change.
2. **Add Postgres and real user accounts.** Replace `jobs.py` with the
   SQLAlchemy model sketched in its docstring; add auth (FastAPI has
   good support for OAuth2/JWT) so each client only sees their own
   runs.
3. **Rate-limit and time-box solves.** Exact MILP solving can run
   arbitrarily long on larger instances - keep the `time_limit_seconds`
   cap and consider exposing "exact" vs. a faster heuristic method as
   a tradeoff the user picks in the form.
4. **Deploy.** Containerize backend and worker separately (Dockerfile
   stub below); host the frontend as a static build (Vercel/Netlify/S3)
   pointing `VITE`'s API base at your backend's domain.

Minimal `docker-compose.yml` to get backend + Redis running together:

```yaml
services:
  redis:
    image: redis:7
  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    ports: ["8000:8000"]
    environment:
      - REDIS_URL=redis://redis:6379/0
  worker:
    build: ./backend
    command: celery -A app.model_runner.celery_app worker --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
```
(Uncomment the Celery block in `model_runner.py` and wire `main.py`'s
`create_run` to call `.delay()` instead of `BackgroundTasks` when you
get here.)
