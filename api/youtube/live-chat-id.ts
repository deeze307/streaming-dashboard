import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const YT_API = 'https://www.googleapis.com/youtube/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { channelId, videoId } = req.query
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    let resolvedVideoId = typeof videoId === 'string' ? videoId : null

    // Solo buscar si no hay videoId directo (cuesta 100 unidades)
    if (!resolvedVideoId && channelId && typeof channelId === 'string') {
      const { data: searchData } = await axios.get(`${YT_API}/search`, {
        params: { part: 'id', channelId, eventType: 'live', type: 'video', key: apiKey },
      })
      resolvedVideoId = searchData.items?.[0]?.id?.videoId ?? null
    }

    if (!resolvedVideoId) return res.status(404).json({ error: 'Sin stream en vivo' })

    const { data: videoData } = await axios.get(`${YT_API}/videos`, {
      params: { part: 'liveStreamingDetails', id: resolvedVideoId, key: apiKey },
    })

    const liveChatId = videoData.items?.[0]?.liveStreamingDetails?.activeLiveChatId
    if (!liveChatId) return res.status(404).json({ error: 'Chat no disponible' })

    res.setHeader('Cache-Control', 's-maxage=30')
    return res.json({ liveChatId, videoId: resolvedVideoId })
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      const status = err.response.status
      const reason = err.response.data?.error?.errors?.[0]?.reason ?? 'unknown'
      if (status === 403 && reason === 'quotaExceeded') {
        return res.status(429).json({ error: 'YouTube quota agotada', reason })
      }
      return res.status(status).json({ error: 'Error de YouTube API', reason })
    }
    return res.status(500).json({ error: 'Error al contactar YouTube' })
  }
}
