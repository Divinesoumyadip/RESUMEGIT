'use client'

import { useState, useRef, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import { 
  Upload, Zap, Shield, Eye, Mic, Check, 
  AlertTriangle, Loader2, TrendingUp, Download, 
  PenTool, BookOpen, Activity, Target, Terminal, Globe, Github
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resumegit-production.up.railway.app'

// --- 3D SWARM CORE COMPONENT ---
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
      <MeshDistortMaterial 
        color="#f59e0b" 
        attach="material" 
        distort={0.4} 
        speed={2} 
        wireframe 
        opacity={0.15}
        transparent
      />
    </Sphere>
  )
}

// --- GLOBAL MISSION FEED (Hacker Marquee) ---
function GlobalMissionFeed() {
  const missions = [
    "Operator #712 optimized an SDE Artifact for Google Bangalore",
    "Sentinel Roast: 'This hierarchy is a binary disaster'",
    "Pulse Agent verified Flutter credentials for Dev #904",
    "Spyglass ping detected: Recruiter in West Bengal",
    "Operator #221 successfully injected Microservices keyword layer"
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
          animation: marquee 30s linear infinite;
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
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 12px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>
      <div className="text-center font-mono text-xs uppercase tracking-widest text-gray-400">
        <p>{label}</p>
        {isAfter && <p className="text-[10px] font-bold text-green-500 mt-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">BOOSTED</p>}
      </div>
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
  const [credits, setCredits] = useState(5)

  const agents = [
    { id: 'ats', name: 'ATS Sentinel', icon: Shield, status: 'ACTIVE' },
    { id: 'spyglass', name: 'Spyglass Radar', icon: Eye, status: 'ACTIVE' },
    { id: 'pulse', name: 'GitHub Pulse', icon: Github, status: 'ACTIVE' },
    { id: 'interviewer', name: 'The Interviewer', icon: Mic, status: 'OFFLINE' },
    { id: 'ghostwriter', name: 'Ghostwriter', icon: PenTool, status: 'OFFLINE' },
  ]

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
    } catch (e) {
      alert("Swarm offline. Check Railway connection.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* 3D BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <Canvas>
          <Suspense fallback={null}>
            <SwarmCore />
          </Suspense>
        </Canvas>
      </div>

      {/* GRID OVERLAY */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] opacity-50 z-1" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none z-1" />
      
      <div className="relative z-10 flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-72 border-r border-white/5 bg-black/60 backdrop-blur-3xl p-6 flex flex-col gap-8 sticky top-0 h-screen">
          <div className="flex items-center gap-3 pb-6 border-b border-white/5">
            <div className="bg-amber-500 p-1.5 rounded-lg shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                <Zap className="text-black w-6 h-6 fill-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter italic italic">RESUMEGOD</span>
          </div>
          
          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-4 pl-2">Tactical Agents</p>
            {agents.map((agent) => (
              <button 
                key={agent.id} 
                onClick={() => agent.status === 'ACTIVE' && setActiveAgent(agent.id)}
                className={`w-full px-4 py-4 rounded-2xl flex items-center justify-between transition-all duration-300 border ${activeAgent === agent.id ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' : agent.status === 'OFFLINE' ? 'opacity-20 grayscale cursor-not-allowed border-transparent' : 'opacity-40 hover:opacity-100 hover:bg-white/5 border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <agent.icon className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-tight">{agent.name}</span>
                </div>
                {agent.status === 'OFFLINE' && <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">Off</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
             <p className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">Operator Setup</p>
             <p className="text-sm font-bold truncate uppercase">{user?.firstName || 'Guest_User'}</p>
          </div>
        </aside>

        {/* MAIN MISSION AREA */}
        <main className="flex-1 p-12 max-w-6xl mx-auto w-full overflow-y-auto pb-24">
          {/* CREDITS INDICATOR */}
          <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs font-bold text-gray-400 tracking-[0.1em] uppercase">{credits} MISSION CREDITS</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeAgent === 'spyglass' && (
              <motion.div key="spyglass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="flex justify-between items-end">
                    <h2 className="text-6xl font-black tracking-tighter uppercase italic italic">Spyglass<span className="text-amber-500">Radar</span></h2>
                    <span className="px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3 animate-pulse" /> Surveillance Live
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-2 backdrop-blur-xl">
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Total Pings</p>
                        <p className="text-4xl font-black">0</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl col-span-2 flex flex-col items-center justify-center italic text-gray-600 font-mono text-sm backdrop-blur-xl">
                        <Globe className="w-8 h-8 mb-2 opacity-20" />
                        Awaiting telemetry from LinkedIn injections...
                    </div>
                </div>

                {/* REFERRAL RADAR CARD */}
                <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] relative overflow-hidden backdrop-blur-md">
                   <h3 className="text-amber-500 font-black mb-4 flex items-center gap-2 tracking-widest text-xs uppercase">
                     <Target className="w-4 h-4" /> Referral Radar: Jis University Network
                   </h3>
                   <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase">Targeting Company</p>
                        <p className="text-xl font-black italic">Google India</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase">Alumni Detected</p>
                        <p className="text-xl font-black italic">14 Contacts</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeAgent === 'pulse' && (
              <motion.div key="pulse" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <h2 className="text-6xl font-black tracking-tighter uppercase italic italic text-green-500">GitHub <span className="text-white">Pulse</span></h2>
                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl space-y-6">
                   <div className="flex items-center gap-4">
                      <PulseBadge />
                      <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Scanning Repositories for Verification...</p>
                   </div>
                   
                   <div className="space-y-4">
                      {[
                        { name: "Customer 360 Bot", lang: "Python / FastAPI", status: "VERIFIED" },
                        { name: "Flutter Food Clone", lang: "Dart", status: "VERIFIED" },
                        { name: "Steganography Tool", lang: "C++", status: "PENDING" }
                      ].map((project, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-green-500/30 transition-all">
                           <div>
                             <p className="font-bold tracking-tight">{project.name}</p>
                             <p className="text-[10px] font-mono text-gray-500 uppercase">{project.lang}</p>
                           </div>
                           <span className={`text-[10px] font-black font-mono px-3 py-1 rounded-full ${project.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-500'}`}>
                             {project.status}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {activeAgent === 'ats' && !showResults && (
              <motion.div key="mission-init" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                <div>
                  <h1 className="text-8xl font-black mb-4 tracking-tighter uppercase leading-[0.8] drop-shadow-2xl italic">Deploy<br/><span className="text-amber-500">The Swarm</span></h1>
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
                  <div className="bg-white/5 border border-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <Upload className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black tracking-tight uppercase">{file ? file.name : "Inject Target Artifact"}</p>
                  <p className="text-gray-600 text-[10px] mt-3 font-mono uppercase tracking-[0.4em]">Drop PDF Payload Here</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500 uppercase tracking-[0.5em] pl-1">
                    <Terminal className="w-4 h-4" /> Mission Parameters
                  </div>
                  <textarea 
                    placeholder="Paste the Job Description. The Sentinel will scan for vulnerabilities..." 
                    className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] h-56 focus:border-amber-500/50 outline-none resize-none transition-all focus:bg-white/10 font-mono text-sm leading-relaxed backdrop-blur-md"
                    value={jobDescription} 
                    onChange={e => setJobDescription(e.target.value)} 
                  />
                </div>

                <button 
                  onClick={handleUploadAndOptimize} 
                  disabled={!file || !jobDescription || processing || credits <= 0} 
                  className="w-full bg-amber-500 text-black py-8 rounded-[2.5rem] font-black text-3xl hover:bg-amber-400 disabled:opacity-20 transition-all flex items-center justify-center gap-4 active:scale-[0.97] shadow-[0_20px_50px_rgba(245,158,11,0.3)] group"
                >
                  {processing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="animate-spin w-10 h-10 mb-2" />
                      <span className="text-xs font-mono uppercase tracking-[0.3em]">{statusMessage}</span>
                    </div>
                  ) : credits <= 0 ? "INSUFFICIENT CREDITS" : "INITIATE OPTIMIZATION"}
                </button>
              </motion.div>
            )}

            {activeAgent === 'ats' && showResults && (
              <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                <div className="flex justify-between items-center border-b border-white/10 pb-10">
                  <div>
                    <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase italic">Mission Analysis</h2>
                    <p className="text-gray-500 font-mono text-[10px] mt-2 tracking-[0.4em] uppercase">Intelligence Feed Ready</p>
                  </div>
                  <button onClick={() => setShowResults(false)} className="px-8 py-3 border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-mono text-xs font-bold uppercase tracking-widest backdrop-blur-xl">New Mission</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white/5 p-12 rounded-[3rem] border border-white/5 flex justify-center backdrop-blur-2xl"><ScoreRing score={result.ats?.gap_analysis?.ats_score_before || 0} label="Original Score" color="#ef4444" /></div>
                  <div className="bg-amber-500/5 p-12 rounded-[3rem] border border-amber-500/20 flex justify-center backdrop-blur-2xl relative overflow-hidden">
                    <ScoreRing score={result.ats?.gap_analysis?.ats_score_after || 0} label="Optimized Score" color="#22c55e" isAfter />
                  </div>
                </div>

                {result.ats?.gap_analysis?.roast && (
                  <div className="p-10 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 left-0 h-1 w-full bg-red-500/40" />
                    <h3 className="text-red-500 font-black mb-4 flex items-center gap-3 tracking-[0.2em] text-xs uppercase"><AlertTriangle className="w-5 h-5" /> Sentinel Roast</h3>
                    <p className="text-gray-300 italic font-mono text-xl leading-relaxed">"{result.ats.gap_analysis.roast}"</p>
                  </div>
                )}

                <div className="space-y-6">
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] pl-1">Injected Keyword Matrix</p>
                   <div className="flex flex-wrap gap-3">
                    {result.ats?.gap_analysis?.missing_keywords?.map((kw: string, i: number) => (
                      <span key={i} className="px-6 py-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded-2xl text-xs font-mono font-black tracking-tight shadow-[0_0_15px_rgba(245,158,11,0.05)]">+{kw}</span>
                    ))}
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

function PulseBadge() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
      <Check className="w-3 h-3 text-green-500" />
      <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">Verified by Swarm Pulse</span>
    </div>
  )
}