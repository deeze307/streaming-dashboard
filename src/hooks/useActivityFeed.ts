import { useState, useEffect } from 'react'
import { ActivityEvent } from '@/types'
import { useTwitchActivity } from './useTwitchActivity'

const STORAGE_KEY = 'activity_feed_v1'
const MAX_EVENTS = 15

function loadFromStorage(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // JSON no preserva Date, hay que restaurarlos
    return parsed.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
  } catch {
    return []
  }
}

function saveToStorage(events: ActivityEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {}
}

export const useActivityFeed = (): ActivityEvent[] => {
  // Inicializar desde localStorage (persiste entre recargas)
  const [events, setEvents] = useState<ActivityEvent[]>(loadFromStorage)

  const liveEvents = useTwitchActivity()

  // Cada vez que llegan eventos en vivo, mergear con los persistidos (FIFO, máx 15)
  useEffect(() => {
    if (liveEvents.length === 0) return

    setEvents((prev) => {
      // Deduplicar por ID: los eventos en vivo tienen prioridad
      const byId = new Map<string, ActivityEvent>()
      for (const e of prev) byId.set(e.id, e)
      for (const e of liveEvents) byId.set(e.id, e)

      const merged = Array.from(byId.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_EVENTS)

      saveToStorage(merged)
      return merged
    })
  }, [liveEvents])

  return events
}
