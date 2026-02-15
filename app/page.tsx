'use client'

import { useState, useRef, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import { 
  Upload, Zap, Shield, Eye, Mic, Check, AlertTriangle, Loader2, TrendingUp, 
  Download, PenTool, BookOpen, Activity, Target, Terminal, Globe, Github, 
  RefreshCcw, Coins, MessageSquare, Gauge, Send, Bot, BarChart3
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resumegit-production.up.railway.app'

// --- 3D SWARM CORE ---
function SwarmCore() {
  const meshRef = useRef<any>(null)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15
    }
  })
  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={2.4}>
      <MeshDistortMaterial color="#f59e0b" attach="material" distort={0.4} speed={2} wireframe opacity={0.15} transparent />
    </Sphere>
  )
}

// --- GLOBAL MISSION FEED ---
function GlobalMissionFeed() {
  const missions = [
    "Operator #712 optimized an SDE Artifact for Google Bangalore",
    "Pulse Agent verified Flutter credentials for Dev #904",
    "Spyglass ping: Recruiter in West Bengal opened Artifact",
    "Shadow Agent generated referral outreach for Microsoft alumni",
    "Bounty Agent updated SDE-1 market rates for Kolkata"
  ]
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-amber-500/5 border-t border-white/5 py-2 overflow-hidden backdrop-blur-md z-50">
      <div className="flex whitespace-nowrap animate-marquee font-mono text-[10px] text-amber-500/60 tracking-widest uppercase italic">
        {missions.concat(missions).map((m, i) => (
          <span key={i} className="mx-12 flex items-center gap-2">
            <Zap className="w-2 h-2 fill-current" /> {m}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </div>
  )
}

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
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 12px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-orbitron">
          <span className="text-4xl font-black" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest text-center">{label}</p>
    </div>
  )
}

export default function MissionControl() {
  const { user } = useUser()
  const [activeAgent, setActiveAgent] = useState('ats')
  const [jobDescription, setJobDescription] = useState('')
  const [processing, setProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Initializing...')
  const [result, setResult] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [credits, setCredits] = useState(10)

  const tacticalAgents = [
    { id: 'ats', name: 'ATS Sentinel', icon: Shield },
    { id: 'pilot', name: 'Resume Pilot', icon: Bot },
    { id: 'pulse', name: 'GitHub Pulse', icon: Github },
    { id: 'ghostwriter', name: 'Ghostwriter', icon: PenTool },
  ]

  const strategicAgents = [
    { id: 'spyglass', name: 'Spyglass Radar', icon: Eye },
    { id: 'mirror', name: 'Agent Mirror', icon: RefreshCcw },
    { id: 'bounty', name: 'Agent Bounty', icon: Coins },
    { id: 'shadow', name: 'Agent Shadow', icon: MessageSquare },
    { id: 'interviewer', name: 'Interviewer', icon: Mic },
  ]

  // --- Logic Placeholder ---
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
      setCredits(prev => Math.max(0, prev - 1))
    } catch (e) { alert("Swarm offline.") } finally { setProcessing(false) }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-rajdhani overflow-hidden selection:bg-amber-500/30">
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none"><Canvas><Suspense fallback={null}><SwarmCore /></Suspense></Canvas></div>
      <div className="fixed inset-0 bg-swarm-grid opacity-20 pointer-events-none z-1" />
      
      <div className="relative z-10 flex min-h-screen">
        <aside className="w-72 border-r border-white/5 bg-black/60 backdrop-blur-3xl p-6 flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="bg-amber-500 p-1.5 rounded-lg"><Zap className="text-black w-6 h-6 fill-black" /></div>
            <span className="font-black text-2xl tracking-tighter italic font-orbitron">RESUMEGOD</span>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-4 pl-2 font-bold">Tactical Swarm</p>
              {tacticalAgents.map(agent => (
                <button key={agent.id} onClick={() => setActiveAgent(agent.id)} className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 mb-1 transition-all border ${activeAgent === agent.id ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' : 'opacity-40 hover:opacity-100 hover:bg-white/5 border-transparent'}`}>
                  <agent.icon className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-tight">{agent.name}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-4 pl-2 font-bold">Strategic Ops</p>
              {strategicAgents.map(agent => (
                <button key={agent.id} onClick={() => setActiveAgent(agent.id)} className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 mb-1 transition-all border ${activeAgent === agent.id ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' : 'opacity-40 hover:opacity-100 hover:bg-white/5 border-transparent'}`}>
                  <agent.icon className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-tight">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-12 max-w-6xl mx-auto w-full overflow-y-auto pb-24">
          <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs font-bold text-gray-400 tracking-[0.1em] uppercase">{credits} MISSION CREDITS</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ATS SENTINEL VIEW */}
            {activeAgent === 'ats' && (
              <motion.div key="ats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                {!showResults ? (
                  <>
                    <div>
                      <h1 className="text-8xl font-black mb-4 tracking-tighter uppercase leading-[0.8] drop-shadow-2xl italic font-orbitron">Deploy<br/><span className="text-amber-500">The Swarm</span></h1>
                      <p className="text-gray-400 font-mono text-lg italic uppercase tracking-widest">Rewiring 2026 SDE Careers.</p>
                    </div>
                    <div 
                      className={`group relative border-2 border-dashed rounded-[3rem] p-20 text-center transition-all duration-500 cursor-pointer backdrop-blur-md ${dragActive ? 'border-amber-500 bg-amber-500/5 scale-[0.98]' : 'border-white/10 bg-white/5 hover:border-amber-500/30'}`}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => { e.preventDefault(); setDragActive(false); setFile(e.dataTransfer.files[0]) }}
                      onClick={() => document.getElementById('fInput')?.click()}
                    >
                      <input id="fInput" type="file" hidden accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <div className="bg-white/5 border border-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        <Upload className="w-10 h-10 text-amber-500" />
                      </div>
                      <p className="text-2xl font-black uppercase tracking-tight font-orbitron">{file ? file.name : "Inject Target Artifact"}</p>
                    </div>
                    <textarea 
                      placeholder="Paste the Job Description..." 
                      className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] h-56 focus:border-amber-500/50 outline-none resize-none transition-all focus:bg-white/10 font-mono text-sm"
                      value={jobDescription} onChange={e => setJobDescription(e.target.value)} 
                    />
                    <button onClick={handleUploadAndOptimize} disabled={!file || !jobDescription || processing || credits <= 0} className="w-full bg-amber-500 text-black py-8 rounded-[2.5rem] font-black text-3xl hover:bg-amber-400 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.3)]">
                      {processing ? <Loader2 className="animate-spin w-10 h-10 mx-auto" /> : credits <= 0 ? "OUT OF CREDITS" : "INITIATE OPTIMIZATION"}
                    </button>
                  </>
                ) : (
                  <div className="space-y-12">
                     <div className="grid grid-cols-2 gap-10">
                        <div className="glass-tactical p-12 rounded-[3rem] flex justify-center"><ScoreRing score={result.ats?.gap_analysis?.ats_score_before || 0} label="Original Score" color="#ef4444" /></div>
                        <div className="bg-amber-500/5 p-12 rounded-[3rem] border border-amber-500/20 flex justify-center relative overflow-hidden">
                           <ScoreRing score={result.ats?.gap_analysis?.ats_score_after || 0} label="Optimized Score" color="#22c55e" isAfter />
                        </div>
                     </div>
                     <button onClick={() => setShowResults(false)} className="px-8 py-3 border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-mono text-xs font-bold uppercase tracking-widest">New Mission</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI PILOT: Resume AI Agent */}
            {activeAgent === 'pilot' && (
              <motion.div key="pilot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic font-orbitron">AI <span className="text-amber-500">Pilot</span></h2>
                <div className="glass-tactical rounded-[3rem] h-[500px] flex flex-col backdrop-blur-3xl overflow-hidden border-white/10">
                  <div className="flex-1 p-8 overflow-y-auto space-y-6 font-mono text-sm custom-scrollbar">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-[80%]">
                      System Online. I am your Resume Co-Pilot. I can iteratively refine specific sections of your artifact. What is our objective?
                    </div>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-[80%] ml-auto text-amber-500 text-right">
                      Make my "Customer 360 Bot" description more impact-heavy for a Fintech role.
                    </div>
                  </div>
                  <div className="p-6 border-t border-white/5 flex gap-4 bg-black/40">
                    <input type="text" placeholder="Infiltrate section with new commands..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono text-sm" />
                    <button className="bg-amber-500 text-black p-4 rounded-2xl hover:scale-105 transition-all"><Send className="w-6 h-6" /></button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AGENT MIRROR: Cultural Alignment */}
            {activeAgent === 'mirror' && (
              <motion.div key="mirror" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic font-orbitron">Agent <span className="text-purple-500">Mirror</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-tactical p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-6">
                    <ScoreRing score={88} label="Cultural DNA Match" color="#a855f7" />
                    <p className="text-[10px] font-mono text-purple-400 uppercase tracking-widest text-center">DNA Target: High-Growth AI Startup</p>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">Vibe Shift: AI Summary Overwrite</h3>
                    <div className="p-8 bg-purple-500/5 border border-purple-500/20 rounded-3xl italic font-mono text-sm leading-relaxed text-gray-400 border-l-4 border-l-purple-500 backdrop-blur-md">
                      "Replacing 'Self-motivated student' tone with 'Founding Engineer mindset.' Injecting high-impact verbs to match the company's aggressive automation culture."
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AGENT BOUNTY: Salary Intel */}
            {activeAgent === 'bounty' && (
              <motion.div key="bounty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic font-orbitron">Agent <span className="text-green-500">Bounty</span></h2>
                <div className="glass-tactical p-12 rounded-[3rem] space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-green-500/10 text-green-500 font-mono text-[10px] tracking-widest uppercase">Market Feed Active</div>
                  <div className="flex justify-between items-end">
                    <div>
                       <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Target Role: SDE-1</p>
                       <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Location: Bangalore / Remote</p>
                    </div>
                    <p className="text-5xl font-black text-green-500 font-orbitron">₹16L - ₹28L</p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative h-8 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="absolute left-[25%] right-[25%] h-full bg-green-500/30" />
                      <div className="absolute left-[75%] w-1.5 h-full bg-white shadow-[0_0_20px_white] z-10" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-600 uppercase font-bold px-2">
                      <span>Low Tier</span> <span className="text-white italic">Target Bounty (Top 10%)</span> <span>Principal</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AGENT SHADOW: Referral Automator */}
            {activeAgent === 'shadow' && (
              <motion.div key="shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic font-orbitron">Agent <span className="text-blue-500">Shadow</span></h2>
                <div className="p-10 glass-tactical rounded-[3rem] space-y-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">Generated Tactical Outreach (LinkedIn)</p>
                    <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-2xl font-mono text-lg leading-relaxed text-gray-300 backdrop-blur-md">
                      "Hey [Name], I've been following your recent work on the **Microservices transition**. As a fellow **Jis University** alum, I recently built a **Customer 360 Bot** using a similar FastAPI stack. Would love to get your thoughts on how [Company] handles real-time scaling."
                    </div>
                  </div>
                  <div className="flex items-center gap-10 p-8 bg-white/5 rounded-3xl border border-white/10">
                    <ScoreRing score={92} label="Connection Probability" color="#3b82f6" />
                    <div className="space-y-2 flex-1">
                       <h4 className="text-blue-500 font-black uppercase text-xs tracking-widest">Strategy Verdict</h4>
                       <p className="text-sm text-gray-500 leading-relaxed font-mono italic">"Shared University Context + Technical Proof-of-Work creates an immediate trust-bond, bypassing standard recruiter filters."</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Keep existing Ghostwriter, Pulse, Spyglass... */}
            {activeAgent === 'ghostwriter' && (
               <motion.div key="ghostwriter" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic italic font-orbitron">Ghost<span className="text-amber-500">writer</span></h2>
                <div className="p-10 glass-tactical rounded-[3rem] space-y-10 backdrop-blur-xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Original Weakpoint</p>
                    </div>
                    <p className="text-gray-600 font-mono line-through text-lg italic">"Built a bot for customer service using Python and some AI libraries."</p>
                  </div>
                  <div className="flex items-center justify-center"><Zap className="text-amber-500 w-8 h-8 animate-bounce fill-amber-500/20" /></div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Tactical Upgrade</p>
                    </div>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white font-mono text-2xl font-bold leading-relaxed border-l-2 border-amber-500 pl-6 shadow-[inset_10px_0_20px_-15px_rgba(245,158,11,0.3)]">
                      "Architected a high-performance Customer 360 Bot utilizing **FastAPI** and **Groq LPUs**, reducing response latency by 85% and automating 40% of standard ticket workflows."
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
      <GlobalMissionFeed />
    </div>
  )
}