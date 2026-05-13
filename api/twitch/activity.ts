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
  const { broadcasterId } = req.query
  if (!broadcasterId || typeof broadcasterId !== 'string') {
    return res.status(400).json({ error: 'broadcasterId requerido' })
  }

  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Credenciales de Twitch no configuradas' })
  }

  const headers = twitchHeaders()
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
