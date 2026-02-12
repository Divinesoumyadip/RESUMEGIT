"""
ResumeGod V4.0 — Agent 1: The ATS Sentinel
Role: Parses resume PDFs, compares against JD, rewrites content intelligently,
generates Jake's Resume in LaTeX and compiles to PDF.
"""
import os
import re
import json
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader, BaseLoader
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Use << >> delimiters to avoid conflicts with LaTeX {{ }}
JINJA_ENV = Environment(
    loader=BaseLoader(),
    variable_start_string="<<",
    variable_end_string=">>",
    block_start_string="<%",
    block_end_string="%>",
    comment_start_string="<#",
    comment_end_string="#>",
)

JAKES_RESUME_TEMPLATE = r"""
\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{multicol}
\setlength{\multicolsep}{-3.0pt}
\setlength{\columnsep}{-1pt}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & \textbf{\small #2} \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2}\\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}
\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}

\begin{center}
    {\Huge \scshape << name >>} \\ \vspace{1pt}
    \small \raisebox{-0.1\height}\faPhone\ << phone >> ~ 
    \href{mailto:<< email >>}{\raisebox{-0.2\height}\faEnvelope\ << email >>} ~ 
    \href{<< linkedin >>}{\raisebox{-0.2\height}\faLinkedin\ << linkedin_text >>} ~
    \href{<< github >>}{\raisebox{-0.2\height}\faGithub\ << github_text >>}
    \vspace{-8pt}
\end{center}

%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
    <% for edu in education %>
    \resumeSubheading
      {<< edu.institution >>}{<< edu.dates >>}
      {<< edu.degree >>}{<< edu.location >>}
    <% endfor %>
  \resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart
    <% for exp in experience %>
    \resumeSubheading
      {<< exp.company >>}{<< exp.dates >>}
      {<< exp.title >>}{<< exp.location >>}
      \resumeItemListStart
        <% for bullet in exp.bullets %>
        \resumeItem{<< bullet >>}
        <% endfor %>
      \resumeItemListEnd
    <% endfor %>
  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
      <% for proj in projects %>
      \resumeProjectHeading
          {\textbf{<< proj.name >>} $|$ \emph{<< proj.tech >>}}{<< proj.dates >>}
          \resumeItemListStart
            <% for bullet in proj.bullets %>
            \resumeItem{<< bullet >>}
            <% endfor %>
          \resumeItemListEnd
      <% endfor %>
    \resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     <% for skill_group in skills %>
     \textbf{<< skill_group.category >>}{: << skill_group.items >>} \\
     <% endfor %>
    }}
 \end{itemize}

\end{document}
"""


SYSTEM_PROMPT_ATS = """You are the ATS Sentinel — a ruthlessly precise Resume Architect AI.
Your mission: Parse the candidate's resume, compare it against the job description,
and produce an optimized resume that maximizes ATS score without fabricating experience.

You MUST:
1. Inject missing JD keywords naturally into existing bullet points
2. Quantify achievements where possible (add realistic metrics if implied)
3. Reorder sections to match JD priority
4. Never invent job titles, companies, or degrees
5. Output structured JSON for the resume template

You are operating inside ResumeGod V4.0. Be precise, surgical, and ruthless about keyword density."""


async def analyze_and_optimize(
    resume_text: str,
    job_description: str,
    candidate_name: str = "Candidate",
    tracking_url: str = ""
) -> dict:
    """
    Core ATS optimization pipeline.
    Returns structured resume data + gap analysis.
    """

    tools = [
        {
            "type": "function",
            "function": {
                "name": "produce_optimized_resume",
                "description": "Produce a structured, ATS-optimized resume and gap analysis",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "resume_data": {
                            "type": "object",
                            "description": "Structured resume for LaTeX template",
                            "properties": {
                                "name": {"type": "string"},
                                "phone": {"type": "string"},
                                "email": {"type": "string"},
                                "linkedin": {"type": "string"},
                                "linkedin_text": {"type": "string"},
                                "github": {"type": "string"},
                                "github_text": {"type": "string"},
                                "education": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "institution": {"type": "string"},
                                            "degree": {"type": "string"},
                                            "dates": {"type": "string"},
                                            "location": {"type": "string"}
                                        }
                                    }
                                },
                                "experience": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "company": {"type": "string"},
                                            "title": {"type": "string"},
                                            "dates": {"type": "string"},
                                            "location": {"type": "string"},
                                            "bullets": {"type": "array", "items": {"type": "string"}}
                                        }
                                    }
                                },
                                "projects": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "name": {"type": "string"},
                                            "tech": {"type": "string"},
                                            "dates": {"type": "string"},
                                            "bullets": {"type": "array", "items": {"type": "string"}}
                                        }
                                    }
                                },
                                "skills": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "category": {"type": "string"},
                                            "items": {"type": "string"}
                                        }
                                    }
                                }
                            },
                            "required": ["name", "email", "education", "experience", "skills"]
                        },
                        "gap_analysis": {
                            "type": "object",
                            "properties": {
                                "ats_score_before": {
                                    "type": "number",
                                    "description": "Estimated ATS match score before optimization (0-100)"
                                },
                                "ats_score_after": {
                                    "type": "number",
                                    "description": "Estimated ATS match score after optimization (0-100)"
                                },
                                "keywords_injected": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Keywords from JD that were added to resume"
                                },
                                "keywords_missing": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Keywords from JD that could NOT be honestly added"
                                },
                                "strengths": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "critical_gaps": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "skill": {"type": "string"},
                                            "importance": {"type": "string"},
                                            "recommendation": {"type": "string"}
                                        }
                                    }
                                },
                                "roast": {
                                    "type": "string",
                                    "description": "Brutally honest 2-sentence assessment of the original resume"
                                }
                            },
                            "required": ["ats_score_before", "ats_score_after", "keywords_injected", "critical_gaps"]
                        }
                    },
                    "required": ["resume_data", "gap_analysis"]
                }
            }
        }
    ]

    user_prompt = f"""RESUME TEXT:
{resume_text}

JOB DESCRIPTION:
{job_description}

TRACKING URL (embed as invisible link in header if possible): {tracking_url}

Analyze this resume against the JD. Produce the optimized resume_data struct and gap_analysis.
Inject JD keywords naturally. Do NOT fabricate companies, degrees, or titles."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_ATS},
            {"role": "user", "content": user_prompt}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "produce_optimized_resume"}},
        temperature=0.3,
    )

    tool_call = response.choices[0].message.tool_calls[0]
    result = json.loads(tool_call.function.arguments)
    return result


def render_latex(resume_data: dict, tracking_url: str = "") -> str:
    """Render the Jinja2 LaTeX template with resume data."""
    template = JINJA_ENV.from_string(JAKES_RESUME_TEMPLATE)
    # Escape special LaTeX characters in all string fields
    def escape_latex(s: str) -> str:
        if not isinstance(s, str):
            return s
        replacements = [
            ("&", r"\&"), ("%", r"\%"), ("$", r"\$"), ("#", r"\#"),
            ("_", r"\_"), ("{", r"\{"), ("}", r"\}"), ("~", r"\textasciitilde{}"),
            ("^", r"\textasciicircum{}"),
        ]
        for old, new in replacements:
            s = s.replace(old, new)
        return s

    def escape_dict(obj):
        if isinstance(obj, str):
            return escape_latex(obj)
        elif isinstance(obj, list):
            return [escape_dict(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: escape_dict(v) for k, v in obj.items()}
        return obj

    safe_data = escape_dict(resume_data)
    return template.render(**safe_data, tracking_url=tracking_url)


def compile_latex_to_pdf(latex_source: str, output_dir: str) -> Optional[str]:
    """
    Compile LaTeX source to PDF using pdflatex.
    Returns path to compiled PDF or None on failure.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_file = os.path.join(tmpdir, "resume.tex")
        pdf_file = os.path.join(tmpdir, "resume.pdf")

        with open(tex_file, "w", encoding="utf-8") as f:
            f.write(latex_source)

        # Run pdflatex twice for proper cross-references
        for _ in range(2):
            result = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_file],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode != 0:
                print(f"[ATS Sentinel] LaTeX compilation error:\n{result.stdout[-2000:]}")

        if os.path.exists(pdf_file):
            os.makedirs(output_dir, exist_ok=True)
            import uuid
            out_path = os.path.join(output_dir, f"resume_{uuid.uuid4().hex[:8]}.pdf")
            shutil.copy(pdf_file, out_path)
            return out_path

    return None


async def run_ats_agent(
    resume_text: str,
    job_description: str,
    output_dir: str = "/tmp/resumes",
    tracking_url: str = ""
) -> dict:
    """
    Full pipeline: analyze → render LaTeX → compile PDF.
    Returns complete result package.
    """
    print("[ATS Sentinel] Analyzing resume against JD...")
    result = await analyze_and_optimize(resume_text, job_description, tracking_url=tracking_url)

    resume_data = result["resume_data"]
    gap_analysis = result["gap_analysis"]

    print("[ATS Sentinel] Rendering LaTeX template...")
    latex_source = render_latex(resume_data, tracking_url=tracking_url)

    print("[ATS Sentinel] Compiling PDF...")
    pdf_path = compile_latex_to_pdf(latex_source, output_dir)

    return {
        "status": "success" if pdf_path else "pdf_failed",
        "resume_data": resume_data,
        "gap_analysis": gap_analysis,
        "latex_source": latex_source,
        "pdf_path": pdf_path,
    }
