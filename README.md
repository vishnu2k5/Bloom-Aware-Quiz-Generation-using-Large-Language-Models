# Bloom Quiz Research Platform (v2):

End-to-end project for generating and evaluating Bloom's Taxonomy MCQs using multiple LLM providers (Groq, Gemini, Ollama, OpenRouter), with analytics, history, and optional Google Drive export.

## Project Structure

```
bloom_v2/
  backend/
    main.py                 # FastAPI app and API routes
    llm_router.py           # Provider routing (Groq/Gemini/Ollama/OpenRouter)
    prompt_engine.py        # Bloom-aware prompt construction
    bloom_classifier.py     # Question-level and quiz-level evaluation
    pdf_parser.py           # PDF text extraction and chunking
    database.py             # SQLite persistence + analytics queries
    google_drive.py         # Optional Google Drive save/export
    evaluation_logger.py    # CSV generation logs
    config.py               # Model maps, API keys, app constants
    requirements.txt

  frontend/
    src/
      App.jsx               # Main UI state and tab orchestration
      components/           # Reusable UI modules (selectors, cards, compare, etc.)
      pages/Analytics.jsx   # Analytics dashboard page
    package.json
    vite.config.js          # Dev server + /api proxy to backend
```

## Architecture

### High-Level Flow

1. User selects model/topic/Bloom level in React UI.
2. Frontend calls FastAPI endpoints under `/api/*`.
3. Backend builds Bloom-constrained prompt in `prompt_engine.py`.
4. `llm_router.py` sends request to selected provider and normalizes output.
5. `bloom_classifier.py` evaluates alignment and quality.
6. `database.py` stores sessions/scores/comparisons in SQLite.
7. Optional: `google_drive.py` uploads JSON snapshots.
8. Frontend renders generated questions, scoring, history, and analytics.

### Backend Layers

- API Layer (`main.py`)
  - Exposes status, model metadata, generation, comparison, scoring, history, analytics, and export APIs.
  - Initializes DB on startup.
  - Handles CORS for local frontend dev ports.

- LLM Layer (`llm_router.py`)
  - Resolves display model to provider model id.
  - Calls provider-specific APIs.
  - Cleans/parses LLM JSON and returns a unified response contract.

- Prompt Layer (`prompt_engine.py`)
  - Maintains strict Bloom-level templates (1-6).
  - Enforces JSON output format and MCQ constraints.

- Evaluation Layer (`bloom_classifier.py`, `evaluation_logger.py`)
  - Scores level alignment and quality.
  - Writes run-level evaluation logs to CSV.

- Data Layer (`database.py`)
  - Stores quiz sessions, per-question scores, evaluation results, and comparison runs.
  - Produces aggregate analytics for dashboard charts/tables.

- Integration Layer (`google_drive.py`, `pdf_parser.py`)
  - Optional Drive backup/export.
  - PDF ingestion as contextual grounding for question generation.

### Frontend Layers

- `App.jsx` manages main state and top-level tabs: Generate, Compare, Results, Analytics, History.
- `components/*` encapsulates selectors, upload, result cards, and comparison views.
- Axios requests use relative `/api` paths.
- `vite.config.js` proxies `/api` to `http://localhost:8000` during development.

## API Overview

- `GET /api/status` - Provider and Drive health.
- `GET /api/models` - Available model list.
- `GET /api/bloom-levels` - Bloom metadata.
- `POST /api/upload-pdf` - Extract PDF text context.
- `POST /api/generate` - Single-level quiz generation.
- `POST /api/generate/multi-level` - Multi-level generation in one run.
- `POST /api/generate/compare` - Side-by-side multi-model comparison.
- `POST /api/scores` - Save user answers.
- `POST /api/detect-bloom` - Heuristic level detection.
- `GET /api/history` and `GET /api/history/{id}` - Session history.
- `GET /api/analytics` - Dashboard aggregates.
- `GET /api/drive/status` and `POST /api/drive/export-all` - Drive integration.

## Prerequisites

- Python 3.10+ recommended
- Node.js 18+ recommended
- npm

Optional:
- Ollama for local model inference
- Google Drive service account for cloud exports

## Setup and Run

Open two terminals from the project root.

### 1) Backend (Terminal A)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

### 2) Frontend (Terminal B)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies API requests to backend.

## Provider Configuration

- API/provider settings are mapped in `backend/config.py`.
- Ensure valid keys/models for the providers you want to use.
- For Ollama, run local service separately if using local models.
- For Drive export, place service account credentials at `backend/service_account.json`.

## Typical Dev Workflow

1. Start backend.
2. Start frontend.
3. Open frontend in browser.
4. Choose model + Bloom level + topic (or upload PDF).
5. Generate quiz, answer questions, and inspect analytics/history.

## Notes

- SQLite DB is created at `backend/bloom_research.db` on first backend startup.
- Generation/evaluation CSV logs are written under `backend/evaluation_exports/`.
