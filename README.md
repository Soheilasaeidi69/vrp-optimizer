# Multi-Objective Freight Routing Optimization Tool

An interactive research software application developed by Soheila Saeidi at Florida Atlantic University.

This application provides a web-based interface for a multi-period, multi-vehicle freight transportation optimization model developed using FeLooPy. The model considers transportation costs, route-related risk, and pickup-and-delivery operations.

The tool allows users to configure model scenarios, run optimization experiments, and examine computed routing solutions through an interactive dashboard.

**Researcher:** Soheila Saeidi, Florida Atlantic University

**Web application:** https://vrp-optimizer.vercel.app

# Software Overview

The software provides a web-based interface for running multi-objective freight transportation optimization experiments.

Users can configure transportation scenarios, execute the FeLooPy optimization model, and review routing solutions along with transportation cost and risk values.

The software combines a React frontend with a Python FastAPI backend for model execution and results presentation.

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
Open the Vite dev server URL - it proxies /api to localhost:8000.

