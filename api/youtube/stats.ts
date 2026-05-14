import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const YT_API = 'https://www.googleapis.com/youtube/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { channelId, videoId } = req.query

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    let resolvedVideoId = typeof videoId === 'string' ? videoId : null
    let foundVideoId: string | null = null

    // Solo buscar si no hay videoId — esto consume 100 unidades
    if (!resolvedVideoId && channelId && typeof channelId === 'string') {
      const { data } = await axios.get(`${YT_API}/search`, {
        params: { part: 'id', channelId, eventType: 'live', type: 'video', key: apiKey, maxResults: 1 },
      })
      resolvedVideoId = data.items?.[0]?.id?.videoId ?? null
      foundVideoId = resolvedVideoId
    }

    if (!resolvedVideoId) return res.json({ viewers: 0, isLive: false })

    // Obtener stats del video (solo 1 unidad de cuota)
    const { data } = await axios.get(`${YT_API}/videos`, {
      params: { part: 'liveStreamingDetails,statistics', id: resolvedVideoId, key: apiKey },
    })

    const item = data.items?.[0]
    if (!item) return res.json({ viewers: 0, isLive: false, foundVideoId })

    const live = item.liveStreamingDetails
    if (live && !live.actualEndTime) {
      return res.json({
        viewers: parseInt(live.concurrentViewers ?? '0', 10),
        isLive: true,
        startedAt: live.actualStartTime ?? null,
        likes: parseInt(item.statistics?.likeCount ?? '0', 10),
        foundVideoId,
      })
    }

    return res.json({ viewers: 0, isLive: false, foundVideoId })
  } catch {
    return res.status(500).json({ error: 'Error al contactar YouTube' })
  }
}
