import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { streamConfig } from '@/config'

export const useYouTubeChat = (): ChatMessage[] => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageTokenRef = useRef<string | null>(null)
  const liveChatIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const { channelId } = streamConfig.youtube
    if (!channelId) return

    const pollChat = async () => {
      if (!mountedRef.current || !liveChatIdRef.current) return
      try {
        const params = new URLSearchParams({ liveChatId: liveChatIdRef.current })
        if (pageTokenRef.current) params.set('pageToken', pageTokenRef.current)

        const res = await fetch(`/api/youtube/messages?${params}`)
        if (!mountedRef.current) return
        if (!res.ok) {
          timerRef.current = setTimeout(pollChat, 30000)
          return
        }

        const { items, nextPageToken, pollingIntervalMillis } = await res.json()
        pageTokenRef.current = nextPageToken ?? null

        if (items?.length) {
          const newMsgs: ChatMessage[] = items
            .filter((item: any) => item.snippet.type === 'textMessageEvent')
            .map((item: any) => ({
              id: item.id,
              platform: 'youtube' as const,
              username: item.authorDetails.displayName,
              text: item.snippet.textMessageDetails?.messageText ?? '',
              timestamp: new Date(item.snippet.publishedAt),
            }))

          if (newMsgs.length > 0) {
            setMessages((prev) => [...prev, ...newMsgs].slice(-100))
          }
        }

        timerRef.current = setTimeout(pollChat, pollingIntervalMillis ?? 5000)
      } catch {
        timerRef.current = setTimeout(pollChat, 30000)
      }
    }

    const initialize = async () => {
      try {
        const res = await fetch(`/api/youtube/live-chat-id?channelId=${channelId}`)
        if (!res.ok || !mountedRef.current) return
        const { liveChatId } = await res.json()
        if (!liveChatId) return
        liveChatIdRef.current = liveChatId
        pollChat()
      } catch {
        // Canal no en vivo o error de API
      }
    }

    initialize()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return messages
}
