'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Layout, Target, Save, Loader2, Cpu, CheckCircle2 } from 'lucide-react'
import { runAgentShadow } from '@/app/actions/shadow'
import { useRouter } from 'next/navigation'

export default function ResumePreview() {
  const [isEditing, setIsEditing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()
  
  const [resumeData, setResumeData] = useState({
    name: 'SOUMYADIP DAS MAHAPATRA',
    email: 'soumyadip@jisuniversity.ac.in',
    college: 'JIS University',
    degree: 'B.Tech Computer Science',
    gradDate: 'June 2026',
    experience: 'Software Engineer Intern',
    company: 'SDE Swarm AI',
    bullet1: 'Developed full-stack features using Next.js 16 and Supabase.',
    bullet2: 'Optimized database queries reducing latency by 40%.',
    bullet3: 'Implemented AI-driven resume analysis agents.'
  })

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            handleFinishScan()
            return 100
          }
          return prev + 5
        })
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isScanning])

  const handleFinishScan = async () => {
    try {
      const data = await runAgentShadow(resumeData)
      setResult(data.message)
      setIsScanning(false)
      setIsEditing(false)
      // Refresh the page to show updated credit count in the header
      router.refresh() 
    } catch (error) {
      console.error("Swarm Deployment Failed:", error)
      setIsScanning(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setResumeData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className='relative flex flex-col items-center justify-center py-20 bg-[#f8f9fa] min-h-[90vh] overflow-hidden rounded-3xl border border-white/10'>
      
      {/* Control Button */}
      <button 
        onClick={() => isEditing ? setIsScanning(true) : setIsEditing(true)}
        disabled={isScanning || !!result}
        className='absolute top-6 right-10 bg-black text-white px-8 py-3 rounded-full font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all z-30 shadow-2xl disabled:opacity-50'
      >
        {isScanning ? <Loader2 className='w-5 h-5 animate-spin' /> : (result ? <CheckCircle2 className='w-5 h-5 text-green-400' /> : (isEditing ? <Cpu className='w-5 h-5' /> : <Layout className='w-5 h-5' />))}
        {isScanning ? `SCANNING ${scanProgress}%` : (result ? 'MISSION SUCCESS' : (isEditing ? 'DEPLOY AI SWARM' : 'ENTER EDIT MODE'))}
      </button>

      {/* Floating Badges */}
      <motion.div 
        animate={isScanning ? { rotate: 360, scale: [1, 1.2, 1], x: [0, 50, -50, 0] } : { y: [0, -10, 0] }} 
        transition={isScanning ? { duration: 1, repeat: Infinity } : { duration: 4, repeat: Infinity }}
        className='absolute left-10 top-1/4 bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-2 border border-blue-100 z-20 hidden lg:flex'
      >
        <Sparkles className={`w-5 h-5 ${isScanning ? 'text-amber-500' : 'text-blue-500'}`} />
        <span className='text-xs font-black uppercase tracking-widest text-gray-600 font-sans'>Neural Sync</span>
      </motion.div>

      {/* The Central Resume Card */}
      <motion.div 
        animate={isScanning ? { scale: 0.98, opacity: 0.9 } : { scale: 1, opacity: 1 }}
        className='relative w-full max-w-2xl bg-white shadow-[0_20px_80px_rgba(0,0,0,0.06)] rounded-sm p-16 min-h-[800px] border border-gray-100 z-10 mx-4 overflow-hidden'
      >
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className='absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-amber-400/20 to-transparent z-20 pointer-events-none'
            />
          )}
        </AnimatePresence>

        {result ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-6'>
            <div className='bg-amber-50 p-8 rounded-2xl border-2 border-amber-200'>
              <h3 className='text-amber-800 font-black uppercase text-sm mb-4 flex items-center gap-2'>
                <Cpu className='w-4 h-4' /> Agent Shadow Output
              </h3>
              <p className='text-gray-800 font-medium leading-relaxed whitespace-pre-wrap'>{result}</p>
            </div>
            <button onClick={() => setResult(null)} className='text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors'>
              Run New Mission
            </button>
          </motion.div>
        ) : (
          <div className='space-y-8 text-gray-800 font-serif'>
            <div className='border-b-4 border-gray-900 pb-6'>
              <input 
                disabled={!isEditing || isScanning}
                value={resumeData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className='text-5xl font-black tracking-tighter w-full bg-transparent outline-none uppercase'
              />
              <p className='text-sm text-gray-400 mt-2 font-sans font-bold tracking-widest uppercase'>
                {resumeData.email}  {resumeData.college}
              </p>
            </div>
            {/* Rest of the fields follow the same pattern... */}
          </div>
        )}
      </motion.div>

      <div className='absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse:60%_60%_at_50%_50%,#000:70%,transparent:100%)] opacity-50' />
    </div>
  )
}
