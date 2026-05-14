import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username requerido' })
  }

  try {
    const { data } = await axios.get(`https://kick.com/api/v1/channels/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      timeout: 8000,
    })

    if (data.livestream) {
      return res.json({
        viewers: data.livestream.viewer_count ?? 0,
        isLive: true,
        startedAt: data.livestream.created_at ?? null,
      })
    }

    return res.json({ viewers: 0, isLive: false })
  } catch {
    return res.json({ viewers: 0, isLive: false })
  }
}
