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
from openai import AsyncOpenAI

# --- FIXED IMPORTS & CLIENTS ---
sys.path.insert(0, os.getcwd())
from models import (
    Base, engine, get_db, create_tables,
    User, Resume, TrackingLog, InterviewSession, ConversationSession
)
from agent_orchestrator import (
    route_intent, orchestrate_chat, run_full_optimization_pipeline
)
from spyglass_agent import (
    log_tracking_event, get_tracking_stats,
    get_tracking_pixel_bytes, build_tracking_url
)
from interview_agent import grade_answer, generate_interview_questions
from ghostwriter_agent import (
    generate_linkedin_post, generate_affiliate_recommendations
)

# Initialize OpenAI Client properly for use in routes
client_ws = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# -------------------------------

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
    allow_origins=["*"],
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
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 10MB.")

    raw_text = extract_text_from_pdf(pdf_bytes)
    if len(raw_text) < 50:
        raise HTTPException(422, "Could not extract text from PDF.")

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
        "filename": file.filename
    }


# ─── Full Pipeline Optimization ───────────────────────────────────────────────
@app.post("/api/optimize")
async def optimize_resume(payload: OptimizeRequest, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")

    try:
        result = await run_full_optimization_pipeline(
            resume_text=resume.raw_text,
            job_description=payload.job_description,
            user_id=resume.user_id,
            base_url=BASE_URL,
            tracking_token=resume.tracking_token or ""
        )

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
        raise HTTPException(500, f"Optimization failed: {str(e)}")


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


# ─── WebSocket Streaming Chat ─────────────────────────────────────────────────
@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_message = payload.get("message", "")
            
            await websocket.send_json({"type": "typing", "agent": "orchestrator"})
            
            # FIXED: Correctly using client_ws variable
            stream = await client_ws.chat.completions.create(
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
        print(f"[WS] Error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)