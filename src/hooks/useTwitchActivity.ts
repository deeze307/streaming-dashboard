import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ActivityEvent } from '@/types'
import { streamConfig } from '@/config'

const EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws'
const POLL_INTERVAL = 60_000

export const useTwitchActivity = (): ActivityEvent[] => {
  const [realtimeEvents, setRealtimeEvents] = useState<ActivityEvent[]>([])
  const [polledEvents, setPolledEvents] = useState<ActivityEvent[]>([])
  const broadcasterIdRef = useRef<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)

  const fetchRecent = useCallback(async () => {
    const bId = broadcasterIdRef.current
    if (!bId || !mountedRef.current) return

    try {
      const res = await fetch(`/api/twitch/activity?broadcasterId=${bId}`)
      if (!res.ok || !mountedRef.current) return
      const { follows, subscriptions } = await res.json()

      const events: ActivityEvent[] = []

      for (const f of follows ?? []) {
        events.push({
          id: `poll-follow-${f.user_id}`,
          type: 'follow',
          platform: 'twitch',
          username: f.user_name,
          timestamp: new Date(f.followed_at),
        })
      }

      for (const s of subscriptions ?? []) {
        if (s.user_id === bId) continue
        events.push({
          id: `poll-sub-${s.user_id}`,
          type: 'subscription',
          platform: 'twitch',
          username: s.user_name,
          timestamp: new Date(),
        })
      }

      if (events.length > 0 && mountedRef.current) setPolledEvents(events)
    } catch {}
  }, [])

  const subscribe = useCallback(async (
    sessionId: string,
    broadcasterId: string,
    type: string,
    version: string,
    condition: object
  ) => {
    try {
      await fetch('/api/twitch/eventsub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, broadcasterId, type, version, condition }),
      })
    } catch {}
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const { username } = streamConfig.twitch
    if (!username) return

    let pollInterval: ReturnType<typeof setInterval>

    const connect = async () => {
      if (!mountedRef.current) return

      if (!broadcasterIdRef.current) {
        try {
          const res = await fetch(`/api/twitch/stream?username=${username}`)
          const data = await res.json()
          broadcasterIdRef.current = data.broadcasterId
          if (!broadcasterIdRef.current) return
        } catch { return }
      }

      const bId = broadcasterIdRef.current!

      fetchRecent()
      clearInterval(pollInterval)
      pollInterval = setInterval(fetchRecent, POLL_INTERVAL)

      const ws = new WebSocket(EVENTSUB_URL)
      wsRef.current = ws

      ws.onmessage = async (raw) => {
        if (!mountedRef.current) return
        let msg: any
        try { msg = JSON.parse(raw.data) } catch { return }

        const { metadata, payload } = msg

        if (metadata?.message_type === 'session_welcome') {
          const sid = payload.session.id
          await subscribe(sid, bId, 'channel.follow', '2', { broadcaster_user_id: bId, moderator_user_id: bId })
          await subscribe(sid, bId, 'channel.subscribe', '1', { broadcaster_user_id: bId })
          await subscribe(sid, bId, 'channel.cheer', '1', { broadcaster_user_id: bId })
          await subscribe(sid, bId, 'channel.raid', '1', { to_broadcaster_user_id: bId })
        }

        if (metadata?.message_type === 'notification') {
          const ev = payload.event
          const type = metadata.subscription_type
          let event: ActivityEvent | null = null

          if (type === 'channel.follow')
            event = { id: `rt-follow-${Date.now()}`, type: 'follow', platform: 'twitch', username: ev.user_name, timestamp: new Date() }
          else if (type === 'channel.subscribe')
            event = { id: `rt-sub-${Date.now()}`, type: 'subscription', platform: 'twitch', username: ev.user_name, timestamp: new Date() }
          else if (type === 'channel.cheer')
            event = { id: `rt-cheer-${Date.now()}`, type: 'cheer', platform: 'twitch', username: ev.user_name, amount: ev.bits, timestamp: new Date() }
          else if (type === 'channel.raid')
            event = { id: `rt-raid-${Date.now()}`, type: 'raid', platform: 'twitch', username: ev.from_broadcaster_user_name, amount: ev.viewers, timestamp: new Date() }

          if (event && mountedRef.current) setRealtimeEvents((prev) => [event!, ...prev])
        }
      }

      ws.onclose = () => { if (mountedRef.current) setTimeout(connect, 5000) }
      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      mountedRef.current = false
      clearInterval(pollInterval)
      wsRef.current?.close()
    }
  }, [fetchRecent, subscribe])

  return useMemo(() => {
    const byId = new Map<string, ActivityEvent>()
    for (const e of polledEvents) byId.set(e.id, e)
    for (const e of realtimeEvents) byId.set(e.id, e)
    return Array.from(byId.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 15)
  }, [realtimeEvents, polledEvents])
}
