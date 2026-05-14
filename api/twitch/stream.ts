import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const HELIX = 'https://api.twitch.tv/helix'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username requerido' })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return res.status(500).json({ error: 'TWITCH_CLIENT_ID no configurado' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : process.env.TWITCH_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Twitch no disponible' })

  const headers = { 'Client-ID': clientId, Authorization: `Bearer ${token}` }

  try {
    const [{ data: streamData }, { data: userData }] = await Promise.all([
      axios.get(`${HELIX}/streams`, { params: { user_login: username }, headers }),
      axios.get(`${HELIX}/users`, { params: { login: username }, headers }),
    ])

    const stream = streamData.data?.[0]
    const broadcasterId = userData.data?.[0]?.id ?? null

    return res.json({
      isLive: !!stream,
      viewers: stream?.viewer_count ?? 0,
      startedAt: stream?.started_at ?? null,
      broadcasterId,
    })
  } catch {
    return res.status(500).json({ error: 'Error al contactar Twitch' })
  }
}
