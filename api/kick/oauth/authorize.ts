import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.KICK_CLIENT_ID
  const redirectUri = `${process.env.APP_URL}/api/kick/oauth/callback`

  if (!clientId) return res.status(500).json({ error: 'KICK_CLIENT_ID no configurado' })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user:read channel:read events:subscribe chat:write',
  })

  return res.redirect(`https://id.kick.com/oauth/authorize?${params}`)
}
