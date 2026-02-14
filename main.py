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

# ✅ UNCOMMENTED: These are now active to power the pipeline
from agent_orchestrator import route_intent, orchestrate_chat, run_full_optimization_pipeline
# from spyglass_agent import get_tracking_pixel_bytes

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

@app.get("/health")
async def health():
    return {"status": "online", "version": "4.0.0"}

# --- ROUTES ---

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        print(f"🚀 Swarm Received File: {file.filename} (ID: {file_id})")
        
        return {
            "status": "success",
            "message": f"Resume '{file.filename}' successfully uploaded.",
            "file_id": file_id
        }
    except Exception as e:
        print(f"❌ Upload Error: {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# ✅ NEW: THE OPTIMIZATION ENDPOINT (Fixes the 404)
@app.post("/api/optimize")
async def optimize_resume(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        file_id = data.get("file_id")
        target_job = data.get("job_description", "General Software Engineer Role")

        print(f"🧬 Optimization Triggered: Processing File {file_id} for {target_job}")

        # background_tasks allows the API to return immediately while the AI works in the background
        background_tasks.add_task(run_full_optimization_pipeline, file_id, target_job)

        return {
            "status": "processing",
            "message": "The Swarm has begun the optimization pipeline.",
            "file_id": file_id
        }
    except Exception as e:
        print(f"❌ Pipeline Error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": "Optimization initiation failed"})

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
                    await websocket.send_json({
                        "type": "token", 
                        "content": chunk.choices[0].delta.content
                    })
            await websocket.send_json({"type": "done"})
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)