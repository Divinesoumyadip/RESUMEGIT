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

# --- IMPORTS ---
sys.path.insert(0, os.getcwd())
# Assuming models.py contains get_db and create_tables
from models import get_db, create_tables
# Assuming these exist in your project
# from agent_orchestrator import route_intent, orchestrate_chat, run_full_optimization_pipeline
# from spyglass_agent import get_tracking_pixel_bytes

# Initialize OpenAI
client_ws = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ResumeGod V4.0 — Swarm initializing...")
    try:
        # This calls create_tables() but we handle the crash if it exists
        create_tables()
    except Exception as e:
        print(f"⚠️ Table Check: {e}")
    print("ResumeGod V4.0 — Ready. The swarm is online.")
    yield

app = FastAPI(title="ResumeGod V4.0", lifespan=lifespan)

# CORS is vital for your Vercel frontend to talk to your Railway backend
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

# ✅ FIXED: THE MISSING UPLOAD ROUTE
@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        # For now, we just confirm receipt. 
        # Later we will add PDF parsing here.
        file_id = str(uuid.uuid4())
        print(f"🚀 Swarm Received File: {file.filename} (ID: {file_id})")
        
        return {
            "status": "success",
            "message": f"Resume '{file.filename}' successfully uploaded to the swarm.",
            "file_id": file_id
        }
    except Exception as e:
        print(f"❌ Upload Error: {str(e)}")
        return {"status": "error", "message": str(e)}

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
    # Use uvicorn.run(app) or "main:app" depending on your preference
    uvicorn.run(app, host="0.0.0.0", port=8000)