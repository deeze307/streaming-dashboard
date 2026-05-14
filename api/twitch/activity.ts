import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const HELIX = 'https://api.twitch.tv/helix'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { broadcasterId } = req.query
  if (!broadcasterId || typeof broadcasterId !== 'string') {
    return res.status(400).json({ error: 'broadcasterId requerido' })
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  if (!clientId) return res.status(500).json({ error: 'TWITCH_CLIENT_ID no configurado' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : process.env.TWITCH_ACCESS_TOKEN
  if (!token) return res.status(500).json({ error: 'Token de Twitch no disponible' })

  const headers = { 'Client-ID': clientId, Authorization: `Bearer ${token}` }
  const follows: any[] = []
  const subscriptions: any[] = []

  await Promise.allSettled([
    axios.get(`${HELIX}/channels/followers`, { params: { broadcaster_id: broadcasterId, first: 15 }, headers })
      .then(({ data }) => follows.push(...(data.data ?? []))),

    axios.get(`${HELIX}/subscriptions`, { params: { broadcaster_id: broadcasterId, first: 10 }, headers })
      .then(({ data }) => subscriptions.push(...(data.data ?? []))),
  ])

  return res.json({ follows, subscriptions })
}
