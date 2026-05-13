import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const YT_API = 'https://www.googleapis.com/youtube/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { channelId } = req.query
  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ error: 'channelId requerido' })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    const { data: searchData } = await axios.get(`${YT_API}/search`, {
      params: { part: 'id', channelId, eventType: 'live', type: 'video', key: apiKey },
    })

    const videoId = searchData.items?.[0]?.id?.videoId
    if (!videoId) return res.status(404).json({ error: 'Sin stream en vivo' })

    const { data: videoData } = await axios.get(`${YT_API}/videos`, {
      params: { part: 'liveStreamingDetails', id: videoId, key: apiKey },
    })

    const liveChatId = videoData.items?.[0]?.liveStreamingDetails?.activeLiveChatId
    if (!liveChatId) return res.status(404).json({ error: 'Chat no disponible' })

    res.setHeader('Cache-Control', 's-maxage=30')
    return res.json({ liveChatId })
  } catch {
    return res.status(500).json({ error: 'Error al contactar YouTube' })
  }
}
