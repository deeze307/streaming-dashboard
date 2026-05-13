import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const YT_API = 'https://www.googleapis.com/youtube/v3'
const SEARCH_COOLDOWN = 10 * 60 * 1000
let cachedVideoId: string | null = null
let lastSearchTime = 0

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { channelId, videoId: manualVideoId } = req.query

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    let videoId = typeof manualVideoId === 'string' ? manualVideoId : null

    if (channelId && typeof channelId === 'string') {
      const now = Date.now()
      if (cachedVideoId && now - lastSearchTime < SEARCH_COOLDOWN) {
        videoId = cachedVideoId
      } else {
        const { data } = await axios.get(`${YT_API}/search`, {
          params: { part: 'id', channelId, eventType: 'live', type: 'video', key: apiKey, maxResults: 1 },
        })
        if (data.items?.[0]?.id?.videoId) {
          cachedVideoId = data.items[0].id.videoId
          lastSearchTime = now
          videoId = cachedVideoId
        }
      }
    }

    if (!videoId) return res.json({ viewers: 0, isLive: false })

    const { data } = await axios.get(`${YT_API}/videos`, {
      params: { part: 'liveStreamingDetails,statistics', id: videoId, key: apiKey },
    })

    const item = data.items?.[0]
    if (!item) return res.json({ viewers: 0, isLive: false })

    const live = item.liveStreamingDetails
    if (live && !live.actualEndTime) {
      return res.json({
        viewers: parseInt(live.concurrentViewers ?? '0', 10),
        isLive: true,
        startedAt: live.actualStartTime ?? null,
        likes: parseInt(item.statistics?.likeCount ?? '0', 10),
      })
    }

    return res.json({ viewers: 0, isLive: false })
  } catch {
    return res.status(500).json({ error: 'Error al contactar YouTube' })
  }
}
