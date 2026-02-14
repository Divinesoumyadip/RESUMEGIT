'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Zap, Shield, Eye, Mic, FileText, Check, 
  AlertTriangle, Loader2, TrendingUp, Download, 
  Copy, BookOpen, PenTool, X 
} from 'lucide-react'

// ─── INTERNAL API LOGIC ───────────────────────────────────────────────────
const API_URL = 'https://resumegit-production.up.railway.app'

async function uploadResume(file: File, userEmail: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('user_email', userEmail)
  const res = await fetch(`${API_URL}/api/resume/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

async function optimizeResume(resumeId: string, jobDescription: string) {
  const res = await fetch(`${API_URL}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  })
  if (!res.ok) throw new Error('Optimization failed')
  return res.json()
}

// ─── SWARM AGENT NAVIGATION ──────────────────────────────────────────────────
const SWARM_AGENTS = [
  { id: 'ats', name: 'ATS Sentinel', icon: Shield, status: 'ACTIVE' },
  { id: 'spyglass', name: 'Spyglass Tracker', icon: Eye, status: 'OFFLINE' },
  { id: 'interviewer', name: 'The Interviewer', icon: Mic, status: 'OFFLINE' },
  { id: 'ghostwriter', name: 'Ghostwriter', icon: PenTool, status: 'OFFLINE' },
  { id: 'affiliate', name: 'The Affiliate', icon: BookOpen, status: 'OFFLINE' },
]

// ─── SCORE RING COMPONENT ──────────────────────────────────────────────────
function ScoreRing({ score, label, color, isAfter = false }: { score: number; label: string; color: string; isAfter?: boolean }) {
  const circumference = 2 * Math.PI * 58
  const offset = circumference - (score / 100) * circumference
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="72" cy="72" r="58" stroke="#1a1a1a" strokeWidth="12" fill="none" />
          <motion.circle
            cx="72" cy="72" r="58" stroke={color} strokeWidth="12" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">{label}</p>
        {isAfter && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs font-bold text-green-500">OPTIMIZED</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN MISSION CONTROL ──────────────────────────────────────────────────
export default function MissionControl() {
  const [activeAgent, setActiveAgent] = useState('ats')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleUploadAndOptimize = async () => {
    if (!file || !email || !jobDescription) return
    setProcessing(true)
    try {
      const uploadRes = await uploadResume(file, email)
      setResumeId(uploadRes.resume_id)
      const optimizeRes = await optimizeResume(uploadRes.resume_id, jobDescription)
      setResult(optimizeRes)
      setShowResults(true)
    } catch (e) {
      alert("System Overload: Could not process request.")
    }
    setProcessing(false)
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      <div className="relative flex">
        {/* SIDEBAR */}
        <aside className="w-72 border-r border-gray-900 min-h-screen bg-black p-6 flex flex-col gap-8 hidden md:flex">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-800">
            <Zap className="text-amber-500 w-8 h-8" />
            <span className="font-black text-2xl tracking-tighter italic bg-gradient-to-r from-white to-amber-500 bg-clip-text text-transparent">RESUMEGOD</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-amber-500 tracking-wider uppercase">System Live</span>
          </div>
          <nav className="flex-1 space-y-2">
            {SWARM_AGENTS.map((agent) => (
              <button key={agent.id} className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeAgent === agent.id ? 'bg-amber-500/20 border border-amber-500/50' : 'opacity-40 hover:opacity-100'}`}>
                <agent.icon className="w-5 h-5 text-amber-500" />
                <div className="text-left">
                  <p className="text-sm font-bold">{agent.name}</p>
                  <p className="text-[10px] font-mono text-gray-500">{agent.status}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div>
                  <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase">Initialize Swarm</h1>
                  <p className="text-gray-500 font-mono italic">Phase 1: Deep scan and keyword injection.</p>
                </div>

                <div className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all ${dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-gray-800 bg-gray-950/50 hover:border-gray-700'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); setFile(e.dataTransfer.files[0]) }}
                  onClick={() => document.getElementById('fInput')?.click()}
                >
                  <input id="fInput" type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <Upload className="mx-auto w-12 h-12 mb-4 text-amber-500" />
                  <p className="text-xl font-bold">{file ? file.name : "Select Resume PDF"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="email" placeholder="Contact Intelligence (Email)" className="bg-gray-900 border border-gray-800 p-4 rounded-xl focus:border-amber-500 outline-none font-mono" value={email} onChange={e => setEmail(e.target.value)} />
                  <textarea placeholder="Paste Job Description for Target Mission..." className="bg-gray-900 border border-gray-800 p-4 rounded-xl h-32 focus:border-amber-500 outline-none resize-none" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
                </div>

                <button onClick={handleUploadAndOptimize} disabled={!file || !email || !jobDescription || processing} className="w-full bg-amber-500 text-black py-6 rounded-2xl font-black text-2xl hover:bg-amber-400 disabled:opacity-20 transition-all shadow-lg shadow-amber-500/20">
                  {processing ? <Loader2 className="mx-auto animate-spin" /> : "DEPLOY AGENTS"}
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="flex justify-between items-end border-b border-gray-800 pb-6">
                  <h2 className="text-4xl font-black text-amber-500 italic">SENTINEL FEEDBACK</h2>
                  <button onClick={() => setShowResults(false)} className="text-gray-500 hover:text-white font-mono text-xs">NEW MISSION</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-900/50 p-10 rounded-3xl border border-gray-800"><ScoreRing score={result.ats?.gap_analysis?.ats_score_before || 0} label="Initial Scan" color="#ef4444" /></div>
                  <div className="bg-gray-900/50 p-10 rounded-3xl border border-amber-500/20"><ScoreRing score={result.ats?.gap_analysis?.ats_score_after || 0} label="Optimized Scan" color="#22c55e" isAfter /></div>
                </div>

                {result.ats?.gap_analysis?.roast && (
                  <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 w-full bg-red-500" />
                    <h3 className="text-red-500 font-black mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> ROAST MODE</h3>
                    <p className="text-gray-300 italic font-mono">"{result.ats.gap_analysis.roast}"</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {result.ats?.gap_analysis?.missing_keywords?.map((kw: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full text-xs font-mono">{kw}</span>
                  ))}
                </div>

                {result.optimized_resume_url && (
                  <a href={result.optimized_resume_url} download className="block w-full bg-green-500 text-black py-5 rounded-2xl font-black text-center hover:bg-green-400 transition-all">
                    DOWNLOAD OPTIMIZED ARTIFACT
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}