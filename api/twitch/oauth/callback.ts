import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HELIX = 'https://api.twitch.tv/helix'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query

  if (error || !code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect('/settings?twitch_error=acceso_denegado')
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  const redirectUri = `${process.env.APP_URL}/api/twitch/oauth/callback`

  if (!clientId || !clientSecret) {
    return res.redirect('/settings?twitch_error=configuracion_incompleta')
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(state)
  if (authError || !user) {
    return res.redirect('/settings?twitch_error=no_autenticado')
  }

  try {
    const { data: tokenData } = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken: string = tokenData.access_token
    const refreshToken: string = tokenData.refresh_token

    const { data: userData } = await axios.get(`${HELIX}/users`, {
      headers: { 'Client-ID': clientId, Authorization: `Bearer ${accessToken}` },
    })

    const twitchUser = userData.data?.[0]
    const broadcasterId: string = twitchUser?.id ?? ''
    const twitchLogin: string = twitchUser?.login ?? ''

    await supabaseAdmin.from('user_configs').upsert(
      {
        user_id: user.id,
        twitch_access_token: accessToken,
        twitch_refresh_token: refreshToken,
        twitch_broadcaster_id: broadcasterId,
        ...(twitchLogin ? { twitch_username: twitchLogin } : {}),
      },
      { onConflict: 'user_id' }
    )

    return res.redirect('/settings?twitch_connected=1')
  } catch {
    return res.redirect('/settings?twitch_error=token_fallido')
  }
}
