import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare, ChevronsDown } from 'lucide-react'
import { useChatFeed } from '@/hooks/useChatFeed'
import { ChatMessage, Platform } from '@/types'
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/config'

const ALL_PLATFORMS: Platform[] = ['twitch', 'youtube', 'kick']

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const MessageRow: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const color = PLATFORM_COLORS[msg.platform]
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors">
      <div
        className="shrink-0 mt-1 w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        title={PLATFORM_NAMES[msg.platform]}
      />
      <div className="flex-1 min-w-0 leading-snug">
        <span className="font-semibold text-xs" style={{ color }}>
          {msg.username}
        </span>
        <span className="text-gray-500 text-xs mx-1">·</span>
        <span className="text-gray-300 text-xs break-words">{msg.text}</span>
      </div>
      <span className="shrink-0 text-gray-600 text-xs">{formatTime(msg.timestamp)}</span>
    </div>
  )
}

export const MultiChat: React.FC = () => {
  const allMessages = useChatFeed()
  const [filter, setFilter] = useState<Platform | 'all'>('all')
  const listRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const [showJumpBtn, setShowJumpBtn] = useState(false)

  const messages = filter === 'all' ? allMessages : allMessages.filter((m) => m.platform === filter)

  // Auto-scroll al fondo cuando llegan mensajes nuevos (si el usuario está al fondo)
  useEffect(() => {
    if (atBottomRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length])

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
      atBottomRef.current = true
      setShowJumpBtn(false)
    }
  }

  const handleScroll = () => {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40
    atBottomRef.current = isAtBottom
    setShowJumpBtn(!isAtBottom)
  }

  // Contadores por plataforma
  const counts = ALL_PLATFORMS.reduce<Record<Platform, number>>((acc, p) => {
    acc[p] = allMessages.filter((m) => m.platform === p).length
    return acc
  }, {} as Record<Platform, number>)

  return (
    <div className="h-full flex flex-col bg-panel-bg rounded-xl border border-panel-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-brand-cyan" />
          <span className="text-white font-semibold text-sm">Multichat</span>
          <span className="text-gray-500 text-xs">({allMessages.length})</span>
        </div>

        {/* Filtros */}
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            Todos
          </button>
          {ALL_PLATFORMS.map((platform) => {
            const color = PLATFORM_COLORS[platform]
            const isActive = filter === platform
            return (
              <button
                key={platform}
                onClick={() => setFilter(platform)}
                className="px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1"
                style={
                  isActive
                    ? { backgroundColor: color + '22', color, border: `1px solid ${color}55` }
                    : { color: '#6b7280', border: '1px solid transparent' }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? color : '#4b5563' }}
                />
                {PLATFORM_NAMES[platform]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-b border-panel-border shrink-0">
        {ALL_PLATFORMS.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] }} />
            <span className="text-gray-500 text-xs">
              {PLATFORM_NAMES[p]}
              <span className="ml-1 text-gray-600">({counts[p]})</span>
            </span>
          </div>
        ))}
      </div>

      {/* Messages — scroll normal de arriba hacia abajo */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto py-1"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 px-6 text-center">
              <MessageSquare size={28} className="opacity-40" />
              <p className="text-sm">Esperando mensajes...</p>
              <p className="text-xs text-gray-700">
                Los mensajes del chat de Twitch (dcode307) y YouTube aparecerán acá cuando estés en vivo.
              </p>
            </div>
          ) : (
            messages.map((msg) => <MessageRow key={msg.id} msg={msg} />)
          )}
        </div>

        {/* Botón "ir al final" cuando el usuario scrolleó hacia arriba */}
        {showJumpBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-panel-bg border border-brand-cyan/30 text-xs text-brand-cyan hover:bg-brand-cyan/10 transition-all shadow-lg"
          >
            <ChevronsDown size={13} />
            Ir al final
          </button>
        )}
      </div>
    </div>
  )
}
