import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { streamConfig } from '@/config'

export const useTwitchChat = (): ChatMessage[] => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const { username } = streamConfig.twitch
    if (!username) return

    const connect = () => {
      const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
      wsRef.current = ws

      ws.onopen = () => {
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands')
        ws.send('NICK justinfan12345')
        ws.send(`JOIN #${username.toLowerCase()}`)
      }

      ws.onmessage = (event) => {
        const lines = (event.data as string).split('\r\n')
        for (const line of lines) {
          if (line === 'PING :tmi.twitch.tv') {
            ws.send('PONG :tmi.twitch.tv')
            continue
          }
          // Formato: @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
          const match = line.match(/^@\S+ :(\S+)!\S+ PRIVMSG #\S+ :(.+)$/)
          if (match) {
            const [, user, text] = match
            setMessages((prev) =>
              [
                ...prev,
                {
                  id: `twitch-${Date.now()}-${Math.random()}`,
                  platform: 'twitch' as const,
                  username: user,
                  text,
                  timestamp: new Date(),
                },
              ].slice(-100)
            )
          }
        }
      }

      ws.onclose = () => {
        // Reconectar tras 5s si se cae
        setTimeout(connect, 5000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      wsRef.current?.close()
      // Evitar reconexión al desmontar
      wsRef.current = null
    }
  }, [])

  return messages
}
