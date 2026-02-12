"""
ResumeGod V4.0 — Agent 3: The Interviewer
Role: Generates killer interview questions targeting resume weaknesses.
Grades answers 0-10 and provides model answers.
Persona: Sharp, professional, like a senior FAANG interviewer.
"""
import os
import json
from typing import Optional
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INTERVIEWER_SYSTEM_PROMPT = """You are The Interviewer — a senior talent acquisition specialist with 15 years at top-tier tech companies.
Your interrogation style is precise, probing, and designed to expose gaps between what a resume claims and what a candidate actually knows.

You target:
- The weakest sections of their resume (vague bullets, unexplained jumps, buzzword soup)
- Behavioral questions that reveal leadership maturity
- Technical depth checks on every technology listed
- Situational stress tests for senior roles

Your questions are NOT generic. They are laser-targeted at THIS specific resume and THIS specific role.
Every question has a trap for candidates who are bluffing."""

GRADER_SYSTEM_PROMPT = """You are The Interviewer grading a candidate's answer.
Score from 0-10 using this rubric:
- 0-3: Vague, generic, no specifics. "I'm a team player" energy.
- 4-6: Decent attempt. Shows awareness but lacks depth or missed key elements.
- 7-8: Solid. Specific, structured (STAR method), demonstrates genuine experience.
- 9-10: Exceptional. Concise, quantified, directly addresses the question, leaves no doubt.

Be brutally honest. No participation trophies. A score of 7 means genuinely good."""


async def generate_interview_questions(
    resume_text: str,
    job_description: str,
    gap_analysis: Optional[dict] = None,
    count: int = 5
) -> list[dict]:
    """
    Generate targeted interview questions based on resume weaknesses and JD requirements.
    """

    gaps_context = ""
    if gap_analysis:
        gaps_context = f"""
Known weakness areas from resume analysis:
- ATS Score: {gap_analysis.get('ats_score_before', 'N/A')}/100
- Critical Gaps: {json.dumps(gap_analysis.get('critical_gaps', []), indent=2)}
- Missing Keywords: {', '.join(gap_analysis.get('keywords_missing', []))}
"""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "generate_killer_questions",
                "description": "Generate targeted interview questions",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "questions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "question": {"type": "string"},
                                    "category": {
                                        "type": "string",
                                        "enum": ["technical", "behavioral", "situational", "gap_probe", "leadership"]
                                    },
                                    "difficulty": {
                                        "type": "string",
                                        "enum": ["medium", "hard", "killer"]
                                    },
                                    "why_asking": {
                                        "type": "string",
                                        "description": "Internal note: what weakness or gap this question targets"
                                    },
                                    "model_answer": {
                                        "type": "string",
                                        "description": "A 9/10 answer to this question — specific, structured, quantified"
                                    },
                                    "red_flags_to_watch": {
                                        "type": "string",
                                        "description": "What a bluffing candidate would say"
                                    }
                                },
                                "required": ["id", "question", "category", "difficulty", "model_answer"]
                            },
                            "minItems": 5,
                            "maxItems": 10
                        },
                        "overall_readiness_assessment": {
                            "type": "string",
                            "description": "2-3 sentence honest assessment of candidate's readiness for this role"
                        },
                        "highest_risk_area": {
                            "type": "string",
                            "description": "The single most likely reason this candidate gets rejected"
                        }
                    },
                    "required": ["questions", "overall_readiness_assessment"]
                }
            }
        }
    ]

    user_prompt = f"""RESUME:
{resume_text}

TARGET JOB DESCRIPTION:
{job_description}

{gaps_context}

Generate {count} killer interview questions. Target the weakest parts of this resume.
Include at least 2 technical depth questions, 2 behavioral (STAR-format expected), and 1 gap probe."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": INTERVIEWER_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "generate_killer_questions"}},
        temperature=0.7,
    )

    result = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    return result


async def grade_answer(
    question: str,
    user_answer: str,
    model_answer: str,
    category: str
) -> dict:
    """
    Grade a candidate's interview answer against the model answer.
    Returns score, feedback, and what was missing.
    """

    tools = [
        {
            "type": "function",
            "function": {
                "name": "grade_interview_answer",
                "description": "Grade a candidate's answer",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "score": {
                            "type": "number",
                            "description": "Score from 0-10"
                        },
                        "verdict": {
                            "type": "string",
                            "enum": ["reject", "weak", "acceptable", "strong", "exceptional"]
                        },
                        "strengths": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "What they did well"
                        },
                        "weaknesses": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "What was missing or vague"
                        },
                        "coaching_note": {
                            "type": "string",
                            "description": "Specific, actionable advice to improve this answer"
                        },
                        "improved_answer_snippet": {
                            "type": "string",
                            "description": "First 2 sentences of how they should have opened this answer"
                        }
                    },
                    "required": ["score", "verdict", "strengths", "weaknesses", "coaching_note"]
                }
            }
        }
    ]

    user_prompt = f"""INTERVIEW QUESTION: {question}
QUESTION CATEGORY: {category}

CANDIDATE'S ANSWER:
{user_answer}

BENCHMARK MODEL ANSWER (9/10 quality):
{model_answer}

Grade this answer. Be honest — this person's career depends on accurate feedback."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": GRADER_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "grade_interview_answer"}},
        temperature=0.4,
    )

    return json.loads(response.choices[0].message.tool_calls[0].function.arguments)


async def run_interview_agent(
    resume_text: str,
    job_description: str,
    gap_analysis: Optional[dict] = None,
    mode: str = "generate"  # "generate" | "grade"
) -> dict:
    """Entry point for the Interviewer agent."""

    if mode == "generate":
        result = await generate_interview_questions(resume_text, job_description, gap_analysis)
        return {
            "agent": "interviewer",
            "mode": "questions_generated",
            "data": result
        }

    return {"agent": "interviewer", "error": "Invalid mode"}
