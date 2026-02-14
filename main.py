import os
import sys
import json
import uuid
import io
from pathlib import Path
from contextlib import asynccontextmanager

# Core Framework
from fastapi import FastAPI, UploadFile, File, Form, Request, Response, BackgroundTasks, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Intelligence Stack
from pypdf import PdfReader 
from openai import AsyncOpenAI

# --- INTERNAL IMPORTS ---
sys.path.insert(0, os.getcwd())
from models import create_tables
# from agent_orchestrator import run_full_optimization_pipeline # Trigger this when ready

# Initialize OpenAI
client_ws = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 ResumeGod V4.0 — Swarm initializing...")
    try:
        create_tables()
    except Exception as e:
        print(f"⚠️ DB Sync: {e}")
    print("Ready. The swarm is online.")
    yield

app = FastAPI(title="ResumeGod V4.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {"message": "ResumeGod Backend Running"}

# --- AGENT ROUTES ---

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), user_email: str = Form(...)):
    try:
        mission_id = str(uuid.uuid4())
        
        # 1. Read binary PDF data
        contents = await file.read()
        
        # 2. Extract Text using pypdf (The library you added)
        reader = PdfReader(io.BytesIO(contents))
        resume_text = ""
        for page in reader.pages:
            resume_text += page.extract_text() or ""

        print(f"📄 SENTINEL: Extracted {len(resume_text)} chars for {user_email}")
        
        # For now, we return 'resume_id' to match your React code
        return {
            "status": "success",
            "resume_id": mission_id, 
            "message": "Artifact captured and decrypted."
        }
    except Exception as e:
        print(f"❌ Extraction Error: {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/api/optimize")
async def optimize_resume(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        resume_id = data.get("resume_id")
        job_desc = data.get("job_description", "Software Engineer")

        print(f"🧬 Sentinel Scanning Mission: {resume_id}")

        # This JSON matches your 'Mission Analysis' UI perfectly
        # Later, replace this with a real OpenAI call using resume_text
        return {
            "status": "complete",
            "ats": {
                "gap_analysis": {
                    "ats_score_before": 45,
                    "ats_score_after": 92,
                    "roast": "This resume has the visual appeal of a terminal error. The Swarm is currently injecting high-performance keywords and fixing your hierarchy.",
                    "missing_keywords": ["System Design", "Microservices", "Redis", "Next.js 16"]
                }
            },
            "optimized_resume_url": f"https://resumegit-production.up.railway.app/download/{resume_id}"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# ✅ SPYGLASS TRACKER (The Invisible Pixel)
@app.get("/api/spyglass/track/{tracker_id}")
async def track_resume_view(tracker_id: str):
    # This pings your logs when a recruiter opens the PDF
    print(f"👁️ SPYGLASS ALERT: Resume {tracker_id} was just opened!")
    
    # 1x1 Transparent GIF pixel
    pixel_data = b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
    return Response(content=pixel_data, media_type="image/gif")

# ✅ THE INTERVIEWER (Foundation for voice/chat)
@app.get("/api/interviewer/questions/{resume_id}")
async def get_mock_questions(resume_id: str):
    return {
        "status": "ready",
        "questions": [
            "Explain the architecture of your most recent project.",
            "How do you optimize a low-latency system?",
            "Describe a time you fixed a critical production bug."
        ]
    }

@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_message = payload.get("message", "")
            
            stream = await client_ws.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": user_message}],
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    await websocket.send_json({"type": "token", "content": chunk.choices[0].delta.content})
            await websocket.send_json({"type": "done"})
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)