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
# Fixed: Imported exactly what's required by the 'agent_orchestrator.py' we just updated
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

# Fixed: Client initialized at the top so WebSocket can see it
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

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "online", "version": "4.0.0", "agents": 5}

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
    raw_text = extract_text_from_pdf(pdf_bytes)
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        user = User(id=str(uuid.uuid4()), email=user_email, name=user_name)
        db.add(user)

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

    return {"resume_id": resume.id, "status": "Uploaded Successfully"}

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
        print(f"[WS] Client disconnected")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)