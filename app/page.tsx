'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Zap, Shield, Eye, Mic, FileText, Check, 
  AlertTriangle, Loader2, TrendingUp, Download, 
  PenTool, BookOpen, Activity, Target
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resumegit-production.up.railway.app'

const INITIAL_AGENTS = [
  { id: 'ats', name: 'ATS Sentinel', icon: Shield, status: 'ACTIVE' },
  { id: 'spyglass', name: 'Spyglass Tracker', icon: Eye, status: 'ACTIVE' },
  { id: 'interviewer', name: 'The Interviewer', icon: Mic, status: 'OFFLINE' },
  { id: 'ghostwriter', name: 'Ghostwriter', icon: PenTool, status: 'OFFLINE' },
  { id: 'affiliate', name: 'The Affiliate', icon: BookOpen, status: 'OFFLINE' },
]

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
      <div className="text-center font-mono">
        <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
        {isAfter && <p className="text-[10px] font-bold text-green-500 mt-1">BOOSTED</p>}
      </div>
    </div>
  )
}

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
    setStatusMessage('Engaging Swarm...')

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('user_email', user?.primaryEmailAddress?.emailAddress || 'operator@resumegod.ai')

      const uploadRes = await fetch(`${API_URL}/api/resume/upload`, { method: 'POST', body: form })
      const uploadData = await uploadRes.json()

      setStatusMessage('Analyzing Armor...')
      const optimizeRes = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: uploadData.resume_id, job_description: jobDescription }),
      })
      
      const optimizeData = await optimizeRes.json()
      setResult(optimizeData)
      setShowResults(true)
      
      setAgents(prev => prev.map(a => 
        (a.id === 'interviewer' || a.id === 'ghostwriter') ? { ...a, status: 'ACTIVE' } : a
      ))
    } catch (e) {
      alert("Swarm offline. Check Railway connection.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,#111_0%,transparent_70%)] opacity-50" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10 pointer-events-none" />
      
      <div className="relative flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-72 border-r border-gray-900 bg-black/80 backdrop-blur-xl p-6 flex flex-col gap-8 sticky top-0 h-screen">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-800">
            <div className="bg-amber-500 p-1.5 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Zap className="text-black w-6 h-6 fill-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter italic italic">RESUMEGOD</span>
          </div>
          
          <nav className="flex-1 space-y-2">
            {agents.map((agent) => (
              <button 
                key={agent.id} 
                onClick={() => agent.status === 'ACTIVE' && setActiveAgent(agent.id)}
                className={`w-full px-4 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${activeAgent === agent.id ? 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)] text-amber-500' : agent.status === 'OFFLINE' ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-40 hover:opacity-100 hover:bg-gray-900'}`}
              >
                <agent.icon className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-bold tracking-tight">{agent.name}</p>
                  <p className="text-[10px] font-mono opacity-60 uppercase">{agent.status}</p>
                </div>
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4 bg-gray-950 rounded-2xl border border-gray-900">
             <p className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">Operator</p>
             <p className="text-sm font-bold truncate">{user?.firstName || 'Guest_User'}</p>
          </div>
        </aside>

        {/* MAIN MISSION AREA */}
        <main className="flex-1 p-12 max-w-6xl mx-auto w-full overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeAgent === 'spyglass' ? (
                <motion.div key="spyglass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-6xl font-black tracking-tighter uppercase italic">Spyglass<span className="text-amber-500">Tracker</span></h2>
                            <p className="text-gray-500 font-mono text-sm mt-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-500 animate-pulse" /> Live Surveillance Feed Active
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-3xl space-y-2">
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Total Pings</p>
                            <p className="text-4xl font-black">0</p>
                        </div>
                        <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-3xl col-span-2 flex items-center justify-center italic text-gray-600 font-mono text-sm">
                            Waiting for recruiter engagement...
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[2.5rem] space-y-4">
                        <h3 className="font-bold text-amber-500 flex items-center gap-2 uppercase tracking-widest text-sm"><Target className="w-4 h-4" /> Tracker Instructions</h3>
                        <p className="text-gray-400 text-sm leading-relaxed font-mono">
                            Spyglass works by embedding a invisible 1x1 tracking artifact into your optimized resume. 
                            When a recruiter opens the file, the swarm will notify you here instantly.
                        </p>
                    </div>
                </motion.div>
            ) : !showResults ? (
              <motion.div key="mission-init" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                <div>
                  <h1 className="text-8xl font-black mb-4 tracking-tighter uppercase leading-[0.8] drop-shadow-2xl">Deploy<br/><span className="text-amber-500">The Swarm</span></h1>
                  <p className="text-gray-500 font-mono text-lg italic">Targeting SDE roles from Kolkata to the World.</p>
                </div>

                <div 
                  className={`group relative border-2 border-dashed rounded-[3rem] p-20 text-center transition-all duration-500 cursor-pointer ${dragActive ? 'border-amber-500 bg-amber-500/5 scale-[0.98]' : 'border-gray-800 bg-gray-950/30 hover:border-gray-700'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); setFile(e.dataTransfer.files[0]) }}
                  onClick={() => document.getElementById('fInput')?.click()}
                >
                  <input id="fInput" type="file" hidden accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className="bg-gray-900 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black tracking-tight">{file ? file.name : "Target Artifact (PDF)"}</p>
                  <p className="text-gray-600 text-sm mt-3 font-mono uppercase tracking-[0.3em]">Drop PDF Here</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.5em] pl-1">Mission Parameters</p>
                  <textarea 
                    placeholder="Paste the Job Description. The Sentinel will scan for vulnerabilities..." 
                    className="w-full bg-gray-900/20 border border-gray-800 p-8 rounded-[2rem] h-56 focus:border-amber-500 outline-none resize-none transition-all focus:bg-gray-900/50 font-mono text-sm leading-relaxed"
                    value={jobDescription} 
                    onChange={e => setJobDescription(e.target.value)} 
                  />
                </div>

                <button 
                  onClick={handleUploadAndOptimize} 
                  disabled={!file || !jobDescription || processing} 
                  className="w-full bg-amber-500 text-black py-8 rounded-[2rem] font-black text-3xl hover:bg-amber-400 disabled:opacity-20 transition-all flex items-center justify-center gap-4 active:scale-[0.97] shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin w-10 h-10" />
                      <span className="animate-pulse">{statusMessage}</span>
                    </>
                  ) : "INITIATE OPTIMIZATION"}
                </button>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                <div className="flex justify-between items-center border-b border-gray-900 pb-10">
                  <div>
                    <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase">Mission Analysis</h2>
                    <p className="text-gray-500 font-mono text-sm mt-2 tracking-widest uppercase">Intel Generated Successfully</p>
                  </div>
                  <button onClick={() => setShowResults(false)} className="px-8 py-3 border border-gray-800 rounded-2xl hover:bg-white hover:text-black transition-all font-mono text-xs font-bold uppercase tracking-widest">New Scan</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-gray-950 p-12 rounded-[3rem] border border-gray-900 flex justify-center shadow-inner"><ScoreRing score={result.ats?.gap_analysis?.ats_score_before || 0} label="Original Score" color="#ef4444" /></div>
                  <div className="bg-gray-950 p-12 rounded-[3rem] border border-amber-500/20 flex justify-center shadow-inner"><ScoreRing score={result.ats?.gap_analysis?.ats_score_after || 0} label="Optimized Score" color="#22c55e" isAfter /></div>
                </div>

                {result.ats?.gap_analysis?.roast && (
                  <div className="p-10 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1.5 w-full bg-red-500/30" />
                    <h3 className="text-red-500 font-black mb-4 flex items-center gap-3 tracking-[0.2em] text-sm uppercase"><AlertTriangle className="w-5 h-5" /> Sentinel Roast</h3>
                    <p className="text-gray-300 italic font-mono text-xl leading-relaxed">"{result.ats.gap_analysis.roast}"</p>
                  </div>
                )}

                <div className="space-y-6">
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Keywords Injected</p>
                   <div className="flex flex-wrap gap-3">
                    {result.ats?.gap_analysis?.missing_keywords?.map((kw: string, i: number) => (
                      <span key={i} className="px-5 py-2.5 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded-2xl text-xs font-mono font-black tracking-tight">+{kw}</span>
                    ))}
                  </div>
                </div>

                {result.optimized_resume_url && (
                  <a href={result.optimized_resume_url} download className="block w-full bg-white text-black py-8 rounded-[2.5rem] font-black text-center text-2xl hover:bg-amber-500 transition-all shadow-2xl">
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