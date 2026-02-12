"""
ResumeGod V4.0 — Agent 4: The Ghostwriter
Role: Personal brand strategist. Writes viral LinkedIn "humble brag" posts.
Reads the optimized resume and crafts copy-paste ready announcement content.
"""
import os
import json
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

GHOSTWRITER_SYSTEM_PROMPT = """You are The Ghostwriter — a viral LinkedIn content strategist who has ghost-written posts
that collectively generated 50M+ impressions for tech professionals.

Your specialty: the "Humble Brag Career Update" — posts that announce professional wins
without sounding arrogant. Posts that get 500+ likes, 100+ comments, and 20+ DMs from recruiters.

Your formula:
1. Open with a vulnerable moment or relatable struggle (hook)
2. Pivot to the win (but don't lead with it)
3. Gratitude + lessons learned (relatability)
4. Forward-looking statement (authority + aspiration)
5. Soft CTA: "DM me if you're navigating [X]"
6. 5-7 strategic hashtags

Style: Conversational but polished. No corporate speak. First person.
The reader should feel like they're hearing from a smart friend, not a press release.
Vary post lengths — sometimes short punchy works better than long-form."""

AFFILIATE_SYSTEM_PROMPT = """You are the Upskilling Agent for ResumeGod.
Identify specific skill gaps from a resume/JD comparison and map them to real Udemy/Coursera courses.
Output structured course recommendations with realistic affiliate-style URLs."""


async def generate_linkedin_post(
    resume_data: dict,
    job_description: str,
    tone: str = "humble_brag"  # humble_brag | storytelling | achievement | thought_leadership
) -> dict:
    """
    Generate a viral LinkedIn post based on the candidate's new resume.
    """

    tools = [
        {
            "type": "function",
            "function": {
                "name": "create_linkedin_content",
                "description": "Generate viral LinkedIn career announcement content",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "primary_post": {
                            "type": "string",
                            "description": "The main LinkedIn post (300-800 chars for algorithm favor)"
                        },
                        "long_form_version": {
                            "type": "string",
                            "description": "Extended version for LinkedIn articles (800-1500 chars)"
                        },
                        "headline_options": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "3 alternative opening lines to A/B test"
                        },
                        "hashtags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "7 strategic hashtags (without #)"
                        },
                        "best_time_to_post": {
                            "type": "string",
                            "description": "Optimal posting time for maximum reach"
                        },
                        "engagement_prediction": {
                            "type": "string",
                            "description": "Estimated reach and engagement prediction"
                        },
                        "twitter_thread": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "5-tweet thread version of the same story"
                        }
                    },
                    "required": ["primary_post", "hashtags", "headline_options"]
                }
            }
        }
    ]

    # Extract key career data from resume
    name = resume_data.get("name", "the candidate")
    experience = resume_data.get("experience", [])
    latest_role = experience[0] if experience else {}

    user_prompt = f"""CANDIDATE: {name}
LATEST ROLE: {latest_role.get('title', 'N/A')} at {latest_role.get('company', 'N/A')}
TONE: {tone}

FULL RESUME DATA:
{json.dumps(resume_data, indent=2)}

TARGET ROLE THEY'RE APPLYING FOR:
{job_description[:500]}

Write a {tone} LinkedIn post announcing this career update.
Make it feel authentic, not corporate. This should get 500+ likes."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": GHOSTWRITER_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "create_linkedin_content"}},
        temperature=0.85,
    )

    return json.loads(response.choices[0].message.tool_calls[0].function.arguments)


async def generate_affiliate_recommendations(
    gap_analysis: dict,
    max_recommendations: int = 5
) -> dict:
    """
    Agent 5: The Affiliate — Identify skill gaps and return course recommendations.
    """

    critical_gaps = gap_analysis.get("critical_gaps", [])
    missing_keywords = gap_analysis.get("keywords_missing", [])

    if not critical_gaps and not missing_keywords:
        return {"courses": [], "total_investment": "$0", "priority_skill": None}

    tools = [
        {
            "type": "function",
            "function": {
                "name": "recommend_courses",
                "description": "Recommend specific courses for skill gaps",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "courses": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "skill": {"type": "string"},
                                    "course_title": {"type": "string"},
                                    "platform": {
                                        "type": "string",
                                        "enum": ["Udemy", "Coursera", "LinkedIn Learning", "Pluralsight", "edX", "YouTube"]
                                    },
                                    "instructor": {"type": "string"},
                                    "duration": {"type": "string"},
                                    "price": {"type": "string"},
                                    "priority": {
                                        "type": "string",
                                        "enum": ["critical", "high", "medium", "nice_to_have"]
                                    },
                                    "affiliate_url": {
                                        "type": "string",
                                        "description": "Realistic course URL (use actual Udemy/Coursera URL patterns)"
                                    },
                                    "why_critical": {"type": "string"},
                                    "time_to_competency": {"type": "string"}
                                },
                                "required": ["skill", "course_title", "platform", "priority", "affiliate_url"]
                            }
                        },
                        "learning_roadmap": {
                            "type": "string",
                            "description": "Recommended order and timeline to acquire these skills"
                        },
                        "roi_statement": {
                            "type": "string",
                            "description": "Estimated salary impact of closing these gaps"
                        }
                    },
                    "required": ["courses", "learning_roadmap"]
                }
            }
        }
    ]

    user_prompt = f"""SKILL GAPS IDENTIFIED:
Critical Gaps: {json.dumps(critical_gaps, indent=2)}
Missing Keywords: {', '.join(missing_keywords)}

Recommend the top {max_recommendations} most impactful courses to close these gaps.
Use real platform names and realistic URL structures.
Focus on what will ACTUALLY help them get hired in 30-90 days."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": AFFILIATE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "recommend_courses"}},
        temperature=0.5,
    )

    return json.loads(response.choices[0].message.tool_calls[0].function.arguments)


async def run_ghostwriter_agent(
    resume_data: dict,
    job_description: str,
    gap_analysis: dict,
    tone: str = "humble_brag"
) -> dict:
    """Entry point for Ghostwriter + Affiliate agents."""

    linkedin_content, course_recs = await asyncio.gather(
        generate_linkedin_post(resume_data, job_description, tone),
        generate_affiliate_recommendations(gap_analysis)
    )

    return {
        "agent": "ghostwriter",
        "linkedin": linkedin_content,
        "courses": course_recs
    }


import asyncio
