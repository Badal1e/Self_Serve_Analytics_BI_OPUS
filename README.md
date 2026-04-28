<div align="center">

# ⚡ Self-Serve Analytics BI - Internal Engineering Handoff

### Enterprise-Grade, AI-Powered Business Intelligence Platform

*This document serves as the primary technical reference, teammate onboarding guide, and architectural walkthrough for the Self-Serve Analytics BI platform.*

---

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![DuckDB](https://img.shields.io/badge/DuckDB-1.1-FFC300?style=for-the-badge&logo=duckdb&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## 1. Project Overview

**What this project is:**
Self-Serve Analytics BI is an AI-powered Natural Language to SQL (NL2SQL) platform. It allows non-technical business users to ask questions in plain English and receive instant, accurate data insights.

**What problem it solves:**
It removes the bottleneck of relying on data engineering and analytics teams for ad-hoc data requests. Instead of waiting days for a SQL report, users get answers in seconds.

**What the product does:**
- Translates natural language questions into complex, multi-table SQL queries.
- Executes queries against an analytical database (DuckDB).
- Automatically selects the best chart type to visualize the results.
- Synthesizes a natural language answer explaining the data.
- Allows one-click export of data and charts into PDF and Excel reports.

**High-level system purpose:**
To provide a secure, auditable, and highly accurate internal analytics tool that operates safely within enterprise governance constraints.

---

## 2. Tech Stack

### Full Backend Stack
- **Framework:** FastAPI (0.115) + Uvicorn
- **Language:** Python 3.11+
- **Database (App Metadata):** SQLite (via SQLAlchemy 2.0)
- **Migrations:** Alembic
- **API Validation:** Pydantic v2

### Full Frontend Stack
- **Framework:** Angular 21
- **Language:** TypeScript
- **Styling:** SCSS, Angular Material, Glassmorphism UI
- **Routing:** Angular Router (Standalone Components)

### Database / Data Layer
- **Analytical Engine:** DuckDB (In-Memory / File-based for fast OLAP queries)
- **Data Manipulation:** Pandas, NumPy

### LLM / AI Stack
- **Model:** OpenAI GPT-4o (`openai` SDK)
- **Vector Search / RAG:** FAISS (CPU) + `sentence-transformers` for schema retrieval

### Charting Stack
- **Generation:** Altair (Python)
- **Conversion:** `vl-convert-python`
- **Frontend Rendering:** Vega / Vega-Lite (`vega`, `vega-embed`)

### Export Stack
- **PDF Generation:** ReportLab
- **Excel Generation:** openpyxl
- **Templating:** Jinja2

### Auth Stack
- **Tokens:** JWT via `python-jose`
- **Hashing:** bcrypt via `passlib`

---

## 3. Codebase Structure

### Full Project Folder Structure
```text
Self_Serve_Analytics_BI/
├── backend/          # Python/FastAPI Backend API
├── frontend/         # Angular 21 Frontend Client
└── docs/             # Additional architecture and developer guides
```

### Backend Folder Structure (`/backend`)
- **`app/`**: Core application logic.
  - **`core/`**: Config (`config.py`), DB setup, security rules, prompt templates.
  - **`integrations/`**: External services (LLM Client, Vector Store connection).
  - **`middleware/`**: Request middleware (e.g., Audit Logging).
  - **`models/`**: SQLAlchemy DB models (Users, QueryLog, Glossary, etc.).
  - **`repositories/`**: Data access layer abstracts DB queries.
  - **`routers/`**: FastAPI route controllers (Auth, Queries, Export, Feedback).
  - **`schemas/`**: Pydantic models for request/response validation.
  - **`services/`**: Business logic layer (Pipeline, NL2SQL, Chart generation).
  - **`main.py`**: The FastAPI entrypoint and app initialization.
- **`alembic/`**: Database migration scripts.
- **`seed/`**: Synthetic data generators for `users` and `payments` tables.
- **`requirements.txt`**: Python dependencies.

### Frontend Folder Structure (`/frontend/src/app`)
- **`core/`**: Singletons and core application logic.
  - **`auth/`**: Auth guards and token management.
  - **`interceptors/`**: HTTP interceptors (adds JWT to requests, handles 401s).
  - **`services/`**: API communication services (`ApiService`, `AuthService`).
  - **`models/`**: TypeScript interfaces mimicking backend Pydantic schemas.
- **`features/`**: The main page components (lazy-loaded).
  - **`auth/`**: Login and Registration UI.
  - **`dashboard/`**: The main chat/query interface and results rendering.
  - **`catalog/`**: Data catalog view.
  - **`glossary/`**: Business terminology management.
  - **`history/`**: Past query logs.
- **`shared/`**: Reusable UI components, pipes, and directives.

---

## 4. Component Overview

### Backend Components
- **Routers (`backend/app/routers/`)**: 
  - `queries.py`: The heart of the app. Takes user questions and kicks off the processing pipeline.
  - `auth.py`: Handles `/token`, `/register`, and `/me`.
  - `export.py`: Handles `/pdf` and `/excel` generation routes.
- **Services (`backend/app/services/`)**:
  - `pipeline_service.py`: The orchestrator. It sequentially calls all other services to turn a question into a final answer.
  - `nl2sql_service.py`: Prompts the LLM to generate SQL based on schema context.
  - `sql_execution_service.py`: Executes the generated SQL safely against DuckDB.
  - `chart_service.py`: Uses Altair to generate Vega-lite specifications based on the dataframe.
  - `export_service.py`: Formats the data and chart specs into downloadable files.
  - `schema_retrieval_service.py`: Uses FAISS to find the most relevant tables/columns for a given query.

### Frontend Components
- **`dashboard` (Feature)**: The primary view. It holds the input bar, displays the conversational history, and renders the `vega-embed` charts.
- **`auth` (Feature)**: Handles JWT acquisition and local storage.
- **`ApiService` (Core)**: Strongly-typed wrapper around Angular's `HttpClient` for talking to FastAPI.

---

## 5. Architecture Overview

### High-Level Architecture
The system uses a classic decoupled client-server architecture. The Angular frontend acts as an SPA, communicating via REST over HTTP to the FastAPI backend.

### Data Flow & Request Flow
1. **Frontend Request**: The user submits a query on the UI. The Angular `ApiService` attaches the JWT (via interceptor) and sends a POST to `/api/v1/queries`.
2. **Backend Processing**: The router passes the query to the `PipelineService`.
3. **AI Execution**: The backend uses local vector search to find relevant schemas, injects them into an OpenAI prompt, and gets SQL back.
4. **Data Execution**: The SQL is run against the DuckDB instance.
5. **Response Formatting**: Results are combined with a chart specification and a synthesized answer, logged to the Audit DB, and returned as a JSON response.
6. **Frontend Rendering**: Angular receives the payload, renders the data table, and uses Vega to draw the chart.

---

## 6. End-to-End Query Flow

When a user asks: *"What is the revenue by tier?"*

1. **Frontend Input**: User hits "Ask". Angular shows a loading state.
2. **Auth**: The HTTP Interceptor attaches the `Authorization: Bearer <token>` header.
3. **API Request**: `POST /api/v1/queries` is hit.
4. **Backend Route**: `queries.py` authenticates the user and instantiates `PipelineService`.
5. **Schema Retrieval**: `SchemaRetrievalService` uses FAISS vector search to find that the `users` and `payments` tables are relevant to "revenue" and "tier".
6. **NL2SQL**: `NL2SQLService` sends the question, the schema, and glossary definitions to GPT-4o. GPT returns a SQL query.
7. **Execution**: `SQLExecutionService` runs the SQL in DuckDB and gets a Pandas DataFrame.
8. **Chart Generation**: `ChartService` looks at the DataFrame (two columns: string tier, numeric revenue) and decides a Bar Chart is best. It generates a Vega spec.
9. **Synthesis**: `AnswerSynthesisService` asks GPT to explain the DataFrame in one sentence.
10. **Response**: A massive `QueryResponse` JSON object is sent back containing the SQL, the data, the chart spec, and the text answer.
11. **Frontend Rendering**: The Dashboard component updates. `vega-embed` paints the chart.
12. **Export**: The user can now click "Export PDF". The frontend sends the query ID to `/export/pdf`. The backend rebuilds the PDF from the logged data and returns a binary file.

---

## 7. Authentication Flow

- **Register**: `POST /auth/register`. Backend hashes the password using bcrypt and saves the User model to SQLite.
- **Login**: `POST /auth/token`. User provides OAuth2 form data (username/password). Backend verifies the hash and uses `python-jose` to sign a JWT using the `SECRET_KEY`.
- **Token Usage**: Angular saves the JWT to `localStorage`. The `AuthInterceptor` automatically adds `Bearer <token>` to all outgoing requests to `/api/v1/*`.
- **Protected Routes**: In FastAPI, `Depends(get_current_user)` requires a valid JWT. If missing or expired, it returns 401. Angular intercepts 401s and redirects to the Login page.

---

## 8. Chart Flow

1. **How chart type is decided**: Inside `ChartService.decide_chart_type()`, the backend analyzes the DataFrame's dtypes (numeric, datetime, categorical). For example, if it sees a datetime column and a numeric column, it picks `line`. For categorical and numeric, `bar` or `pie`.
2. **How chart data is generated**: `ChartService.generate_chart()` uses Altair to build the chart definition mapped to the DataFrame columns. It outputs a JSON dictionary representing a Vega-Lite specification.
3. **How frontend renders**: The frontend receives this JSON. The Angular template uses a specific chart component that calls `vegaEmbed('#container', chartSpec)`.
4. **Exporting charts**: During PDF export, the backend uses `vl-convert-python` to turn that same Altair JSON spec into a static PNG image, which is then embedded into the ReportLab PDF.

---

## 9. Export Flow

1. **Trigger**: User clicks Export on the frontend.
2. **Request**: `GET /api/v1/export/pdf?query_id=123`
3. **Backend Retrieval**: `export.py` router looks up the `QueryLog` in the database by ID to get the cached data, SQL, and chart spec.
4. **PDF Generation**: `ExportService.export_to_pdf()` uses ReportLab. It builds a document containing:
   - The original question and answer.
   - The generated SQL.
   - The PNG version of the chart (converted via `vl-convert`).
   - A paginated data table.
5. **Excel Generation**: `ExportService.export_to_excel()` uses `openpyxl` to write the Pandas DataFrame to a sheet, applying formatting to headers.
6. **Response**: The API returns a `StreamingResponse` or `FileResponse` with the appropriate `Content-Disposition` header so the browser downloads the file.

---

## 10. Test Cases / Validation Guide

When onboarding or verifying changes, teammates should run through these manual tests:

### 1. Auth & Access
- **Register/Login**: Create a new account. Log out. Log back in. Ensure tokens are stored.
- **Invalid Token**: Manually delete the token from `localStorage` and try to run a query. Ensure you are booted to the login screen.

### 2. Query Execution
- **Simple Query**: *"Count total users"* -> Should return a single number, no chart.
- **Complex Query**: *"What is the revenue by subscription tier for users in the technology industry?"* -> Should successfully execute a JOIN between `users` and `payments`.
- **Empty State**: *"Show me payments from the year 2099"* -> Should safely return 0 rows and not crash the UI.
- **Failure Case**: Ask nonsense ("*asdfasdf*"). Ensure the UI shows a graceful error state (Confidence Score 0, Answer text shows error) instead of a white screen.

### 3. Charts & Export
- **Chart Validation**: Ask for a time-series ("*Revenue by month*") and ensure a Line chart is rendered.
- **Export Validation**: Run a query. Click "Export PDF". Open the PDF and verify the chart image and data table are both present and legible.

---

## 11. Code Walkthrough (Where to Start)

If you are new to the codebase, read files in this order to build your mental model:

1. **`backend/main.py`**: See how the FastAPI app is initialized, how middleware is attached, and how routers are included.
2. **`backend/app/routers/queries.py`**: This is the primary entrypoint for the core feature.
3. **`backend/app/services/pipeline_service.py`**: **CRITICAL FILE.** Read the `run()` method top-to-bottom. It reads like a book and outlines the exact 14-step process of answering a query.
4. **`backend/app/services/nl2sql_service.py`**: Look at the prompts sent to OpenAI.
5. **`backend/app/services/sql_execution_service.py`**: See how DuckDB is queried.
6. **`frontend/src/app/features/dashboard/dashboard.component.ts`**: See how the frontend calls the API and manages the conversational state array.

---

## 12. Quickstart & Setup (GitHub-Ready)

### Prerequisites
- Python **3.11+**
- Node.js **20+** & npm
- An **OpenAI API Key**

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
```

Create `.env` in `backend/`:
```env
OPENAI_API_KEY="sk-..."
SECRET_KEY="your-super-secret-jwt-key-change-me"
APP_NAME="Self-Serve Analytics BI"
APP_VERSION="2.0.0"
```

### 2. Seed the Database
```bash
# Generates realistic synthetic data into DuckDB
python -m seed.seed_data
```

### 3. Start Backend
```bash
uvicorn app.main:app --reload --port 8000
# API Docs available at http://localhost:8000/api/docs
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run start
# App available at http://localhost:4200
```

### Sample Queries to Try:
- *"What is the total revenue by subscription tier?"*
- *"Show me the payment failure rate for Enterprise users."*
- *"Which country had the highest number of failed transactions last month?"*
- *"Compare average transaction value between Free and Pro tier users."*

---
*Built as an enterprise-grade analytics platform.*