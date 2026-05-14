import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return res.redirect('/settings?twitch_error=no_autenticado')
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return res.redirect('/settings?twitch_error=no_autenticado')
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  const redirectUri = `${process.env.APP_URL}/api/twitch/oauth/callback`
  if (!clientId) return res.status(500).json({ error: 'TWITCH_CLIENT_ID no configurado' })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'moderator:read:followers channel:read:subscriptions bits:read',
    state: token,
  })

  return res.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`)
}
