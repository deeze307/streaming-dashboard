import { useState, useEffect, useRef, useCallback } from 'react'
import { ActivityEvent } from '@/types'
import { getLiveChatId } from '@/services/api/youtube'

const POLL_INTERVAL = 30_000 // 30s — less frequent than chat polling

export const useYouTubeActivity = (): ActivityEvent[] => {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const pageTokenRef = useRef<string | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const mountedRef = useRef(true)

  const poll = useCallback(async () => {
    const liveChatId = getLiveChatId()
    if (!liveChatId || !mountedRef.current) return

    try {
      const params = new URLSearchParams({ liveChatId })
      if (pageTokenRef.current) params.set('pageToken', pageTokenRef.current)

      const res = await fetch(`/api/youtube/messages?${params}`)
      if (!res.ok || !mountedRef.current) return

      const { items, nextPageToken } = await res.json()
      pageTokenRef.current = nextPageToken ?? null

      const newEvents: ActivityEvent[] = []

      for (const item of items ?? []) {
        if (seenIdsRef.current.has(item.id)) continue
        seenIdsRef.current.add(item.id)

        const type = item.snippet?.type
        const author = item.authorDetails?.displayName ?? 'Anónimo'
        const publishedAt = new Date(item.snippet?.publishedAt ?? Date.now())

        if (type === 'superChatEvent') {
          const details = item.snippet.superChatDetails
          newEvents.push({
            id: `yt-superchat-${item.id}`,
            type: 'donation',
            platform: 'youtube',
            username: author,
            amount: details?.amountMicros ? details.amountMicros / 1_000_000 : undefined,
            message: details?.userComment || undefined,
            timestamp: publishedAt,
          })
        } else if (type === 'newSponsorEvent') {
          newEvents.push({
            id: `yt-member-${item.id}`,
            type: 'subscription',
            platform: 'youtube',
            username: author,
            timestamp: publishedAt,
          })
        } else if (type === 'memberMilestoneChatEvent') {
          const details = item.snippet.memberMilestoneChatDetails
          newEvents.push({
            id: `yt-milestone-${item.id}`,
            type: 'subscription',
            platform: 'youtube',
            username: author,
            message: details?.userComment || undefined,
            timestamp: publishedAt,
          })
        }
      }

      if (newEvents.length > 0 && mountedRef.current) {
        setEvents(prev => [...newEvents, ...prev].slice(0, 50))
      }
    } catch {}
  }, [])

  useEffect(() => {
    mountedRef.current = true
    poll()
    const interval = setInterval(poll, POLL_INTERVAL)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [poll])

  return events
}
