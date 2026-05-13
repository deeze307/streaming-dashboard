import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const YT_API = 'https://www.googleapis.com/youtube/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { liveChatId, pageToken } = req.query
  if (!liveChatId || typeof liveChatId !== 'string') {
    return res.status(400).json({ error: 'liveChatId requerido' })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    const { data } = await axios.get(`${YT_API}/liveChat/messages`, {
      params: {
        part: 'snippet,authorDetails',
        liveChatId,
        key: apiKey,
        ...(typeof pageToken === 'string' ? { pageToken } : {}),
      },
    })

    return res.json({
      items: data.items ?? [],
      nextPageToken: data.nextPageToken ?? null,
      pollingIntervalMillis: data.pollingIntervalMillis ?? 5000,
    })
  } catch {
    return res.status(500).json({ error: 'Error al obtener mensajes' })
  }
}
