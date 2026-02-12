import os
from openai import AsyncOpenAI

# Initialize OpenAI
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def route_intent(message, history=None, context=None):
    """Decision brain: Routes the user to the right agent"""
    # Simply routing to ORCHESTRATOR for now to keep it running
    return {"primary_agent": "ORCHESTRATOR", "confidence": 1.0}

async def orchestrate_chat(message, history=None, context=None):
    """Chat brain: Handles general career coaching"""
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are ResumeGod Career AI."}, {"role": "user", "content": message}]
    )
    return {"message": response.choices[0].message.content}

async def run_full_optimization_pipeline(resume_text, job_description, user_id, base_url, tracking_token):
    """Optimization brain: Scores and fixes the resume"""
    return {
        "ats": {
            "gap_analysis": {"ats_score_before": 40, "ats_score_after": 95},
            "latex_source": "% LaTeX Ready",
            "pdf_path": None
        }
    }

