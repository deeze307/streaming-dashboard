import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { useUserConfig } from '@/contexts/UserConfigContext'
import { setLiveChatId } from '@/services/api/youtube'

export const useYouTubeChat = (): ChatMessage[] => {
  const { config } = useUserConfig()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageTokenRef = useRef<string | null>(null)
  const liveChatIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const { youtube_channel_id, youtube_video_id } = config
    if (!youtube_channel_id && !youtube_video_id) return

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
            setMessages(prev => [...prev, ...newMsgs].slice(-100))
          }
        }

        timerRef.current = setTimeout(pollChat, pollingIntervalMillis ?? 5000)
      } catch {
        timerRef.current = setTimeout(pollChat, 30000)
      }
    }

    const initialize = async () => {
      try {
        // Prefer videoId (1 quota unit) over channelId search (100 units)
        const params = new URLSearchParams()
        if (youtube_video_id) params.set('videoId', youtube_video_id)
        else params.set('channelId', youtube_channel_id)

        const res = await fetch(`/api/youtube/live-chat-id?${params}`)
        if (!res.ok || !mountedRef.current) return
        const { liveChatId } = await res.json()
        if (!liveChatId) return
        liveChatIdRef.current = liveChatId
        setLiveChatId(liveChatId)
        pollChat()
      } catch {}
    }

    initialize()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [config.youtube_channel_id, config.youtube_video_id])

  return messages
}
