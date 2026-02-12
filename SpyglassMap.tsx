'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, RefreshCw, MapPin, Building2, Clock,
  Globe, TrendingUp, Copy, Check, Radio
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { SpyglassStats, TrackingEvent } from '@/lib/api'

// ─── Props ────────────────────────────────────────────────────────────────────
interface SpyglassMapProps {
  resumeId: string
  stats: SpyglassStats | null
  onRefresh: () => Promise<void>
}

// ─── Formatters ────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function parseUA(ua: string): { device: string; browser: string } {
  const browser = ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Safari') ? 'Safari'
    : ua.includes('Edge') ? 'Edge'
    : 'Unknown'

  const device = ua.includes('Mobile') ? 'Mobile'
    : ua.includes('Tablet') ? 'Tablet'
    : 'Desktop'

  return { device, browser }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color = '#f59e0b',
  sublabel
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color?: string
  sublabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-god-card border border-god-border rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color + '15', border: `1px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="font-display font-black text-3xl text-god-text">{value}</p>
      <p className="text-xs font-mono text-god-subtext mt-1 uppercase tracking-widest">{label}</p>
      {sublabel && <p className="text-xs text-god-muted mt-0.5">{sublabel}</p>}
    </motion.div>
  )
}

// ─── Event Row ─────────────────────────────────────────────────────────────────
function EventRow({ event, index }: { event: TrackingEvent; index: number }) {
  const ua = parseUA(event.user_agent || '')
  const isNew = index === 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 py-3 px-4 rounded-xl border transition-colors
        ${isNew
          ? 'bg-god-amber/5 border-god-amber/20'
          : 'bg-god-card border-god-border hover:border-god-border'
        }`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
          ${isNew ? 'bg-god-amber/20' : 'bg-god-surface'}`}>
          <Eye className={`w-4 h-4 ${isNew ? 'text-god-amber' : 'text-god-subtext'}`} />
        </div>
        {isNew && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-god-amber animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-display font-semibold text-god-text truncate">
            {event.city || 'Unknown City'}, {event.country || '??'}
          </p>
          {event.company_hint && event.company_hint !== 'Unknown' && (
            <span className="text-xs bg-god-cyan/10 text-god-cyan border border-god-cyan/20 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
              {event.company_hint}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-god-muted font-mono">{ua.browser} · {ua.device}</span>
          {event.ip_address && (
            <span className="text-xs text-god-muted font-mono">{event.ip_address}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-xs font-mono text-god-amber">
          {event.viewed_at ? timeAgo(event.viewed_at) : '—'}
        </span>
        <span className={`text-xs font-mono mt-0.5 ${isNew ? 'text-god-amber' : 'text-god-muted'}`}>
          {event.event_type}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Minimal ASCII Map ────────────────────────────────────────────────────────
function GeoMap({ points }: { points: Array<{ lat: number; lng: number; city: string; company: string }> }) {
  if (!points.length) return null

  // Simple SVG world map representation
  // Normalize lat/lng to SVG coordinates
  const toSVG = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 800,
    y: ((90 - lat) / 180) * 400
  })

  return (
    <div className="bg-god-card border border-god-border rounded-xl p-4 overflow-hidden">
      <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-3">
        Geographic Spread
      </p>
      <div className="relative bg-god-surface rounded-lg overflow-hidden" style={{ paddingBottom: '50%' }}>
        <svg
          viewBox="0 0 800 400"
          className="absolute inset-0 w-full h-full"
          style={{ background: '#0a0a14' }}
        >
          {/* Grid lines */}
          {[-90, -60, -30, 0, 30, 60, 90].map((lat) => {
            const y = ((90 - lat) / 180) * 400
            return (
              <line
                key={lat}
                x1="0" y1={y} x2="800" y2={y}
                stroke="#1e1e30" strokeWidth="0.5"
              />
            )
          })}
          {[-180, -120, -60, 0, 60, 120, 180].map((lng) => {
            const x = ((lng + 180) / 360) * 800
            return (
              <line
                key={lng}
                x1={x} y1="0" x2={x} y2="400"
                stroke="#1e1e30" strokeWidth="0.5"
              />
            )
          })}

          {/* Plot tracking points */}
          {points.map((point, i) => {
            const { x, y } = toSVG(point.lat, point.lng)
            return (
              <g key={i}>
                <circle
                  cx={x} cy={y} r="6"
                  fill="rgba(245, 158, 11, 0.2)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x} cy={y} r="3"
                  fill="#f59e0b"
                />
                {/* Pulse ring */}
                <circle
                  cx={x} cy={y} r="10"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.5"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    from="6" to="20"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5" to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {points.slice(0, 5).map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs font-mono text-god-subtext">
            <MapPin className="w-3 h-3 text-god-amber" />
            <span>{p.city}</span>
            {p.company && p.company !== 'Unknown' && (
              <span className="text-god-cyan">({p.company})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SpyglassMap({ resumeId, stats, onRefresh }: SpyglassMapProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [activeView, setActiveView] = useState<'events' | 'geo' | 'timeline'>('events')

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }, [onRefresh])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000)
    return () => clearInterval(interval)
  }, [handleRefresh])

  const copyTrackingUrl = () => {
    if (stats?.tracking_url) {
      navigator.clipboard.writeText(stats.tracking_url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="bg-god-card border border-dashed border-god-border rounded-xl p-8 text-center">
          <Radio className="w-10 h-10 mx-auto mb-3 text-god-cyan opacity-50" />
          <p className="text-god-subtext text-sm">
            Tracking is active. Views will appear here in real-time.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 text-god-cyan text-sm hover:text-god-text transition-colors font-mono flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>
    )
  }

  const timelineData = (stats.timeline || []).slice(-14)
  const geoData = Object.entries(stats.geo_breakdown || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([country, views]) => ({ country, views }))

  return (
    <div className="space-y-5">
      {/* Tracking URL Banner */}
      <div className="bg-god-cyan/5 border border-god-cyan/20 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase text-god-cyan tracking-widest mb-1">
              Active Tracking URL
            </p>
            <p className="text-sm font-mono text-god-subtext truncate">
              {stats.tracking_url}
            </p>
            <p className="text-xs text-god-muted mt-1">
              Embedded in your resume PDF header. Every open triggers a log.
            </p>
          </div>
          <button
            onClick={copyTrackingUrl}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-god-cyan
                       hover:text-god-text transition-colors font-mono border border-god-cyan/30
                       px-3 py-1.5 rounded-lg hover:bg-god-cyan/10"
          >
            {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedUrl ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.total_views}
          color="#06b6d4"
        />
        <StatCard
          icon={Globe}
          label="Unique Viewers"
          value={stats.unique_viewers}
          color="#8b5cf6"
        />
        <StatCard
          icon={Building2}
          label="Companies"
          value={stats.company_hints?.length || 0}
          color="#f59e0b"
          sublabel={stats.company_hints?.[0] || undefined}
        />
        <StatCard
          icon={TrendingUp}
          label="Countries"
          value={Object.keys(stats.geo_breakdown || {}).length}
          color="#22c55e"
        />
      </div>

      {/* Company Hints */}
      {(stats.company_hints?.length || 0) > 0 && (
        <div className="bg-god-card border border-god-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase text-god-subtext tracking-widest">
              Company Signals
            </p>
            <span className="text-xs text-god-amber font-mono">ISP/Org Lookup</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.company_hints.map((company, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-1.5 text-xs bg-god-amber/10 text-god-amber
                           border border-god-amber/20 px-3 py-1.5 rounded-full font-mono"
              >
                <Building2 className="w-3 h-3" />
                {company}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-god-card p-1 rounded-xl border border-god-border">
        {(['events', 'geo', 'timeline'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest rounded-lg transition-all
              ${activeView === view
                ? 'bg-god-amber text-god-black font-bold'
                : 'text-god-subtext hover:text-god-text'
              }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Events View */}
      <AnimatePresence mode="wait">
        {activeView === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono text-god-subtext">
                {stats.events?.length || 0} events
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 text-xs text-god-subtext hover:text-god-amber transition-colors font-mono"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {(stats.events || []).length === 0 ? (
              <div className="text-center py-8 text-god-muted">
                <Radio className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Waiting for resume views...</p>
                <p className="text-xs mt-1">Share your resume PDF to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(stats.events || []).map((event, i) => (
                  <EventRow key={event.id} event={event} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Geo View */}
        {activeView === 'geo' && (
          <motion.div
            key="geo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Map */}
            {(stats.map_points || []).length > 0 && (
              <GeoMap points={stats.map_points} />
            )}

            {/* Bar Chart */}
            {geoData.length > 0 && (
              <div className="bg-god-card border border-god-border rounded-xl p-4">
                <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-4">
                  Views by Country
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={geoData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="country"
                      tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#13131f',
                        border: '1px solid #1e1e30',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#e2e8f0'
                      }}
                      cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                    />
                    <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                      {geoData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === 0 ? '#f59e0b' : `rgba(245, 158, 11, ${0.6 - i * 0.07})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}

        {/* Timeline View */}
        {activeView === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-god-card border border-god-border rounded-xl p-4">
              <p className="text-xs font-mono uppercase text-god-subtext tracking-widest mb-4">
                Views Over Time (Last 14 Days)
              </p>
              {timelineData.length === 0 ? (
                <div className="text-center py-8 text-god-muted text-sm">
                  No timeline data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#13131f',
                        border: '1px solid #1e1e30',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#e2e8f0'
                      }}
                      cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
                    />
                    <Bar dataKey="views" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
