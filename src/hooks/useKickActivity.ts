import { useState, useEffect, useRef } from 'react'
import { ActivityEvent } from '@/types'
import { useUserConfig } from '@/contexts/UserConfigContext'

const PUSHER_WS = 'wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false'

export const useKickActivity = (): ActivityEvent[] => {
  const { config } = useUserConfig()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const username = config.kick_username
    if (!username) return

    const connect = async () => {
      if (!mountedRef.current) return

      let channelId: number
      try {
        const res = await fetch(`/api/kick/stats?username=${username}`)
        if (!res.ok) return
        const data = await res.json()
        channelId = data.channelId
        if (!channelId) return
      } catch {
        return
      }

      if (!mountedRef.current) return

      const ws = new WebSocket(PUSHER_WS)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          event: 'pusher:subscribe',
          data: { auth: '', channel: `channel.${channelId}` },
        }))
      }

      ws.onmessage = (raw) => {
        if (!mountedRef.current) return
        let msg: any
        try { msg = JSON.parse(raw.data) } catch { return }

        if (msg.event === 'pusher:ping') {
          ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }))
          return
        }

        let data: any
        try { data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data } catch { return }

        const now = new Date()
        let event: ActivityEvent | null = null

        if (msg.event === 'App\\Events\\FollowersUpdated') {
          const follower = data.user ?? data.follower
          if (!follower) return
          event = {
            id: `kick-follow-${follower.id ?? Date.now()}`,
            type: 'follow',
            platform: 'kick',
            username: follower.username ?? follower.slug ?? 'Unknown',
            timestamp: now,
          }
        } else if (msg.event === 'App\\Events\\SubscriptionEvent') {
          event = {
            id: `kick-sub-${Date.now()}`,
            type: 'subscription',
            platform: 'kick',
            username: data.subscriber?.username ?? data.username ?? 'Unknown',
            timestamp: now,
          }
        } else if (msg.event === 'App\\Events\\GiftsLeaderboardUpdated') {
          const gifter = data.gifter ?? data.leaderboard?.[0]
          if (!gifter) return
          event = {
            id: `kick-gift-${Date.now()}`,
            type: 'subscription',
            platform: 'kick',
            username: gifter.username ?? 'Unknown',
            amount: data.gifted_quantity ?? 1,
            timestamp: now,
          }
        }

        if (event && mountedRef.current) {
          setEvents(prev => [event!, ...prev].slice(0, 50))
        }
      }

      ws.onclose = () => {
        if (mountedRef.current) setTimeout(connect, 5000)
      }
      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      mountedRef.current = false
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [config.kick_username])

  return events
}
