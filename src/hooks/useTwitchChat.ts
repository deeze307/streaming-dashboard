import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { useUserConfig } from '@/contexts/UserConfigContext'

export const useTwitchChat = (): ChatMessage[] => {
  const { config } = useUserConfig()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const username = config.twitch_username
    const token = config.twitch_access_token
    if (!username) return

    const connect = () => {
      if (!mountedRef.current) return

      const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
      wsRef.current = ws

      ws.onopen = () => {
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands')
        if (token) {
          ws.send(`PASS oauth:${token}`)
          ws.send(`NICK ${username.toLowerCase()}`)
        } else {
          ws.send('NICK justinfan12345')
        }
        ws.send(`JOIN #${username.toLowerCase()}`)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        const lines = (event.data as string).split('\r\n')
        for (const line of lines) {
          if (line === 'PING :tmi.twitch.tv') {
            ws.send('PONG :tmi.twitch.tv')
            continue
          }
          const match = line.match(/^@\S+ :(\S+)!\S+ PRIVMSG #\S+ :(.+)$/)
          if (match) {
            const [, user, text] = match
            setMessages(prev => [
              ...prev,
              {
                id: `twitch-${Date.now()}-${Math.random()}`,
                platform: 'twitch' as const,
                username: user,
                text,
                timestamp: new Date(),
              },
            ].slice(-100))
          }
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
  }, [config.twitch_username, config.twitch_access_token])

  return messages
}
