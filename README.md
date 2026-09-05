# Peblo TV Mini — Full-Stack Streaming Platform

> **Created by Harsh Kumar** | Full-Stack Platform Engineer (Python/FastAPI + React/TypeScript)  
> *Take-Home Challenge Implementation — Peblo TV Miniature Platform*

[![Build Status](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-brightgreen)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20PostgreSQL-blue)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-purple)](#)
[![Tests](https://img.shields.io/badge/Pytest-13%2F13%20Passed-success)](#)

---

## 📌 Executive Overview — What This Project Does

**Peblo TV Mini** is a full-stack streaming platform miniature designed to demonstrate end-to-end media engineering workflows:
1. **Internal CMS UI (`React + TypeScript`)**: Content editors upload show/episode metadata, manage draft vs published statuses, and upload 3-slot artwork assets (Poster 2:3, Banner 16:9, Thumbnail 16:9) with strict Pillow validation.
2. **FastAPI + PostgreSQL Backend**: Validates incoming metadata, enforces role-based access control (`EDITOR` vs `ADMIN`), runs pre-flight dataset integrity audits, and executes **atomic catalogue publishing**.
3. **Atomic Publish Pipeline**: Collapses language variants sharing a `content_group` (e.g. English + Hindi), groups content deterministically by section, and atomically writes `storage/catalogue.json` via POSIX staging files without zero-downtime or half-written state risks.
4. **Viewer Browse UI (`React + TypeScript`)**: A Netflix-style client reading exclusively from the published `catalogue.json`. Features a Hero Banner, section-grouped carousels, Season 0 Trailers tab, language variant pill switcher (`EN` / `HI`), and animated theme toggling.

```
┌─────────────────────────┐      REST API      ┌───────────────────────────────────┐
│  Internal CMS UI        │ ─────────────────► │ FastAPI Backend + PostgreSQL      │
│  (React 19 on Port 3001)│ ◄───────────────── │ (Uvicorn on Port 8000)            │
└─────────────────────────┘                    └─────────────────┬─────────────────┘
                                                                 │
                                                      Atomic File│Publish Job
                                                                 ▼
┌─────────────────────────┐    Reads Published ┌───────────────────────────────────┐
│  Viewer Browse UI       │ ◄───────────────── │ Storage Abstraction               │
│  (React 19 on Port 3000)│    catalogue.json  │ (LocalStorage / Cloudflare R2 S3) │
└─────────────────────────┘                    └───────────────────────────────────┘
```

---

## 📂 Project Structure

```
Peblo/
├── backend/                        # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                 # FastAPI App Initialization, CORS, Middleware
│   │   ├── config.py               # Pydantic BaseSettings & Environment Config
│   │   ├── database.py             # SQLAlchemy Engine & Session Configuration
│   │   ├── models.py               # DB Models (Show, Season, Episode, Artwork, PublishRun)
│   │   ├── schemas.py              # Pydantic Input/Output Schemas
│   │   ├── seed.py                 # Auto-seeding script for seed_shows.json
│   │   ├── services/
│   │   │   ├── artwork_service.py  # Pillow Image Spec & Aspect Ratio Validation
│   │   │   ├── catalog_service.py  # Atomic Catalogue Publisher & Collapse Logic
│   │   │   ├── storage_service.py  # Storage Abstraction (Local vs Cloudflare R2 S3)
│   │   │   └── validation_service.py # Pre-flight Validation Report Auditor
│   │   └── routes/
│   │       ├── admin.py            # Role-Protected Admin Routes (/publish, /validation-report)
│   │       ├── catalog.py          # Public Reader Routes (/catalog, /catalog/search)
│   │       ├── content.py          # Shows & Episodes CRUD Routes
│   │       └── health.py           # Health Diagnostic & Readiness Endpoint (/health)
│   ├── tests/                      # Automated Pytest Test Suite
│   │   ├── test_artwork.py         # Pillow image validation unit tests
│   │   ├── test_auth.py            # Role authorization tests (Editor vs Admin)
│   │   ├── test_catalog.py         # Catalog reader & composable search tests
│   │   ├── test_publish.py         # Atomic publish & collapse unit tests
│   │   └── test_validation.py      # Pre-flight validation report tests
│   └── requirements.txt            # Python Dependencies
├── cms/                            # Internal Content Management System Frontend
│   ├── src/
│   │   ├── api.ts                  # Axios API Client & Role Handler
│   │   ├── components/             # Navbar, ShowModal, EpisodeModal, ArtworkUploader, ThemeToggle
│   │   ├── pages/                  # ShowsPage, ValidationPage, HistoryPage
│   │   ├── App.tsx                 # Root Component with Role & Theme State Wire-up
│   │   └── index.css               # Styling System & Theme Tokens
│   └── package.json
├── viewer/                         # Netflix-Style Viewer Frontend Application
│   ├── src/
│   │   ├── api.ts                  # Viewer API Client (Reads /catalog)
│   │   ├── components/             # Header, HeroBanner, SectionRow, ShowCard, ShowDetailModal, FilterBar
│   │   ├── pages/                  # BrowsePage
│   │   └── index.css               # Netflix Dark/Light Theme Design System
│   └── package.json
├── storage/                        # Published Storage Directory (catalogue.json)
├── assets/                         # Reference sample artwork test files
├── docker-compose.yml              # Complete Multi-Container Stack Specification
├── .github/workflows/ci.yml        # GitHub Actions CI Workflow Specification
├── .env.example                    # Environment Variables Reference
├── seed_shows.json                 # Seed Dataset (95 episodes across 8 shows)
├── reference.json                  # Business Rules, Specs, Section & Category Constraints
└── README.md                       # Comprehensive Project Documentation
```

---

## 🚀 How to Run the Project

### Option 1: One-Command Setup with Docker Compose (Recommended)

To launch all four services (PostgreSQL, FastAPI Backend, CMS UI, Viewer UI) fully pre-seeded and integrated:

```bash
# Clone the repository & navigate to root directory
cd Peblo

# Build and start all containers in detached mode
docker-compose up --build
```

#### Live Application URLs:
- **Viewer Browse UI**: [http://localhost:3000](http://localhost:3000)
- **Internal CMS UI**: [http://localhost:3001](http://localhost:3001)
- **FastAPI Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Health Diagnostics**: [http://localhost:8000/health](http://localhost:8000/health)
- **Published Catalogue JSON**: [http://localhost:8000/catalog](http://localhost:8000/catalog)

---

### Option 2: Local Manual Development Setup

#### 1. Backend (FastAPI + SQLite / PostgreSQL)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment & activate
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations / seed script
python -m app.seed

# Start FastAPI Uvicorn server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Internal CMS UI (React 19 + Vite)
```bash
cd cms
npm install
npm run dev -- --port 3001
```

#### 3. Viewer Browse UI (React 19 + Vite)
```bash
cd viewer
npm install
npm run dev -- --port 3000
```

---

## 🧪 Running Automated Tests

The backend includes a comprehensive **Pytest** test suite covering Pillow artwork validation, role authorization, atomic publishing, content group collapsing, and search filtering:

```bash
# Run complete backend pytest suite
python -m pytest backend/tests -v
```

**Test Execution Summary**:
- `test_valid_poster_artwork`: PASSED
- `test_valid_banner_artwork`: PASSED
- `test_invalid_aspect_ratio_rejected`: PASSED
- `test_oversized_file_rejected`: PASSED
- `test_editor_blocked_from_publishing`: PASSED
- `test_admin_allowed_publish_route_check`: PASSED
- `test_validation_report_accessible_by_editor`: PASSED
- `test_catalog_search_filters`: PASSED
- `test_publish_blocked_when_validation_fails`: PASSED
- `test_successful_atomic_publish`: PASSED
- `test_validation_report_flags_published_without_section`: PASSED
- `test_validation_report_flags_published_episode_missing_duration`: PASSED
- `test_validation_report_flags_duplicate_content_group`: PASSED

`13 passed in 1.35 seconds` (100% Pass Rate).

---

## 📊 Part E — Technical Breakdown & Written Reasoning

### 1. How Publishing Was Made Atomic (and Mid-Publish Crash Isolation)
* **Strategy**: Publishing compiles the published catalogue structure and writes it to a temporary staging file (`storage/catalogue.json.tmp`). Disk sync is forced (`os.fsync`), and POSIX/Windows `os.replace` executes an atomic file rename over `storage/catalogue.json`. Audit logs are recorded in the PostgreSQL database inside a transaction *after* successful file replacement.
* **If Process Dies Mid-Publish**:
  - If the process terminates or crashes prior to `os.replace`, `storage/catalogue.json` remains completely untouched. Viewers reading `GET /catalog` continue receiving the previous 100% valid catalogue file without experiencing half-written or corrupted JSON states.
  - The dangling `.tmp` file is safely overwritten on the next publish execution.
  - Audit logging occurs post-swap, ensuring DB audit logs strictly reflect verified file replacements.

---

### 2. Storage Abstraction: Moving from Local Disk to Cloudflare R2
* **Design**: Storage operations are decoupled behind a polymorphic `StorageProvider` abstract base class defining `save()`, `atomic_write()`, `read()`, and `exists()` methods.
* **To Move from Local Disk to Cloudflare R2 / AWS S3**:
  1. Set `STORAGE_PROVIDER=s3` in your `.env` file.
  2. Populate `S3_ENDPOINT_URL`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
  3. Zero application code changes are required! `S3StorageProvider` uses Boto3 S3 `PutObject` operations to execute atomic object overwrites.

---

### 3. Search Implementation & Scalability Analysis
* **Implementation**: `GET /catalog/search?q=&category=&language=&section=` operates over the published catalogue structure using composable AND filters. It performs case-insensitive substring matching on show titles, episode titles, and categories, filtering language variants and section groups dynamically.
* **Where It Stops Working**: In-memory / file-based search over a single JSON blob starts degrading around **50,000 shows (~10MB JSON size)** due to memory allocation overhead per request and CPU serialization time.
* **What We Would Do Next**:
  - **Phase 1 (10k – 100k shows)**: Implement PostgreSQL full-text search with `pg_trgm` trigram indexing over normal DB tables, or push search execution to Cloudflare Workers / Edge KV cache.
  - **Phase 2 (100k+ shows)**: Deploy a dedicated search index engine like **Meilisearch** or **Elasticsearch** synchronized via CDC (Change Data Capture) DB triggers.

---

### 4. Why Serve a Pre-Published Catalogue File vs Live Database Queries?
* **Why Serve Pre-Published File**:
  1. **Performance**: Serves in <5ms directly from memory or CDN edge, eliminating database connection pooling and complex multi-table SQL joins per viewer request.
  2. **Isolation**: Viewer traffic surges (e.g. millions of kids watching after school) put **0 query load** on the relational CMS database.
  3. **Guaranteed Consistency**: Viewers never see partially edited shows or episodes whose artwork upload is incomplete.
* **Where That Choice Bites You**:
  - **Publish Latency / Eventual Consistency**: Content updates made in the CMS are not visible to viewers until an Admin explicitly triggers a publish run.
  - **File Size Payload**: As catalogue grows to tens of thousands of shows, transferring the full catalogue payload in a single initial request becomes heavy for mobile clients (mitigated by paginated section endpoints or client-side caching).

---

### 5. What We Skipped & Why (Scope Management)
- **HLS/DASH Video Streaming Transcoding**: Omitted actual video transcoding pipeline (FFmpeg) as the prompt focuses on metadata catalog, artwork validation, and publishing mechanics.
- **Complex Multi-Tenant SSO / OAuth**: Implemented explicit role enforcement (`editor` vs `admin`) with headers/JWT tokens instead of setting up a full Keycloak/Auth0 server to keep docker setup fast.

---

### 6. AI Tool Usage & Judgment Notes
- **Tools Used**: Antigravity AI pair programming assistant (Gemini 3.6 Flash).
- **Where Output Was Accepted**: Scaffolding initial Pydantic schemas, generating repetitive CSS design tokens, writing boilerplate pytest assertion fixtures.
- **Where Output Was Rejected / Modified**:
  - AI initially suggested overwriting `catalogue.json` directly using standard open/write logic. **Rejected** in favor of `os.replace` atomic staging files to satisfy zero half-written state requirement.
  - AI initially created hard unique constraints on `(content_group, language)` at SQL level. **Modified** to handle constraint checks at application level so seed dataset anomalies could be stored in DB and surfaced via `/admin/validation-report`.

---

## ⏱️ Time Spent Breakdown

| Part | Description | Time Spent |
| :--- | :--- | :--- |
| **Part A** | Backend API, Postgres schema, artwork Pillow validator, atomic publish, role auth | 2.5 Hours |
| **Part B** | Internal CMS UI, artwork dropzone with live preview, publish validation dashboard | 2.0 Hours |
| **Part C** | Viewer Browse UI, Netflix layout, hero banner, season 0 trailers, language toggle | 2.0 Hours |
| **Part D** | Docker compose orchestration, GitHub Actions CI workflow, health check, secrets strategy | 1.0 Hour |
| **Part E** | Written technical reasoning, trade-offs, and README documentation | 1.0 Hour |
| **Total** | | **8.5 Hours** |

---

## 🔍 Validation Report Findings in Seed Data

When seeding `seed_shows.json`, `/admin/validation-report` automatically surfaces the deliberate seed dataset anomalies:
1. `ep_0036` (Discover India with Moti): Published episode missing required artwork (poster, banner, thumbnail).
2. `ep_0093` & `ep_0094`: Published episodes missing poster & banner artwork.
3. `ep_9001` vs `ep_0004`: Duplicate `(content_group: 'motis-many-lives-s01e02', language: 'hi')` collision.
4. `Rhyme Rangers`: Published show missing required section assignment.

---

## 👤 Author & License

**Created with ❤️ by Harsh Kumar**  
*Full-Stack Platform Engineer (Python/FastAPI + React/TypeScript)*
