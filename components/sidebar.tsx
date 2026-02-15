'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, Activity, Zap, ShieldCheck, User, Settings } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Mission Control', icon: Layout, href: '/dashboard' },
    { label: 'System Telemetry', icon: Activity, href: '/dashboard/analytics' },
    { label: 'Agent Status', icon: Zap, href: '#' },
    { label: 'Security Logs', icon: ShieldCheck, href: '#' },
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
                isActive 
                ? 'bg-black text-white shadow-lg shadow-black/10' 
                : 'text-gray-400 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 text-gray-400 font-bold text-sm cursor-not-allowed">
          <User className="w-4 h-4" />
          SDE-Profile
        </div>
      </div>
    </aside>
  )
}
