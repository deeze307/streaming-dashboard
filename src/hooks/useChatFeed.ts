import { useMemo } from 'react'
import { ChatMessage } from '@/types'
import { useTwitchChat } from './useTwitchChat'
import { useYouTubeChat } from './useYouTubeChat'
import { useKickChat } from './useKickChat'

export const useChatFeed = (): ChatMessage[] => {
  const twitch = useTwitchChat()
  const youtube = useYouTubeChat()
  const kick = useKickChat()

  // Mezclar las tres plataformas y ordenar de más viejo a más nuevo (para scroll natural)
  return useMemo(
    () =>
      [...twitch, ...youtube, ...kick]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(-200),
    [twitch, youtube, kick]
  )
}
