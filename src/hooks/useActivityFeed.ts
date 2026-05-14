import { useState, useEffect } from 'react'
import { ActivityEvent } from '@/types'
import { useTwitchActivity } from './useTwitchActivity'
import { useYouTubeActivity } from './useYouTubeActivity'
import { useKickActivity } from './useKickActivity'

const STORAGE_KEY = 'activity_feed_v1'
const MAX_EVENTS = 15

function loadFromStorage(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw).map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
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
  const [events, setEvents] = useState<ActivityEvent[]>(loadFromStorage)

  const twitchEvents = useTwitchActivity()
  const youtubeEvents = useYouTubeActivity()
  const kickEvents = useKickActivity()

  useEffect(() => {
    const liveEvents = [...twitchEvents, ...youtubeEvents, ...kickEvents]
    if (liveEvents.length === 0) return

    setEvents(prev => {
      const byId = new Map<string, ActivityEvent>()
      for (const e of prev) byId.set(e.id, e)
      for (const e of liveEvents) byId.set(e.id, e)

      const merged = Array.from(byId.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_EVENTS)

      saveToStorage(merged)
      return merged
    })
  }, [twitchEvents, youtubeEvents, kickEvents])

  return events
}
