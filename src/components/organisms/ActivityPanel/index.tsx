import React, { useRef } from 'react'
import {
  Activity,
  Heart,
  Star,
  DollarSign,
  Tv,
  Zap,
  Users,
  LucideIcon,
} from 'lucide-react'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { ActivityEvent, ActivityEventType } from '@/types'
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/config'

const EVENT_CONFIG: Record<
  ActivityEventType,
  { label: string; icon: LucideIcon; color: string }
> = {
  follow: { label: 'Nuevo follow', icon: Heart, color: '#e040fb' },
  subscription: { label: 'Suscripción', icon: Star, color: '#f59e0b' },
  donation: { label: 'Donación', icon: DollarSign, color: '#10b981' },
  host: { label: 'Host', icon: Tv, color: '#8b5cf6' },
  raid: { label: 'Raid', icon: Users, color: '#00d4ff' },
  cheer: { label: 'Cheer', icon: Zap, color: '#fbbf24' },
}

function formatAmount(event: ActivityEvent): string | null {
  if (event.type === 'donation' && event.amount != null) return `$${event.amount}`
  if (event.type === 'cheer' && event.amount != null) return `${event.amount} bits`
  if (event.type === 'raid' && event.amount != null) return `${event.amount} viewers`
  return null
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  if (isToday) return time

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return `ayer ${time}`

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays < 7) {
    const day = date.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')
    return `${day} ${time}`
  }

  const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })
  return `${dateStr} ${time}`
}

const EventRow: React.FC<{ event: ActivityEvent; isNew: boolean }> = ({ event, isNew }) => {
  const cfg = EVENT_CONFIG[event.type]
  const Icon = cfg.icon
  const amount = formatAmount(event)
  const platformColor = PLATFORM_COLORS[event.platform]

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 ${
        isNew ? 'border-opacity-60' : 'border-transparent'
      }`}
      style={{
        backgroundColor: isNew ? cfg.color + '0d' : 'transparent',
        borderColor: isNew ? cfg.color + '44' : 'transparent',
      }}
    >
      {/* Event icon */}
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: cfg.color + '22' }}
      >
        <Icon size={14} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-white text-xs font-semibold truncate">{event.username}</span>
          <span className="text-gray-500 text-xs">{cfg.label}</span>
          {amount && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
            >
              {amount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-xs font-medium"
            style={{ color: platformColor }}
          >
            {PLATFORM_NAMES[event.platform]}
          </span>
          <span className="text-gray-600 text-xs">{formatTimestamp(event.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

export const ActivityPanel: React.FC = () => {
  const events = useActivityFeed()
  const listRef = useRef<HTMLDivElement>(null)

  return (
    <div className="h-full flex flex-col bg-panel-bg rounded-xl border border-panel-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-cyan" />
          <span className="text-white font-semibold text-sm">Actividad</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
          <span className="text-gray-500 text-xs">En vivo</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-1.5 border-b border-panel-border shrink-0 overflow-x-auto">
        {(Object.entries(EVENT_CONFIG) as [ActivityEventType, typeof EVENT_CONFIG[ActivityEventType]][]).map(
          ([type, cfg]) => {
            const Icon = cfg.icon
            return (
              <div key={type} className="flex items-center gap-1 shrink-0">
                <Icon size={10} style={{ color: cfg.color }} />
                <span className="text-gray-500 text-xs">{cfg.label}</span>
              </div>
            )
          }
        )}
      </div>

      {/* Events list */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-1 px-1 space-y-0.5">
        {events.map((event, index) => (
          <EventRow key={event.id} event={event} isNew={index === 0} />
        ))}
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 px-6 text-center">
            <Activity size={28} className="opacity-40" />
            <p className="text-sm">Esperando eventos del stream...</p>
            <p className="text-xs text-gray-700">Los follows, subs, raids y cheers de tu canal de Twitch aparecerán acá en tiempo real.</p>
          </div>
        )}
      </div>
    </div>
  )
}
