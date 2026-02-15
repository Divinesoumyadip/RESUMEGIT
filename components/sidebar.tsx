'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, Activity, Zap, User, Circle } from 'lucide-react'
import { checkBackendHealth } from '@/app/actions/health'

export default function Sidebar() {
  const pathname = usePathname()
  const [health, setHealth] = useState({ status: 'LOADING', latency: '' })

  useEffect(() => {
    const getHealth = async () => {
      const data = await checkBackendHealth()
      setHealth(data)
    }
    getHealth()
    const interval = setInterval(getHealth, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: 'Mission Control', icon: Layout, href: '/dashboard' },
    { label: 'System Telemetry', icon: Activity, href: '/dashboard/analytics' },
  ]

  return (
    <aside className="w-64 border-r border-gray-100 bg-white h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-10 px-2">
        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
        <span className="font-black italic text-xl tracking-tighter uppercase">
          RESUME<span className="text-amber-500">GOD</span>
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-400 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}

        {/* Reliability Monitor: Matches Juspay's "Self-Healing Systems" CoE */}
        <div className="mt-8 px-4 py-4 border border-gray-100 rounded-2xl bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Railway Node</span>
             <Circle className={`w-2 h-2 fill-current ${health.status === 'ONLINE' ? 'text-green-500' : 'text-red-500 animate-pulse'}`} />
          </div>
          <p className="text-xs font-black flex justify-between items-baseline">
            <span className={health.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'}>{health.status}</span>
            <span className="text-[10px] text-gray-400 font-mono">{health.latency}</span>
          </p>
        </div>
      </nav>

      <div className="pt-6 border-t border-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 text-gray-400 font-bold text-sm">
          <User className="w-4 h-4" />
          SDE-2026-JIS
        </div>
      </div>
    </aside>
  )
}
