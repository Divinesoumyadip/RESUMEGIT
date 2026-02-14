'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Zap, Shield, Eye, Mic, FileText, Check, 
  AlertTriangle, Loader2, TrendingUp, Download, 
  PenTool, BookOpen
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resumegit-production.up.railway.app'

// ─── SWARM AGENT NAVIGATION ──────────────────────────────────────────────────
// Initializing these with 'ACTIVE' or 'OFFLINE' based on current backend capability
const INITIAL_AGENTS = [
  { id: 'ats', name: 'ATS Sentinel', icon: Shield, status: 'ACTIVE' },
  { id: 'spyglass', name: 'Spyglass Tracker', icon: Eye, status: 'ACTIVE' },
  { id: 'interviewer', name: 'The Interviewer', icon: Mic, status: 'OFFLINE' },
  { id: 'ghostwriter', name: 'Ghostwriter', icon: PenTool, status: 'OFFLINE' },
  { id: 'affiliate', name: 'The Affiliate', icon: BookOpen, status: 'OFFLINE' },
]

// ─── COMPONENT: SCORE RING ──────────────────────────────────────────────────
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
            <span className="text-xs font-bold text-green-500 tracking-tighter">OPTIMIZED</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function MissionControl() {
  const { user } = useUser()
  const [agents, setAgents] = useState(INITIAL_AGENTS)
  const [activeAgent, setActiveAgent] = useState('ats')
  const [jobDescription, setJobDescription] = useState('')
  const [processing, setProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Initializing...')
  const [result, setResult] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleUploadAndOptimize = async () => {
    if (!file || !jobDescription) return
    setProcessing(true)
    setStatusMessage('Uploading to Swarm...')

    try {
      // 1. UPLOAD
      const form = new FormData()
      form.append('file', file)
      form.append('user_email', user?.primaryEmailAddress?.emailAddress || 'guest@resumegod.ai')

      const uploadRes = await fetch(`${API_URL}/api/resume/upload`, { 
        method: 'POST', 
        body: form 
      })
      const uploadData = await uploadRes.json()

      // 2. OPTIMIZE
      setStatusMessage('Spyglass Tracker Engaging...')
      const optimizeRes = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_id: uploadData.resume_id, 
          job_description: jobDescription 
        }),
      })
      
      const optimizeData = await optimizeRes.json()
      setResult(optimizeData)
      setShowResults(true)
      
      // Bring agents online visually after success
      setAgents(prev => prev.map(a => 
        (a.id === 'interviewer' || a.id === 'ghostwriter') ? { ...a, status: 'ACTIVE' } : a
      ))

    } catch (e) {
      console.error(e)
      alert("System Overload: Swarm connection lost.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      <div className="relative flex">
        <aside className="w-72 border-r border-gray-900 min-h-screen bg-black p-6 flex flex-col gap-8 hidden md:flex sticky top-0">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-800">
            <Zap className="text-amber-500 w-8 h-8" />
            <span className="font-black text-2xl tracking-tighter italic bg-gradient-to-r from-white to-amber-500 bg-clip-text text-transparent">RESUMEGOD</span>
          </div>
          
          <nav className="flex-1 space-y-2">
            {agents.map((agent) => (
              <button 
                key={agent.id} 
                onClick={() => agent.status === 'ACTIVE' && setActiveAgent(agent.id)}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeAgent === agent.id ? 'bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : agent.status === 'OFFLINE' ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-50 hover:opacity-80'}`}
              >
                <agent.icon className={`w-5 h-5 ${activeAgent === agent.id ? 'text-amber-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className="text-sm font-bold tracking-tight">{agent.name}</p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase">{agent.status}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div>
                  <h1 className="text-7xl font-black mb-4 tracking-tighter uppercase leading-[0.9]">Deploy<br/><span className="text-amber-500">The Swarm</span></h1>
                  <p className="text-gray-500 font-mono italic">Operator: {user?.firstName || 'Unknown'}</p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer ${dragActive ? 'border-amber-500 bg-amber-500/5 scale-[0.99]' : 'border-gray-800 bg-gray-950/50 hover:border-gray-700'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); setFile(e.dataTransfer.files[0]) }}
                  onClick={() => document.getElementById('fInput')?.click()}
                >
                  <input id="fInput" type="file" hidden accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <Upload className="mx-auto w-12 h-12 mb-4 text-amber-500" />
                  <p className="text-xl font-bold">{file ? file.name : "Target Artifact (PDF)"}</p>
                  <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">Inject File</p>
                </div>

                <div className="space-y-4">
                  <textarea 
                    placeholder="Paste the Job Description. The Swarm will scout for weaknesses..." 
                    className="w-full bg-gray-900/50 border border-gray-800 p-6 rounded-2xl h-48 focus:border-amber-500 outline-none resize-none transition-all focus:bg-gray-900 font-mono text-sm"
                    value={jobDescription} 
                    onChange={e => setJobDescription(e.target.value)} 
                  />
                </div>

                <button 
                  onClick={handleUploadAndOptimize} 
                  disabled={!file || !jobDescription || processing} 
                  className="w-full bg-amber-500 text-black py-6 rounded-2xl font-black text-2xl hover:bg-amber-400 disabled:opacity-20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-amber-500/20"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin w-8 h-8" />
                      <span className="animate-pulse tracking-tighter">{statusMessage}</span>
                    </>
                  ) : "INITIATE MISSION"}
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                <div className="flex justify-between items-center border-b border-gray-800 pb-8">
                  <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Mission Analysis</h2>
                    <p className="text-gray-500 font-mono text-sm mt-1">SENTINEL SCAN COMPLETE</p>
                  </div>
                  <button onClick={() => setShowResults(false)} className="px-6 py-2 border border-gray-800 rounded-full hover:bg-white hover:text-black transition-all font-mono text-xs uppercase tracking-widest">Reset</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-900/30 p-10 rounded-[2.5rem] border border-gray-900 flex justify-center"><ScoreRing score={result.ats?.gap_analysis?.ats_score_before || 0} label="Raw Score" color="#ef4444" /></div>
                  <div className="bg-gray-900/30 p-10 rounded-[2.5rem] border border-amber-500/20 flex justify-center"><ScoreRing score={result.ats?.gap_analysis?.ats_score_after || 0} label="Agent Boost" color="#22c55e" isAfter /></div>
                </div>

                {result.ats?.gap_analysis?.roast && (
                  <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 w-full bg-red-500/50" />
                    <h3 className="text-red-500 font-black mb-3 flex items-center gap-2 tracking-widest text-sm uppercase"><AlertTriangle className="w-4 h-4" /> Sentinel Roast</h3>
                    <p className="text-gray-300 italic font-mono text-lg leading-relaxed">"{result.ats.gap_analysis.roast}"</p>
                  </div>
                )}

                <div className="space-y-4">
                   <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Injected Keywords</p>
                   <div className="flex flex-wrap gap-2">
                    {result.ats?.gap_analysis?.missing_keywords?.map((kw: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-mono font-bold tracking-tight">+{kw}</span>
                    ))}
                  </div>
                </div>

                {result.optimized_resume_url && (
                  <a href={result.optimized_resume_url} download className="block w-full bg-white text-black py-6 rounded-3xl font-black text-center text-xl hover:bg-amber-500 transition-all shadow-2xl">
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