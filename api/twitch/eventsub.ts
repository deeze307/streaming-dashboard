import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const HELIX = 'https://api.twitch.tv/helix'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { sessionId, broadcasterId, type, version, condition } = req.body
  if (!sessionId || !broadcasterId || !type) {
    return res.status(400).json({ error: 'sessionId, broadcasterId y type son requeridos' })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return res.status(500).json({ error: 'TWITCH_CLIENT_ID no configurado' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : process.env.TWITCH_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Twitch no disponible' })

  try {
    const { data, status } = await axios.post(
      `${HELIX}/eventsub/subscriptions`,
      { type, version, condition, transport: { method: 'websocket', session_id: sessionId } },
      {
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${token}`,
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
