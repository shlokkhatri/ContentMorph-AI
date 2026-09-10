# Gen AI Platform for Automated Content Transformation

A simple platform where an operator pastes/uploads **source content** (an article,
report, advisory, incident report, etc.), picks one or more **output types**
(LinkedIn Post, Advisory, Executive Summary, Presentation, Video Package, ...),
sets a few parameters (audience, tone, language, detail level, objective), and
clicks **Generate**. The backend sends everything to Claude in a single request
and gets back structured content for every output type selected — all from the
same source, so the results stay consistent with each other.

```
Backend:  Python (FastAPI) + PostgreSQL + Anthropic Claude API
Frontend: React (Vite)
```

---

## 1. Folder structure

```
SIH/
├── backend/
│   ├── app/
│   │   ├── main.py             FastAPI app + all API routes
│   │   ├── config.py           reads settings from environment variables
│   │   ├── database.py         SQLAlchemy + PostgreSQL connection
│   │   ├── models.py           the "generations" database table
│   │   ├── output_schemas.py   defines every supported output type
│   │   ├── ai_service.py       the only file that talks to Claude
│   │   └── file_extractor.py   turns uploaded PDF/DOCX/TXT into text
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx              main page layout + state
│   │   ├── api.js                talks to the backend
│   │   └── components/           SourceInput, OutputSelector, ParametersPanel,
│   │                              ResultsPanel, HistoryPanel
│   ├── package.json
│   └── .env.example
├── docker-compose.yml    optional: run PostgreSQL in Docker
└── README.md             this file
```

**A note on where these files live:** I built and tested this project in a
sandboxed environment, so it isn't possible for me to write files directly to
your machine's `C:\Users\AB00123\Desktop\SIH` folder. Instead, everything is
packaged as a `SIH.zip` — download it and extract it so its contents land in
`C:\Users\AB00123\Desktop\SIH` (the zip already contains the `backend/` and
`frontend/` folders at its root, so just extract it there).

---

## 2. API keys you need

**Only one is required: `ANTHROPIC_API_KEY`** (for the Claude API, which does
all the content generation).

- Get one at: https://console.anthropic.com/settings/keys
- Put it in `backend/.env` (see setup steps below). Never commit this file or
  share the key — it's already excluded via `.gitignore`.

Nothing else needs a key. Postgres uses a plain username/password you choose
yourself (defaults to `postgres` / `postgres` below). No image-generation or
video-generation API is used — "Infographic" and "Video" outputs are generated
as structured **text content** (script, layout, captions, etc.), not rendered
images/video. See [Section 7](#7-scope-notes--future-enhancements) for why,
and what you'd add later if you want actual rendered media.

---

## 3. Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+ (either installed locally, or run via Docker — see below)
- An Anthropic API key

---

## 4. Backend setup

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your .env file from the example, then edit it
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
```

Open `backend/.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...your-real-key...
CLAUDE_MODEL=claude-sonnet-5
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/content_platform
FRONTEND_ORIGIN=http://localhost:5173
```

### Set up PostgreSQL

**Option A — you already have PostgreSQL installed:**

```sql
-- open psql and run:
CREATE DATABASE content_platform;
```
Make sure the username/password/port in `DATABASE_URL` match your local setup.

**Option B — use Docker instead (simplest):**

```bash
docker compose up -d
```
This starts Postgres with a database called `content_platform`, matching the
default `DATABASE_URL` in `.env.example` exactly — no changes needed.

You do **not** need to create any tables manually — the backend creates the
one table it needs (`generations`) automatically the first time it starts.

### Run the backend

```bash
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs to see the interactive API docs and confirm
it's running.

---

## 5. Frontend setup

Open a **second terminal**:

```bash
cd frontend
npm install

copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux

npm run dev
```

Open http://localhost:5173 in your browser. The dashboard should load and
fetch the list of output types from the backend automatically.

---

## 6. Using the dashboard

1. Paste text into the **Source Content** box, or upload a `.txt`, `.pdf`,
   `.docx`, or image file.
2. Tick one or more **Output Types** (LinkedIn Post, Advisory, Executive
   Summary, Presentation, Twitter/X Post, Infographic, Video).
3. Set **Audience / Tone / Language / Detail Level / Objective**.
4. Click **Generate**. Results appear in tabs, one per selected output type,
   each with a Copy button.
5. Every generation is saved to PostgreSQL and appears in the **History**
   panel on the right — click any past entry to view it again.

---

## 7. Scope notes & future enhancements

To keep the codebase small and easy to follow, a few things were deliberately
left simple or out of scope for this version:

- **Infographic / Video outputs are text blueprints, not rendered
  images/video.** They contain everything a designer or video editor needs
  (layout sections, scene-by-scene script, narration, subtitles) but don't
  call an image or video generation API. Adding that later would mean adding
  one more API key (e.g. an image generation provider) and one more function
  in `ai_service.py` — the rest of the app doesn't need to change.
- **Video file upload isn't processed yet** (it would need a
  transcription/speech-to-text step). Uploading a video currently isn't
  supported — paste a transcript or description instead. Image upload
  **is** supported: Claude reads images directly, so screenshots, scanned
  documents, and infographics work as source content today.
- **No user accounts / login.** Every generation is visible to anyone who can
  reach the dashboard. Add authentication before exposing this outside a
  trusted network.
- **One Claude call per "Generate" click**, requesting every selected output
  type in one go (via a forced tool-use call, so Claude's response is
  guaranteed valid structured JSON — no fragile text parsing). This keeps the
  system simple and consistent across outputs; splitting into parallel
  per-type calls would be faster but adds moving parts.

## 8. Adding a new output type

Everything about an output type lives in one place —
`backend/app/output_schemas.py`. To add e.g. a "Press Release" type:

1. Add a new entry to the `OUTPUT_TYPES` dictionary with its `label`,
   `instructions`, and JSON `schema`.
2. (Optional) Add a matching rendering case in
   `frontend/src/components/ResultsPanel.jsx` — if you skip this, it still
   works and falls back to a readable JSON view.

No other file needs to change — the checkbox list, the prompt sent to Claude,
and the tool schema are all built dynamically from this one dictionary.

---

## 9. Troubleshooting

| Problem | Likely cause |
|---|---|
| Frontend shows "Could not reach the backend" | Backend isn't running, or is on a different port than `VITE_API_BASE_URL` in `frontend/.env` |
| `psycopg2` / connection refused errors | PostgreSQL isn't running, or `DATABASE_URL` credentials/port are wrong |
| Generation fails with an authentication error | `ANTHROPIC_API_KEY` is missing or invalid in `backend/.env` |
| CORS error in the browser console | `FRONTEND_ORIGIN` in `backend/.env` doesn't match the URL the frontend actually runs on |
