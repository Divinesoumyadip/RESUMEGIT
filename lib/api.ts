// ResumeGod V4.0 — API Client
// Typed wrappers around all backend endpoints

// UPDATED: Pointing to your live Railway Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resumegit-production.up.railway.app'

export interface GapAnalysis {
  ats_score_before: number
  ats_score_after: number
  keywords_injected: string[]
  keywords_missing: string[]
  strengths: string[]
  critical_gaps: Array<{
    skill: string
    importance: string
    recommendation: string
  }>
  roast: string
}

export interface OptimizationResult {
  pipeline: string
  ats: {
    status: string
    resume_data: Record<string, unknown>
    gap_analysis: GapAnalysis
    latex_source: string
    pdf_path: string | null
  }
  interview: {
    questions: InterviewQuestion[]
    overall_readiness_assessment: string
    highest_risk_area: string
  }
  ghostwriter: {
    primary_post: string
    long_form_version: string
    headline_options: string[]
    hashtags: string[]
    best_time_to_post: string
    twitter_thread: string[]
  }
  affiliate: {
    courses: Course[]
    learning_roadmap: string
    roi_statement: string
  }
  summary: {
    score_before: number
    score_after: number
    keywords_injected: number
    pdf_ready: boolean
    questions_ready: number
  }
}

export interface InterviewQuestion {
  id: string
  question: string
  category: 'technical' | 'behavioral' | 'situational' | 'gap_probe' | 'leadership'
  difficulty: 'medium' | 'hard' | 'killer'
  why_asking: string
  model_answer: string
  red_flags_to_watch: string
}

export interface GradeResult {
  score: number
  verdict: 'reject' | 'weak' | 'acceptable' | 'strong' | 'exceptional'
  strengths: string[]
  weaknesses: string[]
  coaching_note: string
  improved_answer_snippet: string
}

export interface TrackingEvent {
  id: string
  event_type: string
  ip_address: string
  country: string
  city: string
  company_hint: string
  user_agent: string
  latitude: number | null
  longitude: number | null
  viewed_at: string
}

export interface SpyglassStats {
  resume_id: string
  tracking_url: string
  total_views: number
  unique_viewers: number
  events: TrackingEvent[]
  geo_breakdown: Record<string, number>
  company_hints: string[]
  timeline: Array<{ date: string; views: number }>
  map_points: Array<{
    lat: number
    lng: number
    city: string
    company: string
    time: string
  }>
}

export interface Course {
  skill: string
  course_title: string
  platform: string
  instructor: string
  duration: string
  price: string
  priority: 'critical' | 'high' | 'medium' | 'nice_to_have'
  affiliate_url: string
  why_critical: string
  time_to_competency: string
}

export interface ChatResponse {
  session_id: string
  routing: {
    primary_agent: string
    intent_summary: string
    response_preview: string
    requires_resume?: boolean
  }
  agent: string
  message: string
  requires_action?: boolean
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function uploadResume(
  file: File,
  userEmail: string,
  userName: string = ''
): Promise<{ resume_id: string; tracking_token: string; preview: string }> {
  const form = new FormData()
  form.append('file', file)
  form.append('user_email', userEmail)
  form.append('user_name', userName)

  const res = await fetch(`${API_URL}/api/resume/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function optimizeResume(
  resumeId: string,
  jobDescription: string
): Promise<OptimizationResult> {
  const res = await fetch(`${API_URL}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Optimization failed')
  }
  return res.json()
}

export async function gradeAnswer(
  question: string,
  userAnswer: string,
  modelAnswer: string,
  category: string
): Promise<GradeResult> {
  const res = await fetch(`${API_URL}/api/interview/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, user_answer: userAnswer, model_answer: modelAnswer, category }),
  })
  if (!res.ok) throw new Error('Grading failed')
  return res.json()
}

export async function getSpyglassStats(resumeId: string): Promise<SpyglassStats> {
  const res = await fetch(`${API_URL}/api/spyglass/${resumeId}`)
  if (!res.ok) throw new Error('Failed to fetch tracking stats')
  return res.json()
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
  resumeId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId, resume_id: resumeId }),
  })
  if (!res.ok) throw new Error('Chat failed')
  return res.json()
}

export async function getCourses(resumeId: string): Promise<{ courses: Course[]; learning_roadmap: string }> {
  const res = await fetch(`${API_URL}/api/affiliate/courses/${resumeId}`)
  if (!res.ok) throw new Error('Failed to fetch courses')
  return res.json()
}

export function getPdfDownloadUrl(resumeId: string): string {
  return `${API_URL}/api/resume/${resumeId}/pdf`
}

export function getVerdictColor(verdict: string): string {
  const map: Record<string, string> = {
    exceptional: '#22c55e',
    strong: '#86efac',
    acceptable: '#f59e0b',
    weak: '#f97316',
    reject: '#ef4444',
  }
  return map[verdict] || '#6b7280'
}

export function getDifficultyColor(difficulty: string): string {
  const map: Record<string, string> = {
    medium: '#06b6d4',
    hard: '#f59e0b',
    killer: '#ef4444',
  }
  return map[difficulty] || '#6b7280'
}