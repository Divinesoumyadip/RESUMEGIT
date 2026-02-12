# ResumeGod V4.0 — Career Operating System

> A swarm of AI agents working 24/7 to get you hired.

```
┌─────────────────────────────────────────────────────────┐
│                  THE ORCHESTRATOR                        │
│         (GPT-4o function-call router)                    │
└─────┬──────┬──────┬──────┬──────┬──────────────────────┘
      │      │      │      │      │
   ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──────┐
   │ATS │ │Spy │ │Int │ │Gho │ │Aff │ │Roast │
   │Sent│ │glas│ │view│ │stwr│ │ilia│ │ ter  │
   │inel│ │  s │ │  er│ │iter│ │  te│ │      │
   └────┘ └────┘ └────┘ └────┘ └────┘ └──────┘
```

## Agent Squad

| Agent | Codename | Mission |
|-------|----------|---------|
| **ATS Sentinel** | Resume Architect | Parses PDF, injects keywords, compiles LaTeX PDF |
| **Spyglass** | Tracker Agent | Logs every recruiter view — IP, location, UA |
| **Interviewer** | Voice/Chat Agent | 5 killer questions + grades your answers 0-10 |
| **Ghostwriter** | Viral Marketing | Writes your LinkedIn "humble brag" post |
| **Affiliate** | Upskilling Agent | Matches skill gaps to courses with affiliate links |
| **Roaster** | Brutal Truth Mode | No-filter resume critique (opt-in only) |

## Tech Stack

```
Frontend:   Next.js 14 (App Router) · Tailwind CSS · Framer Motion · Lucide React
Backend:    FastAPI · Uvicorn · Python 3.11
AI Engine:  OpenAI GPT-4o (tool_calls + JSON mode)
Database:   SQLite (dev) / PostgreSQL (prod) via SQLAlchemy
PDF:        LaTeX (pdflatex) + Jinja2 (<<>> delimiters) + Jake's Resume template
Tracking:   1×1 GIF pixel embedded in PDF metadata
DevOps:     Docker multi-stage build (texlive-latex-extra included)
```

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- OpenAI API key with GPT-4o access

### 2. Clone & Configure

```bash
git clone <repo>
cd resumegod
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY
```

### 3. Launch the Swarm

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| **Mission Control** (Frontend) | http://localhost:3000 |
| **API Gateway** (Backend) | http://localhost:8000 |
| **API Docs** (Swagger) | http://localhost:8000/docs |

### 4. Local Development (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Reference

### ATS Sentinel
```http
POST /api/agents/ats/optimize
Content-Type: multipart/form-data

file:            <PDF file>
job_description: <JD text>
job_title:       "Senior Software Engineer"
company:         "Stripe"
user_id:         "user-uuid"
```

**Response:**
```json
{
  "success": true,
  "resume_id": "uuid",
  "ats_score_before": 42.0,
  "ats_score_after": 87.0,
  "score_improvement": 45.0,
  "gap_analysis": { ... },
  "pdf_url": "http://localhost:8000/pdfs/uuid.pdf",
  "tracking_url": "http://localhost:8000/api/track/token"
}
```

### Spyglass Tracking
```http
GET /api/track/{token}        → 1×1 GIF (logs the view)
GET /api/agents/spyglass/{resume_id}  → Analytics dashboard data
```

### Interviewer
```http
POST /api/agents/interview/questions   → Generate 5 questions
POST /api/agents/interview/grade       → Grade user answer
```

### Ghostwriter
```http
POST /api/agents/ghostwriter/linkedin  → 3 LinkedIn post variations
```

### Affiliate
```http
POST /api/agents/affiliate/courses     → Personalised course recommendations
```

### Career Companion (WebSocket)
```
ws://localhost:8000/ws/chat/{user_id}

Send: { "message": "Start a mock interview" }
Recv: { "type": "routing", "agent": "interview" }
Recv: { "type": "message", "agent": "interview", "content": "..." }
```

## Architecture Deep Dive

### LaTeX PDF Generation

The ATS Sentinel uses Jinja2 with `<< >>` delimiters (not `{{ }}`) to avoid conflicts with LaTeX syntax, then compiles via `pdflatex` inside the Docker container which has `texlive-latex-extra` installed.

```
PDF Upload → PyMuPDF Parse → GPT-4o Rewrite → Jinja2 → pdflatex → PDF Output
```

### Tracking Pixel

A URL is embedded in the LaTeX PDF's metadata. When the PDF is opened in a viewer that auto-loads embedded links, it hits `/api/track/{token}`, which:
1. Returns a 1×1 transparent GIF
2. Resolves IP → geo via ip-api.com
3. Persists to TrackingEvent in the DB

### Orchestrator Routing

The Orchestrator uses GPT-4o `tool_calls` with a `route_to_agent` function to classify every chat message and dispatch to the correct specialist with ~90% confidence.

## Production Deployment

### PostgreSQL

1. Uncomment `postgres` service in `docker-compose.yml`
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://resumegod:password@postgres:5432/resumegod
   ```
3. Replace SQLite `connect_args` in `models.py` with PostgreSQL settings

### HTTPS / Nginx

Uncomment the `nginx` service in `docker-compose.yml` and configure `config/nginx.conf` with your SSL certificates.

### Environment Variables (Production)

```bash
OPENAI_API_KEY=sk-...
BASE_URL=https://api.yourdomain.com
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## Project Structure

```
resumegod/
├── backend/
│   ├── main.py                              # FastAPI gateway
│   ├── models.py                            # SQLAlchemy ORM models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── services/
│       ├── agent_orchestrator.py            # Intent classifier + router
│       └── agents/
│           ├── ats_agent.py                 # Resume rewriting + LaTeX
│           ├── interview_agent.py           # Question gen + grading
│           ├── spyglass_agent.py            # Tracking pixel + analytics
│           └── ghostwriter_affiliate_agents.py  # LinkedIn + courses
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                         # Mission Control dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── AgentChat.tsx                    # WebSocket career companion
│   │   ├── SpyglassMap.tsx                  # Geo analytics dashboard
│   │   ├── ATSPanel.tsx                     # Resume upload + results
│   │   ├── InterviewPanel.tsx               # Mock interview UI
│   │   ├── GhostwriterPanel.tsx             # LinkedIn post generator
│   │   └── AffiliatePanel.tsx               # Course recommendations
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT — Build your career with it.
