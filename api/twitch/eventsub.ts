import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const HELIX = 'https://api.twitch.tv/helix'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { sessionId, broadcasterId, type, version, condition } = req.body
  if (!sessionId || !broadcasterId || !type) {
    return res.status(400).json({ error: 'sessionId, broadcasterId y type son requeridos' })
  }

  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Credenciales de Twitch no configuradas' })
  }

  try {
    const { data, status } = await axios.post(
      `${HELIX}/eventsub/subscriptions`,
      { type, version, condition, transport: { method: 'websocket', session_id: sessionId } },
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
        },
      }
    )
    return res.status(status).json(data)
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data)
    }
    return res.status(500).json({ error: 'Error al crear suscripción EventSub' })
  }
}
