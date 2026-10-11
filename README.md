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


