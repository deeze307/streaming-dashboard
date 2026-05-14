import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { useUserConfig } from '@/contexts/UserConfigContext'

const PUSHER_WS = 'wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false'

export const useKickChat = (): ChatMessage[] => {
  const { config } = useUserConfig()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const username = config.kick_username
    if (!username) return

    const connect = async () => {
      if (!mountedRef.current) return

      let chatroomId: number
      try {
        const res = await fetch(`/api/kick/stats?username=${username}`)
        if (!res.ok) return
        const data = await res.json()
        chatroomId = data.chatroomId
        if (!chatroomId) return
      } catch {
        return
      }

      if (!mountedRef.current) return

      const ws = new WebSocket(PUSHER_WS)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          event: 'pusher:subscribe',
          data: { auth: '', channel: `chatrooms.${chatroomId}.v2` },
        }))
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        let msg: any
        try { msg = JSON.parse(event.data) } catch { return }

        if (msg.event === 'pusher:ping') {
          ws.send(JSON.stringify({ event: 'pusher:pong', data: {} }))
          return
        }

        if (msg.event === 'App\\Events\\ChatMessageEvent') {
          let data: any
          try { data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data } catch { return }
          if (!data?.content) return

          setMessages(prev => [
            ...prev,
            {
              id: `kick-${data.id ?? Date.now()}`,
              platform: 'kick' as const,
              username: data.sender?.username ?? 'Unknown',
              text: data.content,
              timestamp: new Date(),
            },
          ].slice(-100))
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

  return messages
}
