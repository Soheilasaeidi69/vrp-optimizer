# Multi-Objective Freight Routing Optimization Tool

An interactive research software application developed by Soheila Saeidi at Florida Atlantic University.

This application provides a web-based interface for a multi-period, multi-vehicle freight transportation optimization model that considers transportation costs, route-related risk, and pickup-and-delivery operations. The optimization model was formulated by Soheila Saeidi and is implemented with the open-source FeLooPy library.
The tool allows users to configure model scenarios, run optimization experiments, and examine computed routing solutions through an interactive dashboard.

**Researcher:** Soheila Saeidi, Florida Atlantic University

**Web application:** https://vrp-optimizer.vercel.app

## Software Overview

The software provides a web-based interface for running multi-objective freight transportation optimization experiments.

Users can configure transportation scenarios, run the optimization model, and review routing solutions along with transportation cost and risk values.

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



