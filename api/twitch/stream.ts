import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const HELIX = 'https://api.twitch.tv/helix'

function twitchHeaders() {
  return {
    'Client-ID': process.env.TWITCH_CLIENT_ID ?? '',
    Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN ?? ''}`,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username requerido' })
  }

  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Credenciales de Twitch no configuradas' })
  }

  try {
    const [{ data: streamData }, { data: userData }] = await Promise.all([
      axios.get(`${HELIX}/streams`, { params: { user_login: username }, headers: twitchHeaders() }),
      axios.get(`${HELIX}/users`, { params: { login: username }, headers: twitchHeaders() }),
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
