"""
ResumeGod V4.0 — The Orchestrator
Central brain that routes user requests to specialist agents via GPT-4o tool_calls.
"""
from __future__ import annotations
import json, os, textwrap
from enum import Enum
from typing import Any
from openai import AsyncOpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

class AgentType(str, Enum):
    ATS = "ats"; INTERVIEW = "interview"; SPYGLASS = "spyglass"
    GHOSTWRITER = "ghostwriter"; AFFILIATE = "affiliate"
    ROASTER = "roaster"; CAREER_COMPANION = "career_companion"; UNKNOWN = "unknown"

ROUTING_TOOLS = [{
    "type": "function",
    "function": {
        "name": "route_to_agent",
        "description": "Routes the user's request to the correct specialist agent.",
        "parameters": {
            "type": "object",
            "properties": {
                "agent": {"type": "string", "enum": [a.value for a in AgentType]},
                "intent": {"type": "string"},
                "urgency": {"type": "string", "enum": ["high", "medium", "low"]},
                "confidence": {"type": "number"},
            },
            "required": ["agent", "intent", "urgency", "confidence"],
        },
    },
}]

ORCHESTRATOR_SYSTEM = """You are the ResumeGod Orchestrator. Route requests to:
- ats: resume parsing, optimization, keyword injection, PDF
- interview: mock interviews, question generation, answer grading  
- spyglass: tracking, viewer analytics, who opened resume
- ghostwriter: LinkedIn posts, personal branding, announcements
- affiliate: courses, skill gaps, upskilling
- roaster: brutal resume critique (opt-in)
- career_companion: general career advice, strategy, chat"""

COMPANION_SYSTEM = """You are the Career Companion — a warm, expert career coach.
You are direct, encouraging but realistic. End every response with a clear next action.
Available agents: ATS Sentinel, Spyglass, Interviewer, Ghostwriter, Affiliate, Roaster."""

ROASTER_SYSTEM = """You are THE ROASTER — Simon Cowell meets Gordon Ramsay for resumes.
No filter. Pure truth. Devastating precision. But always constructive — you want them to succeed.
End every roast with a 3-point Redemption Arc."""

async def classify_intent(user_message: str, context: dict | None = None) -> dict[str, Any]:
    ctx = f"\nCONTEXT: {json.dumps(context)}\n" if context else ""
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": ORCHESTRATOR_SYSTEM},
            {"role": "user", "content": f"{ctx}USER MESSAGE: {user_message}"},
        ],
        tools=ROUTING_TOOLS,
        tool_choice={"type": "function", "function": {"name": "route_to_agent"}},
        temperature=0.1,
    )
    routing = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    return {
        "agent": AgentType(routing.get("agent", "career_companion")),
        "intent": routing.get("intent", ""),
        "urgency": routing.get("urgency", "medium"),
        "confidence": routing.get("confidence", 0.8),
    }

async def career_companion_chat(user_message: str, conversation_history: list[dict], resume_context: dict | None = None) -> dict[str, Any]:
    system = COMPANION_SYSTEM
    if resume_context:
        system += f"\n\nUSER CONTEXT: {json.dumps(resume_context)}"
    messages = [{"role": "system", "content": system}]
    messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": user_message})
    response = await client.chat.completions.create(model="gpt-4o", messages=messages, temperature=0.6, max_tokens=600)
    reply = response.choices[0].message.content
    return {"response": reply, "agent": "career_companion", "suggested_actions": _extract_actions(reply)}

async def roast_resume(resume_text: str, job_description: str | None = None) -> dict[str, Any]:
    jd = f"\n\nTARGET JD:\n{job_description[:1000]}" if job_description else ""
    prompt = f"""Roast this resume. Hold nothing back.\n\nRESUME:\n{resume_text[:3000]}{jd}\n\nReturn JSON:
{{"opening_salvo":"...","roast_sections":[{{"section":"...","burns":["..."],"severity":"Mild|Spicy|Nuclear"}}],"biggest_sin":"...","redemption_arc":["...","...","..."],"verdict":"...","hire_probability":"X%"}}"""
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": ROASTER_SYSTEM}, {"role": "user", "content": prompt}],
        response_format={"type": "json_object"}, temperature=0.8, max_tokens=1500,
    )
    return json.loads(response.choices[0].message.content)

def _extract_actions(reply: str) -> list[str]:
    actions = []
    triggers = {"ATS Sentinel": ["optimize","ats","resume","pdf"], "Mock Interview": ["interview","question","practice"], "Spyglass": ["tracker","spyglass","who opened"], "Ghostwriter": ["linkedin","post","announce"], "Find Courses": ["course","learn","skill"]}
    for action, keywords in triggers.items():
        if any(kw in reply.lower() for kw in keywords):
            actions.append(action)
    return actions[:3]
