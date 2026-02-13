'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Zap, Shield, FileText, Check, AlertTriangle, Loader2, TrendingUp, Download, Copy } from 'lucide-react'

// ─── INTERNAL API LOGIC (No Imports Needed!) ────────────────────────────────
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
  return res.json()
}

// ─── DASHBOARD COMPONENTS ──────────────────────────────────────────────────
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-black" style={{ borderColor: color, color: color }}>
        {Math.round(score)}
      </div>
      <span className="text-gray-400 text-xs font-mono uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ─── MAIN MISSION CONTROL ──────────────────────────────────────────────────
export default function MissionControl() {
  const [activeTab, setActiveTab] = useState('upload')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!file || !email) return
    setOptimizing(true)
    try {
      const res = await uploadResume(file, email)
      setResumeId(res.resume_id)
      setActiveTab('ats')
    } catch (e) { alert("Upload Failed") }
    setOptimizing(false)
  }

  const handleOptimize = async () => {
    if (!resumeId || !jobDescription) return
    setOptimizing(true)
    try {
      const res = await optimizeResume(resumeId, jobDescription)
      setResult(res)
    } catch (e) { alert("Optimization Failed") }
    setOptimizing(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans selection:bg-amber-500/30">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-2">
          <Zap className="text-amber-500 w-6 h-6 animate-pulse" />
          <span className="font-black text-2xl tracking-tighter italic">RESUMEGOD</span>
        </div>
        <div className="text-xs font-mono text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          SYSTEM ONLINE: V4.0
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {activeTab === 'upload' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div 
              className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl p-16 text-center hover:border-amber-500 transition-all cursor-pointer group"
              onClick={() => document.getElementById('f')?.click()}
            >
              <input id="f" type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Upload className="mx-auto w-12 h-12 text-gray-600 group-hover:text-amber-500 transition-colors mb-4" />
              <p className="text-xl font-bold text-gray-300">{file ? file.name : "Drop Resume PDF"}</p>
            </div>
            
            <div className="grid gap-4">
              <input 
                type="email" placeholder="Your Email Address" 
                className="w-full bg-gray-900 border border-gray-800 p-4 rounded-xl text-white focus:border-amber-500 outline-none transition-all"
                value={email} onChange={e => setEmail(e.target.value)} 
              />
              <textarea 
                placeholder="Paste Target Job Description..." 
                className="w-full bg-gray-900 border border-gray-800 p-4 rounded-xl h-48 text-white focus:border-amber-500 outline-none transition-all resize-none"
                value={jobDescription} onChange={e => setJobDescription(e.target.value)} 
              />
            </div>

            <button 
              onClick={handleUpload} disabled={!file || !email || optimizing}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg hover:bg-amber-500 transition-all disabled:opacity-30"
            >
              {optimizing ? "INITIALIZING..." : "START OPTIMIZATION"}
            </button>
          </motion.div>
        )}

        {activeTab === 'ats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-amber-500 italic">SENTINEL ACTIVE</h2>
                <p className="text-gray-500 font-mono text-sm">Target: {email}</p>
              </div>
              <button 
                onClick={handleOptimize} disabled={optimizing}
                className="bg-amber-500 text-black px-8 py-4 rounded-xl font-black hover:bg-amber-400 transition-all disabled:opacity-50"
              >
                {optimizing ? "CRUNCHING..." : "RE-OPTIMIZE"}
              </button>
            </div>

            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-10 rounded-3xl border border-red-900/20 text-center">
                  <ScoreRing score={result.ats.gap_analysis.ats_score_before} label="Initial Match" color="#ef4444" />
                </div>
                <div className="bg-gray-900 p-10 rounded-3xl border border-green-900/20 text-center shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                  <ScoreRing score={result.ats.gap_analysis.ats_score_after} label="Optimized Match" color="#22c55e" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}