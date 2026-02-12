'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Zap, Eye, Mic, PenTool, BookOpen,
  ChevronRight, FileText, TrendingUp, Target,
  Download, Copy, Check, AlertTriangle, Loader2,
  Activity, Cpu, Shield, Radio
} from 'lucide-react'
import AgentChat from '@/components/AgentChat'
import SpyglassMap from '@/components/SpyglassMap'
import {
  uploadResume, optimizeResume, getSpyglassStats, gradeAnswer,
  getPdfDownloadUrl, type OptimizationResult, type SpyglassStats,
  type InterviewQuestion, getDifficultyColor
} from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'upload' | 'ats' | 'spyglass' | 'interview' | 'ghostwriter' | 'affiliate'
type AgentStatus = 'idle' | 'processing' | 'done' | 'error'

interface AgentState {
  ats: AgentStatus
  spyglass: AgentStatus
  interview: AgentStatus
  ghostwriter: AgentStatus
  affiliate: AgentStatus
}

// ─── Agent Config ─────────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'ats',
    tab: 'ats' as Tab,
    name: 'ATS Sentinel',
    codename: 'A-01',
    description: 'Resume Architect',
    icon: Shield,
    color: '#f59e0b',
    tagline: 'Parse. Optimize. Dominate.'
  },
  {
    id: 'spyglass',
    tab: 'spyglass' as Tab,
    name: 'Spyglass',
    codename: 'A-02',
    description: 'Tracker Agent',
    icon: Eye,
    color: '#06b6d4',
    tagline: 'Watch who watches you.'
  },
  {
    id: 'interview',
    tab: 'interview' as Tab,
    name: 'The Interviewer',
    codename: 'A-03',
    description: 'Voice/Chat Agent',
    icon: Mic,
    color: '#8b5cf6',
    tagline: 'Expose your weaknesses first.'
  },
  {
    id: 'ghostwriter',
    tab: 'ghostwriter' as Tab,
    name: 'Ghostwriter',
    codename: 'A-04',
    description: 'Viral Marketing',
    icon: PenTool,
    color: '#ec4899',
    tagline: 'Make them come to you.'
  },
  {
    id: 'affiliate',
    tab: 'affiliate' as Tab,
    name: 'The Affiliate',
    codename: 'A-05',
    description: 'Upskilling Agent',
    icon: BookOpen,
    color: '#22c55e',
    tagline: 'Close every gap. Get hired.'
  }
]

// ─── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, color = '#f59e0b' }: { score: number; label: string; color?: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e1e30" strokeWidth="6" />
          <motion.circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-xl" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="text-god-subtext text-xs font-mono uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({
  onUpload
}: {
  onUpload: (resumeId: string, token: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [error, setError] = useState('')

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      setError('PDF files only.')
      return
    }
    setFile(f)
    setError('')
  }

  const handleSubmit = async () => {
    if (!file || !email || !jobDescription) {
      setError('Resume PDF, email, and job description are required.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const result = await uploadResume(file, email)
      onUpload(result.resume_id, result.tracking_token)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        onClick={() => document.getElementById('file-input')?.click()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${dragging
            ? 'border-god-amber bg-amber-500/5'
            : file
            ? 'border-god-green bg-green-500/5'
            : 'border-god-border bg-god-card hover:border-god-amber/40'
          }
        `}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-god-green" />
            <p className="font-display text-god-green">{file.name}</p>
            <p className="text-god-subtext text-sm">
              {(file.size / 1024).toFixed(1)} KB — Click to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-god-border flex items-center justify-center">
              <Upload className="w-8 h-8 text-god-amber" />
            </div>
            <div>
              <p className="font-display text-god-text font-semibold">Drop your resume PDF</p>
              <p className="text-god-subtext text-sm mt-1">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-god-subtext text-xs font-mono uppercase tracking-widest mb-1.5">
          Your Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full bg-god-card border border-god-border rounded-lg px-4 py-3
                     text-god-text placeholder-god-muted font-mono text-sm
                     focus:outline-none focus:border-god-amber transition-colors"
        />
      </div>

      {/* Job Description */}
      <div>
        <label className="block text-god-subtext text-xs font-mono uppercase tracking-widest mb-1.5">
          Target Job Description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here. The Sentinel needs the complete text to optimize your resume..."
          rows={6}
          className="w-full bg-god-card border border-god-border rounded-lg px-4 py-3
                     text-god-text placeholder-god-muted font-mono text-sm resize-none
                     focus:outline-none focus:border-god-amber transition-colors"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-god-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={uploading || !file || !email || !jobDescription}
        className="w-full bg-god-amber hover:bg-god-amber-glow disabled:opacity-40
                   disabled:cursor-not-allowed text-god-black font-display font-bold
                   py-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                   hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
      >
        {uploading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
        ) : (
          <><Zap className="w-5 h-5" /> Initialize the Swarm</>
        )}
      </button>
    </motion.div>
  )
}

// ─── ATS Results Panel ────────────────────────────────────────────────────────
function ATSPanel({ result, resumeId }: { result: OptimizationResult; resumeId: string }) {
  const [copied, setCopied] = useState(false)
  const { gap_analysis } = result.ats

  const copyLatex = () => {
    navigator.clipboard.writeText(result.ats.latex_source || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Score comparison */}
      <div className="bg-god-card border border-god-border rounded-xl p-6">
        <h3 className="font-display font-bold text-god-amber mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> ATS Score Analysis
        </h3>
        <div className="flex items-center justify-center gap-12">
          <ScoreRing score={gap_analysis.ats_score_before} label="Before" color="#ef4444" />
          <div className="flex flex-col items-center gap-1">
            <ChevronRight className="w-8 h-8 text-god-border" />
            <span className="text-god-green text-xs font-mono">
              +{Math.round(gap_analysis.ats_score_after - gap_analysis.ats_score_before)}pts
            </span>
          </div>
          <ScoreRing score={gap_analysis.ats_score_after} label="After" color="#22c55e" />
        </div>
      </div>

      {/* Roast */}
      {gap_analysis.roast && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-mono uppercase text-god-red tracking-widest mb-2">
            ⚡ Roast Mode
          </p>
          <p className="text-god-subtext italic">&quot;{gap_analysis.roast}&quot;</p>
        </div>
      )}

      {/* Keywords Injected */}
      <div className="bg-god-card border border-god-border rounded-xl p-4">
        <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-3">
          Keywords Injected ({gap_analysis.keywords_injected?.length || 0})
        </p>
        <div className="flex flex-wrap gap-2">
          {(gap_analysis.keywords_injected || []).map((kw) => (
            <span key={kw} className="text-xs bg-god-green/10 text-god-green border border-god-green/20 px-2 py-1 rounded font-mono">
              + {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Critical Gaps */}
      {(gap_analysis.critical_gaps || []).length > 0 && (
        <div className="bg-god-card border border-god-border rounded-xl p-4">
          <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-3">
            Critical Gaps
          </p>
          <div className="space-y-2">
            {gap_analysis.critical_gaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <AlertTriangle className="w-4 h-4 text-god-amber flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-god-amber font-mono font-semibold">{gap.skill}</span>
                  <span className="text-god-subtext"> — {gap.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download */}
      <div className="flex gap-3">
        {result.summary.pdf_ready && (
          <a
            href={getPdfDownloadUrl(resumeId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-god-amber text-god-black font-display font-bold
                       px-6 py-3 rounded-lg hover:bg-god-amber-glow transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        )}
        <button
          onClick={copyLatex}
          className="flex items-center gap-2 border border-god-border text-god-subtext
                     px-6 py-3 rounded-lg hover:border-god-amber hover:text-god-amber transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy LaTeX'}
        </button>
      </div>
    </div>
  )
}

// ─── Interview Panel ──────────────────────────────────────────────────────────
function InterviewPanel({ result }: { result: OptimizationResult }) {
  const [activeQ, setActiveQ] = useState<number>(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<Record<string, unknown> | null>(null)
  const [revealModel, setRevealModel] = useState(false)

  const questions = result.interview?.questions || []
  const current = questions[activeQ]

  const handleGrade = async () => {
    if (!userAnswer.trim() || !current) return
    setGrading(true)
    setGrade(null)
    setRevealModel(false)
    try {
      const g = await gradeAnswer(
        current.question,
        userAnswer,
        current.model_answer,
        current.category
      )
      setGrade(g as Record<string, unknown>)
    } catch {}
    setGrading(false)
  }

  const verdictColors: Record<string, string> = {
    exceptional: 'text-god-green',
    strong: 'text-emerald-400',
    acceptable: 'text-god-amber',
    weak: 'text-orange-400',
    reject: 'text-god-red'
  }

  if (!current) return <div className="text-god-subtext">No questions generated.</div>

  return (
    <div className="space-y-4">
      {/* Question selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => { setActiveQ(i); setUserAnswer(''); setGrade(null); setRevealModel(false) }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-mono transition-all
              ${activeQ === i
                ? 'bg-god-amber text-god-black font-bold'
                : 'bg-god-card border border-god-border text-god-subtext hover:border-god-amber/40'
              }`}
            style={{
              borderColor: activeQ !== i ? getDifficultyColor(q.difficulty) + '40' : undefined
            }}
          >
            Q{i + 1}
            <span
              className="ml-1.5 text-xs"
              style={{ color: getDifficultyColor(q.difficulty) }}
            >
              {q.difficulty}
            </span>
          </button>
        ))}
      </div>

      {/* Current Question */}
      <div className="bg-god-card border border-god-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-mono uppercase px-2 py-0.5 rounded"
            style={{
              color: getDifficultyColor(current.difficulty),
              background: getDifficultyColor(current.difficulty) + '15',
              border: `1px solid ${getDifficultyColor(current.difficulty)}30`
            }}
          >
            {current.category}
          </span>
          <span className="text-xs text-god-subtext font-mono">{current.difficulty.toUpperCase()}</span>
        </div>
        <p className="text-god-text font-display text-lg font-semibold leading-snug">
          {current.question}
        </p>
        {current.why_asking && (
          <p className="text-xs text-god-muted italic mt-2">
            Target: {current.why_asking}
          </p>
        )}
      </div>

      {/* Answer */}
      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Type your answer here. Be specific. Use the STAR method for behavioral questions..."
        rows={5}
        className="w-full bg-god-card border border-god-border rounded-xl px-4 py-3
                   text-god-text placeholder-god-muted text-sm resize-none
                   focus:outline-none focus:border-god-amber transition-colors font-body"
      />

      <button
        onClick={handleGrade}
        disabled={!userAnswer.trim() || grading}
        className="w-full bg-god-surface border border-god-amber text-god-amber
                   font-display font-bold py-3 rounded-lg hover:bg-god-amber hover:text-god-black
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {grading ? <><Loader2 className="w-4 h-4 animate-spin" /> Grading...</> : 'Submit Answer for Grading'}
      </button>

      {/* Grade Result */}
      <AnimatePresence>
        {grade && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-god-card border border-god-border rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`font-display text-4xl font-black ${verdictColors[grade.verdict as string] || 'text-god-text'}`}>
                {grade.score as number}/10
              </span>
              <span className={`font-display font-bold uppercase text-lg ${verdictColors[grade.verdict as string]}`}>
                {grade.verdict as string}
              </span>
            </div>

            <div className="space-y-2">
              {(grade.strengths as string[] || []).map((s, i) => (
                <p key={i} className="text-sm text-god-green flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" /> {s}
                </p>
              ))}
              {(grade.weaknesses as string[] || []).map((w, i) => (
                <p key={i} className="text-sm text-god-red flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {w}
                </p>
              ))}
            </div>

            {grade.coaching_note && (
              <div className="bg-god-amber/5 border border-god-amber/20 rounded-lg p-3 text-sm text-god-subtext">
                <p className="text-god-amber font-mono text-xs uppercase mb-1">Coach&apos;s Note</p>
                {grade.coaching_note as string}
              </div>
            )}

            <button
              onClick={() => setRevealModel(!revealModel)}
              className="text-sm text-god-subtext hover:text-god-amber transition-colors font-mono"
            >
              {revealModel ? '▲ Hide Model Answer' : '▼ Reveal Model Answer (9/10)'}
            </button>

            {revealModel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-god-surface rounded-lg p-4 text-sm text-god-subtext border-l-2 border-god-amber"
              >
                {current.model_answer}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Ghostwriter Panel ────────────────────────────────────────────────────────
function GhostwriterPanel({ result }: { result: OptimizationResult }) {
  const [copied, setCopied] = useState<string | null>(null)
  const gw = result.ghostwriter

  if (!gw) return <div className="text-god-subtext">Run optimization to generate content.</div>

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Primary Post */}
      <div className="bg-god-card border border-god-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono uppercase text-god-subtext tracking-widest">
            LinkedIn Post (Primary)
          </p>
          <button
            onClick={() => copyText(gw.primary_post, 'primary')}
            className="flex items-center gap-1 text-xs text-god-subtext hover:text-god-amber transition-colors"
          >
            {copied === 'primary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'primary' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-god-text text-sm leading-relaxed whitespace-pre-wrap">{gw.primary_post}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(gw.hashtags || []).map((tag) => (
            <span key={tag} className="text-xs text-god-cyan font-mono">#{tag}</span>
          ))}
        </div>
        {gw.best_time_to_post && (
          <p className="text-xs text-god-muted mt-2 font-mono">⏰ Best time: {gw.best_time_to_post}</p>
        )}
      </div>

      {/* Headline Options */}
      {(gw.headline_options || []).length > 0 && (
        <div className="bg-god-card border border-god-border rounded-xl p-4">
          <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-3">
            Alternative Openings (A/B Test)
          </p>
          {gw.headline_options.map((h, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-god-border last:border-0">
              <span className="text-god-amber font-mono text-xs mt-0.5">0{i + 1}</span>
              <p className="text-sm text-god-subtext">{h}</p>
            </div>
          ))}
        </div>
      )}

      {/* Twitter Thread */}
      {(gw.twitter_thread || []).length > 0 && (
        <div className="bg-god-card border border-god-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase text-god-subtext tracking-widest">
              X/Twitter Thread
            </p>
            <button
              onClick={() => copyText(gw.twitter_thread.join('\n\n'), 'thread')}
              className="text-xs text-god-subtext hover:text-god-amber transition-colors flex items-center gap-1"
            >
              {copied === 'thread' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy thread
            </button>
          </div>
          {gw.twitter_thread.map((tweet, i) => (
            <div key={i} className="flex gap-3 py-2 border-b border-god-border last:border-0">
              <span className="text-god-amber font-mono text-xs mt-0.5 flex-shrink-0">{i + 1}/</span>
              <p className="text-sm text-god-subtext leading-relaxed">{tweet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Affiliate Panel ──────────────────────────────────────────────────────────
function AffiliatePanel({ result }: { result: OptimizationResult }) {
  const aff = result.affiliate
  if (!aff?.courses?.length) return <div className="text-god-subtext">No skill gaps detected or run optimization first.</div>

  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#06b6d4',
    nice_to_have: '#6b7280'
  }

  return (
    <div className="space-y-4">
      {aff.roi_statement && (
        <div className="bg-god-green/5 border border-god-green/20 rounded-xl p-4">
          <p className="text-xs font-mono uppercase text-god-green tracking-widest mb-1">ROI Estimate</p>
          <p className="text-sm text-god-subtext">{aff.roi_statement}</p>
        </div>
      )}

      {aff.courses.map((course, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-god-card border border-god-border rounded-xl p-4 hover:border-god-amber/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded uppercase"
                  style={{
                    color: priorityColors[course.priority],
                    background: priorityColors[course.priority] + '15',
                    border: `1px solid ${priorityColors[course.priority]}30`
                  }}
                >
                  {course.priority}
                </span>
                <span className="text-xs text-god-muted font-mono">{course.platform}</span>
              </div>
              <p className="font-display font-semibold text-god-text">{course.course_title}</p>
              <p className="text-xs text-god-subtext mt-1">
                Skill: <span className="text-god-amber font-mono">{course.skill}</span>
                {course.duration && ` · ${course.duration}`}
                {course.price && ` · ${course.price}`}
              </p>
              {course.why_critical && (
                <p className="text-xs text-god-muted mt-1">{course.why_critical}</p>
              )}
            </div>
            <a
              href={course.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-god-amber text-god-black text-xs font-display font-bold
                         px-4 py-2 rounded-lg hover:bg-god-amber-glow transition-colors whitespace-nowrap"
            >
              Enroll →
            </a>
          </div>
        </motion.div>
      ))}

      {aff.learning_roadmap && (
        <div className="bg-god-card border border-god-border rounded-xl p-4">
          <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-2">
            30-Day Learning Roadmap
          </p>
          <p className="text-sm text-god-subtext leading-relaxed">{aff.learning_roadmap}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MissionControl() {
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [trackingToken, setTrackingToken] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [spyglassStats, setSpyglassStats] = useState<SpyglassStats | null>(null)
  const [agentStatus, setAgentStatus] = useState<AgentState>({
    ats: 'idle', spyglass: 'idle', interview: 'idle', ghostwriter: 'idle', affiliate: 'idle'
  })
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  const handleUpload = useCallback((id: string, token: string) => {
    setResumeId(id)
    setTrackingToken(token)
    setActiveTab('ats')
  }, [])

  const handleOptimize = useCallback(async () => {
    if (!resumeId || !jobDescription) {
      setError('Resume and job description required.')
      return
    }
    setOptimizing(true)
    setError('')
    setAgentStatus({
      ats: 'processing', spyglass: 'idle',
      interview: 'idle', ghostwriter: 'idle', affiliate: 'idle'
    })

    try {
      const res = await optimizeResume(resumeId, jobDescription)
      setResult(res)
      setAgentStatus({
        ats: 'done', spyglass: 'done',
        interview: 'done', ghostwriter: 'done', affiliate: 'done'
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Optimization failed')
      setAgentStatus({
        ats: 'error', spyglass: 'idle',
        interview: 'idle', ghostwriter: 'idle', affiliate: 'idle'
      })
    }
    setOptimizing(false)
  }, [resumeId, jobDescription])

  const handleTabChange = useCallback(async (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'spyglass' && resumeId && !spyglassStats) {
      try {
        const stats = await getSpyglassStats(resumeId)
        setSpyglassStats(stats)
      } catch {}
    }
  }, [resumeId, spyglassStats])

  const statusDot = (status: AgentStatus) => {
    if (status === 'processing') return 'processing'
    if (status === 'done') return 'online'
    if (status === 'error') return 'offline'
    return 'offline'
  }

  return (
    <div className="min-h-screen bg-god-black grid-bg scan-overlay noise-overlay">
      {/* Header */}
      <header className="border-b border-god-border bg-god-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-god-amber rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-god-black" />
            </div>
            <div>
              <span className="font-display font-black text-god-text tracking-tight">RESUMEGOD</span>
              <span className="font-mono text-god-amber text-xs ml-2">V4.0</span>
            </div>
          </div>

          {/* Agent Status Bar */}
          <div className="hidden md:flex items-center gap-4">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="flex items-center gap-1.5">
                <div className={`status-dot ${statusDot(agentStatus[agent.id as keyof AgentState])}`} />
                <span className="text-xs font-mono text-god-subtext">{agent.codename}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {resumeId && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-god-green bg-god-green/10 px-3 py-1.5 rounded-full border border-god-green/20">
                <Activity className="w-3 h-3" /> Resume Loaded
              </div>
            )}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="bg-god-card border border-god-border hover:border-god-amber
                         text-god-subtext hover:text-god-amber px-4 py-2 rounded-lg
                         text-sm font-display transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" /> Career Companion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Left Sidebar — Agent Grid */}
        <div className="hidden lg:block w-56 flex-shrink-0 space-y-2">
          <p className="text-xs font-mono uppercase text-god-muted tracking-widest mb-4 px-2">
            Agent Swarm
          </p>

          <button
            onClick={() => handleTabChange('upload')}
            className={`w-full agent-card rounded-xl p-3 text-left transition-all
              ${activeTab === 'upload' ? 'border-god-amber bg-god-amber/5' : 'bg-god-card'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-god-amber" />
              <span className="text-xs font-mono text-god-amber uppercase">Upload</span>
            </div>
            <p className="text-xs text-god-subtext">Initialize system</p>
          </button>

          {AGENTS.map((agent) => {
            const Icon = agent.icon
            const status = agentStatus[agent.id as keyof AgentState]
            return (
              <button
                key={agent.id}
                onClick={() => handleTabChange(agent.tab)}
                disabled={!resumeId && agent.tab !== 'upload'}
                className={`w-full agent-card rounded-xl p-3 text-left transition-all
                  ${activeTab === agent.tab ? 'bg-god-card border-opacity-100' : 'bg-god-card'}
                  ${!resumeId && agent.tab !== 'upload' ? 'opacity-40 cursor-not-allowed' : ''}
                `}
                style={{ borderColor: activeTab === agent.tab ? agent.color + '60' : undefined }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: agent.color }} />
                    <span className="text-xs font-mono uppercase" style={{ color: agent.color }}>
                      {agent.codename}
                    </span>
                  </div>
                  <div className={`status-dot ${statusDot(status)}`} />
                </div>
                <p className="text-xs font-display font-semibold text-god-text">{agent.name}</p>
                <p className="text-xs text-god-muted mt-0.5">{agent.description}</p>
              </button>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Tab Bar */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4">
            <button
              onClick={() => handleTabChange('upload')}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-mono transition-all
                ${activeTab === 'upload' ? 'bg-god-amber text-god-black' : 'bg-god-card border border-god-border text-god-subtext'}`}
            >
              Upload
            </button>
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => handleTabChange(a.tab)}
                disabled={!resumeId}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-mono transition-all
                  ${activeTab === a.tab ? 'bg-god-amber text-god-black' : 'bg-god-card border border-god-border text-god-subtext'}
                  disabled:opacity-40`}
              >
                {a.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >

              {/* UPLOAD TAB */}
              {activeTab === 'upload' && (
                <div>
                  <div className="mb-8">
                    <h1 className="font-display font-black text-4xl text-god-text tracking-tight">
                      Mission <span className="text-god-amber">Control</span>
                    </h1>
                    <p className="text-god-subtext mt-2 font-body">
                      Deploy your resume into the swarm. 5 agents will activate simultaneously.
                    </p>
                  </div>
                  <UploadZone onUpload={handleUpload} />
                </div>
              )}

              {/* ATS TAB */}
              {activeTab === 'ats' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-display font-bold text-2xl text-god-text flex items-center gap-2">
                        <Shield className="w-6 h-6 text-god-amber" /> ATS Sentinel
                      </h2>
                      <p className="text-god-subtext text-sm mt-1">Parse. Optimize. Dominate.</p>
                    </div>
                    {!result && (
                      <div className="flex flex-col items-end gap-2">
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste job description..."
                          rows={2}
                          className="w-72 bg-god-card border border-god-border rounded-lg px-3 py-2
                                     text-sm text-god-text placeholder-god-muted font-mono resize-none
                                     focus:outline-none focus:border-god-amber transition-colors"
                        />
                        <button
                          onClick={handleOptimize}
                          disabled={optimizing || !resumeId || !jobDescription}
                          className="flex items-center gap-2 bg-god-amber text-god-black
                                     font-display font-bold px-5 py-2.5 rounded-lg
                                     hover:bg-god-amber-glow disabled:opacity-40 disabled:cursor-not-allowed
                                     transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        >
                          {optimizing
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing...</>
                            : <><Zap className="w-4 h-4" /> Run Optimization</>
                          }
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mb-4 flex items-center gap-2 text-god-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  {optimizing && (
                    <div className="bg-god-card border border-god-border rounded-xl p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-2 border-god-amber/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-god-amber border-t-transparent animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-god-amber" />
                          </div>
                        </div>
                      </div>
                      <p className="font-display font-bold text-god-text">Swarm Activated</p>
                      <p className="text-god-subtext text-sm mt-2">
                        ATS Sentinel is parsing your resume and injecting keywords...
                      </p>
                      <div className="flex justify-center gap-2 mt-4">
                        {AGENTS.map((a) => (
                          <div key={a.id} className="flex items-center gap-1 text-xs font-mono text-god-muted">
                            <div className="status-dot processing" style={{ background: a.color }} />
                            {a.codename}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result && <ATSPanel result={result} resumeId={resumeId!} />}

                  {!result && !optimizing && resumeId && (
                    <div className="bg-god-card border border-dashed border-god-border rounded-xl p-8 text-center text-god-subtext">
                      <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>Enter a job description and click <span className="text-god-amber">Run Optimization</span> to activate the swarm.</p>
                    </div>
                  )}
                </div>
              )}

              {/* SPYGLASS TAB */}
              {activeTab === 'spyglass' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-2xl text-god-text flex items-center gap-2">
                      <Eye className="w-6 h-6 text-god-cyan" /> Spyglass
                    </h2>
                    <p className="text-god-subtext text-sm mt-1">Watch who watches you.</p>
                  </div>
                  {resumeId && (
                    <SpyglassMap
                      resumeId={resumeId}
                      stats={spyglassStats}
                      onRefresh={async () => {
                        const stats = await getSpyglassStats(resumeId)
                        setSpyglassStats(stats)
                      }}
                    />
                  )}
                </div>
              )}

              {/* INTERVIEW TAB */}
              {activeTab === 'interview' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-2xl text-god-text flex items-center gap-2">
                      <Mic className="w-6 h-6 text-purple-400" /> The Interviewer
                    </h2>
                    <p className="text-god-subtext text-sm mt-1">Expose your weaknesses before they do.</p>
                  </div>
                  {result ? (
                    <InterviewPanel result={result} />
                  ) : (
                    <div className="bg-god-card border border-dashed border-god-border rounded-xl p-8 text-center text-god-subtext">
                      Run the ATS optimization first to generate interview questions.
                    </div>
                  )}
                </div>
              )}

              {/* GHOSTWRITER TAB */}
              {activeTab === 'ghostwriter' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-2xl text-god-text flex items-center gap-2">
                      <PenTool className="w-6 h-6 text-pink-400" /> Ghostwriter
                    </h2>
                    <p className="text-god-subtext text-sm mt-1">Make them come to you.</p>
                  </div>
                  {result ? (
                    <GhostwriterPanel result={result} />
                  ) : (
                    <div className="bg-god-card border border-dashed border-god-border rounded-xl p-8 text-center text-god-subtext">
                      Run the ATS optimization first to generate LinkedIn content.
                    </div>
                  )}
                </div>
              )}

              {/* AFFILIATE TAB */}
              {activeTab === 'affiliate' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-2xl text-god-text flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-god-green" /> The Affiliate
                    </h2>
                    <p className="text-god-subtext text-sm mt-1">Close every gap. Get hired.</p>
                  </div>
                  {result ? (
                    <AffiliatePanel result={result} />
                  ) : (
                    <div className="bg-god-card border border-dashed border-god-border rounded-xl p-8 text-center text-god-subtext">
                      Run the ATS optimization to identify skill gaps and course recommendations.
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent Chat */}
      <AnimatePresence>
        {chatOpen && (
          <AgentChat
            resumeId={resumeId || undefined}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
