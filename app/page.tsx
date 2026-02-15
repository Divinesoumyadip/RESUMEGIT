'use client'

import { SignInButton, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Shield, Activity, Coins } from 'lucide-react'
import { useEffect } from 'react'

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className='min-h-screen bg-[#050505] text-white font-rajdhani flex flex-col items-center justify-center relative overflow-hidden'>
      <div className='absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none' />
      
      <main className='relative z-10 text-center space-y-12 max-w-4xl px-6'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-[0.3em] font-mono'>
          <Zap className='w-4 h-4' /> Omega Engine Online
        </motion.div>

        <div className='space-y-4'>
          <h1 className='text-8xl font-black uppercase tracking-tighter italic font-orbitron'>RESUME<span className='text-amber-500'>GOD</span></h1>
          <p className='text-xl text-gray-400 font-mono tracking-widest uppercase'>The 9-Agent Tactical Swarm for SDE Mastery.</p>
        </div>

        <div className='grid grid-cols-3 gap-4'>
          <div className='p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md'><Shield className='mx-auto mb-2 text-amber-500' /> <p className='text-[10px] uppercase font-bold tracking-widest'>ATS Sentinel</p></div>
          <div className='p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md'><Activity className='mx-auto mb-2 text-blue-500' /> <p className='text-[10px] uppercase font-bold tracking-widest'>Culture Mirror</p></div>
          <div className='p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md'><Coins className='mx-auto mb-2 text-green-500' /> <p className='text-[10px] uppercase font-bold tracking-widest'>Salary Bounty</p></div>
        </div>

        <SignInButton mode='modal'>
          <button className='bg-amber-500 text-black px-12 py-6 rounded-2xl font-black text-2xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(245,158,11,0.4)] flex items-center gap-4 mx-auto font-orbitron uppercase italic'>
            Deploy The Swarm <ArrowRight />
          </button>
        </SignInButton>
      </main>
    </div>
  )
}
