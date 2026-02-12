"""
ResumeGod V4.0 — FastAPI Gateway
Main entry point. Handles all HTTP routes, file uploads,
agent dispatch, tracking pixel serving, and WebSocket chat.
"""
import os
import sys
import json
import uuid
import asyncio
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import (
    FastAPI, UploadFile, File, Form, Depends, HTTPException,
    Request, Response, BackgroundTasks, WebSocket, WebSocketDisconnect
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

# Local imports
sys.path.insert(0, "/app")
from models import (
    Base, engine, get_db, create_tables,
    User, Resume, TrackingLog, InterviewSession, ConversationSession
)
from services.agent_orchestrator import (
    route_intent, orchestrate_chat, run_full_optimization_pipeline
)
from services.agents.spyglass_agent import (
    log_tracking_event, get_tracking_stats,
    get_tracking_pixel_bytes, build_tracking_url
)
from services.agents.interview_agent import grade_answer, generate_interview_questions
from services.agents.ghostwriter_agent import (
    generate_linkedin_post, generate_affiliate_recommendations
)


# ─── PDF Text Extraction ──────────────────────────────────────────────────────
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pypdf."""
    import io
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception as e:
        print(f"[PDF Extract] Error: {e}")
        return ""


# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ResumeGod V4.0 — Swarm initializing...")
    create_tables()
    os.makedirs("/tmp/resumegod_pdfs", exist_ok=True)
    print("ResumeGod V4.0 — Ready. The swarm is online.")
    yield
    print("ResumeGod V4.0 — Shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ResumeGod V4.0",
    description="Multi-Agent Career Operating System",
    version="4.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    resume_id: Optional[str] = None


class GradeAnswerRequest(BaseModel):
    question: str
    user_answer: str
    model_answer: str
    category: str = "technical"


class LinkedInRequest(BaseModel):
    resume_id: str
    tone: str = "humble_brag"


class OptimizeRequest(BaseModel):
    resume_id: str
    job_description: str


# ─── Auth (Simplified) ────────────────────────────────────────────────────────
def get_or_create_user(email: str, name: str, db: Session) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(id=str(uuid.uuid4()), email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "online", "version": "4.0.0", "agents": 5}


# ─── User Routes ──────────────────────────────────────────────────────────────
@app.post("/api/users")
async def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = get_or_create_user(payload.email, payload.name or "", db)
    return {"id": user.id, "email": user.email, "name": user.name}


# ─── Resume Upload ────────────────────────────────────────────────────────────
@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_email: str = Form(...),
    user_name: str = Form(default=""),
    db: Session = Depends(get_db)
):
    """Upload a resume PDF and extract text."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "File too large. Max 10MB.")

    raw_text = extract_text_from_pdf(pdf_bytes)
    if len(raw_text) < 50:
        raise HTTPException(422, "Could not extract text from PDF. Try a text-based PDF.")

    user = get_or_create_user(user_email, user_name, db)
    tracking_token = str(uuid.uuid4())

    resume = Resume(
        id=str(uuid.uuid4()),
        user_id=user.id,
        original_filename=file.filename,
        raw_text=raw_text,
        tracking_token=tracking_token
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    tracking_url = build_tracking_url(BASE_URL, tracking_token)

    return {
        "resume_id": resume.id,
        "tracking_token": tracking_token,
        "tracking_url": tracking_url,
        "text_length": len(raw_text),
        "filename": file.filename,
        "preview": raw_text[:300] + "..."
    }


# ─── Full Pipeline Optimization ───────────────────────────────────────────────
@app.post("/api/optimize")
async def optimize_resume(payload: OptimizeRequest, db: Session = Depends(get_db)):
    """
    Run the full multi-agent optimization pipeline:
    ATS Sentinel → Interviewer + Ghostwriter + Affiliate (parallel)
    """
    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    if not resume.raw_text:
        raise HTTPException(422, "Resume has no extracted text.")

    try:
        result = await run_full_optimization_pipeline(
            resume_text=resume.raw_text,
            job_description=payload.job_description,
            user_id=resume.user_id,
            base_url=BASE_URL,
            tracking_token=resume.tracking_token or ""
        )

        # Persist results
        ats = result.get("ats", {})
        resume.job_description = payload.job_description
        resume.gap_analysis = ats.get("gap_analysis")
        resume.optimized_latex = ats.get("latex_source")
        resume.ats_score_before = ats.get("gap_analysis", {}).get("ats_score_before")
        resume.ats_score_after = ats.get("gap_analysis", {}).get("ats_score_after")
        if ats.get("pdf_path"):
            resume.pdf_path = ats["pdf_path"]
        db.commit()

        return result

    except Exception as e:
        raise HTTPException(500, f"Optimization pipeline failed: {str(e)}")


# ─── PDF Download ─────────────────────────────────────────────────────────────
@app.get("/api/resume/{resume_id}/pdf")
async def download_pdf(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")
    if not resume.pdf_path or not Path(resume.pdf_path).exists():
        raise HTTPException(404, "PDF not yet generated. Run /api/optimize first.")
    return FileResponse(resume.pdf_path, media_type="application/pdf", filename="optimized_resume.pdf")


# ─── Interview Routes ─────────────────────────────────────────────────────────
@app.post("/api/interview/generate")
async def generate_questions(payload: OptimizeRequest, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    result = await generate_interview_questions(
        resume_text=resume.raw_text or "",
        job_description=payload.job_description,
        gap_analysis=resume.gap_analysis
    )

    session = InterviewSession(
        id=str(uuid.uuid4()),
        user_id=resume.user_id,
        resume_id=resume.id,
        questions=result.get("questions", [])
    )
    db.add(session)
    db.commit()

    return {"session_id": session.id, **result}


@app.post("/api/interview/grade")
async def grade_interview_answer(payload: GradeAnswerRequest):
    result = await grade_answer(
        question=payload.question,
        user_answer=payload.user_answer,
        model_answer=payload.model_answer,
        category=payload.category
    )
    return result


# ─── LinkedIn Post Generation ─────────────────────────────────────────────────
@app.post("/api/ghostwriter/linkedin")
async def generate_linkedin(payload: LinkedInRequest, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    # Need optimized resume data — try gap_analysis as proxy
    import ast
    resume_data = {}
    if resume.raw_text:
        # Parse name from raw text (first line usually)
        lines = resume.raw_text.strip().split("\n")
        resume_data["name"] = lines[0] if lines else "Professional"

    result = await generate_linkedin_post(
        resume_data=resume_data,
        job_description=resume.job_description or "",
        tone=payload.tone
    )
    return result


# ─── Affiliate Courses ────────────────────────────────────────────────────────
@app.get("/api/affiliate/courses/{resume_id}")
async def get_courses(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume or not resume.gap_analysis:
        raise HTTPException(404, "Resume or gap analysis not found. Run /api/optimize first.")

    result = await generate_affiliate_recommendations(resume.gap_analysis)
    return result


# ─── Spyglass Tracking Pixel ──────────────────────────────────────────────────
@app.get("/api/track/{tracking_token}/pixel.gif")
async def tracking_pixel(
    tracking_token: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Serve the 1x1 tracking pixel and log the view."""
    resume = db.query(Resume).filter(Resume.tracking_token == tracking_token).first()

    if resume:
        ip = request.client.host
        # Check X-Forwarded-For for proxied requests
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()

        user_agent = request.headers.get("user-agent", "")
        referer = request.headers.get("referer", "")

        background_tasks.add_task(
            log_tracking_event,
            db=db,
            resume_id=resume.id,
            ip_address=ip,
            user_agent=user_agent,
            referer=referer,
            event_type="view"
        )

    return Response(
        content=get_tracking_pixel_bytes(),
        media_type="image/gif",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


# ─── Spyglass Dashboard Data ──────────────────────────────────────────────────
@app.get("/api/spyglass/{resume_id}")
async def spyglass_stats(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    stats = get_tracking_stats(db, resume_id)
    return {
        "resume_id": resume_id,
        "tracking_token": resume.tracking_token,
        "tracking_url": build_tracking_url(BASE_URL, resume.tracking_token or ""),
        **stats
    }


# ─── Chat (Orchestrator) ──────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(payload: ChatMessage, db: Session = Depends(get_db)):
    """
    Main conversational endpoint. Routes through the Orchestrator.
    """
    # Load or create session
    session = None
    if payload.session_id:
        session = db.query(ConversationSession).filter(
            ConversationSession.id == payload.session_id
        ).first()

    if not session:
        session = ConversationSession(
            id=str(uuid.uuid4()),
            user_id="anonymous",
            messages=[],
            context={"resume_id": payload.resume_id}
        )
        db.add(session)

    history = session.messages or []
    context = session.context or {}
    if payload.resume_id:
        context["resume_id"] = payload.resume_id

    # Route intent
    routing = await route_intent(payload.message, history, context)
    primary_agent = routing.get("primary_agent", "ORCHESTRATOR")

    response_data = {
        "session_id": session.id,
        "routing": routing,
        "agent": primary_agent
    }

    if primary_agent == "ORCHESTRATOR":
        chat_response = await orchestrate_chat(payload.message, history, context)
        response_data["message"] = chat_response["message"]
    else:
        # Return routing instructions — frontend handles agent dispatch
        response_data["message"] = routing.get("response_preview", "Processing your request...")
        response_data["requires_action"] = True

    # Update conversation history
    history.append({"role": "user", "content": payload.message, "agent": "user"})
    history.append({
        "role": "assistant",
        "content": response_data.get("message", ""),
        "agent": primary_agent
    })
    session.messages = history[-20:]  # Keep last 20 messages
    session.context = context
    db.commit()

    return response_data


# ─── WebSocket Streaming Chat ─────────────────────────────────────────────────
@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time streaming chat responses.
    """
    await websocket.accept()
    print(f"[WS] Client connected: {session_id}")

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_message = payload.get("message", "")

            # Stream response token by token
            await websocket.send_json({"type": "typing", "agent": "orchestrator"})

            stream = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are ResumeGod, a career AI assistant."},
                    {"role": "user", "content": user_message}
                ],
                stream=True,
                max_tokens=600,
            )

            full_response = ""
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    await websocket.send_json({"type": "token", "content": token})

            await websocket.send_json({"type": "done", "full_message": full_response})

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected: {session_id}")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})


# Import OpenAI client for WebSocket
from openai import AsyncOpenAI
client_ws = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
