import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query

  if (error || !code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect('/settings?kick_error=acceso_denegado')
  }

  const clientId = process.env.KICK_CLIENT_ID
  const clientSecret = process.env.KICK_CLIENT_SECRET
  const redirectUri = `${process.env.APP_URL}/api/kick/oauth/callback`

  if (!clientId || !clientSecret) {
    return res.redirect('/settings?kick_error=configuracion_incompleta')
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(state)
  if (authError || !user) {
    return res.redirect('/settings?kick_error=no_autenticado')
  }

  try {
    const { data: tokenData } = await axios.post('https://kick.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    })

    await supabaseAdmin
      .from('user_configs')
      .upsert({ user_id: user.id, kick_access_token: tokenData.access_token }, { onConflict: 'user_id' })

    return res.redirect('/settings?kick_connected=1')
  } catch {
    return res.redirect('/settings?kick_error=token_fallido')
  }
}
