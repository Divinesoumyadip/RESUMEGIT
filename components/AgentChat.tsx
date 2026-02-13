'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Send, Cpu, User, Zap, Shield, Eye, Mic,
  PenTool, BookOpen, Loader2, Minimize2
} from 'lucide-react'
import { sendChatMessage } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  timestamp: Date
  typing?: boolean
}

interface AgentChatProps {
  resumeId?: string
  onClose: () => void
}

// ─── Agent Config ─────────────────────────────────────────────────────────────
const AGENT_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ATS_SENTINEL: { icon: Shield, color: '#f59e0b', label: 'ATS Sentinel' },
  SPYGLASS: { icon: Eye, color: '#06b6d4', label: 'Spyglass' },
  INTERVIEWER: { icon: Mic, color: '#8b5cf6', label: 'The Interviewer' },
  GHOSTWRITER: { icon: PenTool, color: '#ec4899', label: 'Ghostwriter' },
  AFFILIATE: { icon: BookOpen, color: '#22c55e', label: 'The Affiliate' },
  ORCHESTRATOR: { icon: Cpu, color: '#f59e0b', label: 'Career Companion' },
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  "Roast my resume. Don't hold back.",
  "What are the top 3 reasons I'd get rejected?",
  "Which keywords am I missing for this role?",
  "Give me my hardest interview question.",
  "Who has viewed my resume?",
  "Write my LinkedIn announcement post.",
  "What skills should I learn next?",
]

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-god-card border border-god-border flex items-center justify-center flex-shrink-0">
        <Cpu className="w-4 h-4 text-god-amber" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-mono text-god-amber">{agentName}</span>
        <div className="flex items-center gap-1 bg-god-card border border-god-border rounded-xl px-4 py-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-god-amber"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const agentMeta = message.agent ? AGENT_META[message.agent] : AGENT_META['ORCHESTRATOR']
  const AgentIcon = agentMeta?.icon || Cpu

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        className="flex items-start gap-3 justify-end px-4 py-2"
      >
        <div className="flex flex-col items-end gap-1 max-w-xs">
          <div className="msg-user rounded-xl rounded-tr-sm px-4 py-3 text-sm text-god-text leading-relaxed">
            {message.content}
          </div>
          <span className="text-xs text-god-muted font-mono">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-god-amber/20 border border-god-amber/30 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-god-amber" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      className="flex items-start gap-3 px-4 py-2"
    >
      <div
        className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0"
        style={{
          background: (agentMeta?.color || '#f59e0b') + '15',
          borderColor: (agentMeta?.color || '#f59e0b') + '30'
        }}
      >
        <AgentIcon className="w-4 h-4" style={{ color: agentMeta?.color || '#f59e0b' }} />
      </div>
      <div className="flex flex-col gap-1 max-w-xs">
        <span
          className="text-xs font-mono"
          style={{ color: agentMeta?.color || '#f59e0b' }}
        >
          {agentMeta?.label || 'Agent'}
        </span>
        <div className="msg-agent rounded-xl rounded-tl-sm px-4 py-3 text-sm text-god-text leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <span className="text-xs text-god-muted font-mono">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AgentChat({ resumeId, onClose }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: resumeId
        ? "Swarm online. Your resume is loaded. I can optimize it, prep you for interviews, track who viewed it, write your LinkedIn post, or identify skill gaps. What's the mission?"
        : "ResumeGod V4.0 online. Upload your resume to activate the full swarm. Or ask me anything about your job search strategy.",
      agent: 'ORCHESTRATOR',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [isTyping, setIsTyping] = useState(false)
  const [typingAgent, setTypingAgent] = useState('ORCHESTRATOR')
  const [minimized, setMinimized] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setTypingAgent('ORCHESTRATOR')

    try {
      const response = await sendChatMessage(trimmed, sessionId, resumeId)
      setSessionId(response.session_id)
      setTypingAgent(response.agent || 'ORCHESTRATOR')

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        agent: response.agent || 'ORCHESTRATOR',
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Connection lost. Check backend is running on port 8000.",
        agent: 'ORCHESTRATOR',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMsg])
    }

    setIsTyping(false)
  }, [isTyping, sessionId, resumeId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-god-amber text-god-black
                   w-14 h-14 rounded-full flex items-center justify-center
                   shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-transform"
      >
        <Cpu className="w-6 h-6" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col
                 bg-god-surface border border-god-border rounded-2xl
                 shadow-[0_0_40px_rgba(0,0,0,0.6),0_0_80px_rgba(245,158,11,0.05)]
                 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-god-border bg-god-card">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 bg-god-amber/20 rounded-lg border border-god-amber/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-god-amber" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-god-green border-2 border-god-card" />
          </div>
          <div>
            <p className="font-display font-bold text-god-text text-sm">Career Companion</p>
            <p className="text-xs text-god-green font-mono">5 agents online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-8 h-8 flex items-center justify-center text-god-subtext
                       hover:text-god-amber hover:bg-god-border rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-god-subtext
                       hover:text-god-red hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator agentName={AGENT_META[typingAgent]?.label || 'Agent'} />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-god-border">
          <p className="text-xs font-mono text-god-muted mb-2">Quick commands</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs bg-god-card border border-god-border text-god-subtext
                           px-2.5 py-1 rounded-full hover:border-god-amber/40 hover:text-god-amber
                           transition-colors font-mono"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-god-border bg-god-card">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the swarm..."
            rows={1}
            className="flex-1 bg-god-surface border border-god-border rounded-xl px-4 py-2.5
                       text-sm text-god-text placeholder-god-muted font-body resize-none
                       focus:outline-none focus:border-god-amber transition-colors
                       max-h-24 overflow-y-auto"
            style={{
              height: 'auto',
              minHeight: '42px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 96) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center
                       bg-god-amber text-god-black rounded-xl
                       hover:bg-god-amber-glow disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
          >
            {isTyping
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-god-muted mt-1 font-mono">
          ↵ to send · shift+↵ for newline
        </p>
      </div>
    </motion.div>
  )
}
