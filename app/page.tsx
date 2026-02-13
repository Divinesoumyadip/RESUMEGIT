'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Zap, Eye, Mic, PenTool, BookOpen, FileText, Shield, Loader2 } from 'lucide-react'

import AgentChat from '../components/AgentChat'
import SpyglassMap from '../components/SpyglassMap'
import {
  uploadResume, optimizeResume, getSpyglassStats, gradeAnswer,
  getPdfDownloadUrl, type OptimizationResult, type SpyglassStats,
  type InterviewQuestion, getDifficultyColor
} from '../lib/api'

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState('upload')
  const [resumeId, setResumeId] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  const handleUpload = useCallback((id, token) => {
    setResumeId(id)
    setActiveTab('ats')
  }, [])

  const handleOptimize = useCallback(async () => {
    if (!resumeId || !jobDescription) return
    setOptimizing(true)
    try {
      const res = await optimizeResume(resumeId, jobDescription)
      setResult(res)
    } catch (e) { console.error(e) } finally { setOptimizing(false) }
  }, [resumeId, jobDescription])

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-12 max-w-7xl mx-auto border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-amber-500 w-6 h-6" />
          <span className="font-black text-2xl tracking-tighter">RESUMEGOD</span>
        </div>
        <button onClick={() => setChatOpen(!chatOpen)} className="bg-gray-900 px-4 py-2 rounded-lg text-xs border border-gray-700 uppercase tracking-widest text-amber-500">
          Agent Swarm Chat
        </button>
      </header>
      <main className="max-w-4xl mx-auto">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl p-12 text-center hover:border-amber-500/50 transition-all cursor-pointer" onClick={() => document.getElementById('f').click()}>
              <input id="f" type="file" hidden onChange={(e) => {
                const file = e.target.files[0];
                const email = prompt("Enter your email to continue:");
                if (file && email) {
                  uploadResume(file, email).then(res => handleUpload(res.resume_id, res.tracking_token));
                }
              }} />
              <Upload className="mx-auto w-12 h-12 text-amber-500 mb-4" />
              <p className="text-xl font-bold">Select Resume PDF</p>
            </div>
            <textarea placeholder="Target Job Description" className="w-full bg-gray-900 border border-gray-800 p-4 rounded-xl h-40 text-white" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
          </div>
        )}
        {activeTab === 'ats' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-gray-900 p-6 rounded-2xl border border-gray-800">
              <h2 className="text-2xl font-bold text-amber-500">ATS Sentinel</h2>
              <button onClick={handleOptimize} disabled={optimizing} className="bg-amber-500 text-black px-8 py-3 rounded-xl font-black disabled:opacity-50">
                {optimizing ? 'CRUNCHING...' : 'RUN OPTIMIZATION'}
              </button>
            </div>
            {result && (
               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-900 p-8 rounded-2xl border border-red-900/30 text-center">
                    <p className="text-5xl font-black text-red-500">{Math.round(result.ats.gap_analysis.ats_score_before)}</p>
                  </div>
                  <div className="bg-gray-900 p-8 rounded-2xl border border-green-900/30 text-center">
                    <p className="text-5xl font-black text-green-500">{Math.round(result.ats.gap_analysis.ats_score_after)}</p>
                  </div>
               </div>
            )}
          </div>
        )}
      </main>
      <AnimatePresence>
        {chatOpen && <AgentChat resumeId={resumeId || undefined} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
