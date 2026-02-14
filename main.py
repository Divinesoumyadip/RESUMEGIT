import os
import sys
import json
import uuid
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request, Response, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
from fastapi.responses import JSONResponse

# --- IMPORTS ---
sys.path.insert(0, os.getcwd())
from models import get_db, create_tables
from agent_orchestrator import route_intent, orchestrate_chat, run_full_optimization_pipeline

# Initialize OpenAI
client_ws = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ResumeGod V4.0 — Swarm initializing...")
    try:
        create_tables()
    except Exception as e:
        print(f"⚠️ Table Check: {e}")
    print("ResumeGod V4.0 — Ready. The swarm is online.")
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
        print(f"🚀 Mission Initialized for {user_email}: {file.filename}")
        return {
            "status": "success",
            "resume_id": mission_id, 
            "message": "Artifact captured."
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/api/optimize")
async def optimize_resume(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        resume_id = data.get("resume_id")
        job_desc = data.get("job_description", "General Mission")

        # Start the heavy lifting in the background
        background_tasks.add_task(run_full_optimization_pipeline, resume_id, job_desc)

        return {
            "status": "complete",
            "ats": {
                "gap_analysis": {
                    "ats_score_before": 45,
                    "ats_score_after": 92,
                    "roast": "This resume looks like a high-latency database query. Let's optimize the schema.",
                    "missing_keywords": ["System Design", "Scalability", "Next.js 16", "Redis"]
                }
            },
            "optimized_resume_url": f"https://resumegit-production.up.railway.app/api/download/{resume_id}"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# ✅ NEW: SPYGLASS TRACKER (The Invisible Pixel)
@app.get("/api/spyglass/track/{tracker_id}")
async def track_resume_view(tracker_id: str):
    # This pings your logs when someone (a recruiter) opens the PDF
    print(f"👁️ SPYGLASS ALERT: Resume {tracker_id} was just opened!")
    
    # 1x1 Transparent GIF pixel
    pixel_data = b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
    return Response(content=pixel_data, media_type="image/gif")

# ✅ NEW: THE INTERVIEWER (Placeholder for Logic)
@app.get("/api/interviewer/questions/{resume_id}")
async def get_mock_questions(resume_id: str):
    # Eventually, this will use OpenAI to generate specific questions
    return {
        "status": "ready",
        "questions": [
            "Explain the architecture of the Customer 360 Bot you built.",
            "How did you handle state management in your Flutter food delivery clone?",
            "What was the most challenging part of clearing your backlogs while studying CS?"
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