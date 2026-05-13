import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query

  if (error || !code || typeof code !== 'string') {
    return res.redirect('/settings?kick_error=acceso_denegado')
  }

  const clientId = process.env.KICK_CLIENT_ID
  const clientSecret = process.env.KICK_CLIENT_SECRET
  const redirectUri = `${process.env.APP_URL}/api/kick/oauth/callback`

  if (!clientId || !clientSecret) {
    return res.redirect('/settings?kick_error=configuracion_incompleta')
  }

  try {
    // Intercambiar code por access_token
    const { data: tokenData } = await axios.post('https://id.kick.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    })

    const accessToken: string = tokenData.access_token

    // Obtener user_id de Supabase desde la sesión (cookie)
    const authHeader = req.headers.authorization
    if (!authHeader) return res.redirect('/settings?kick_error=no_autenticado')

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return res.redirect('/settings?kick_error=no_autenticado')

    // Guardar token en user_configs
    await supabaseAdmin
      .from('user_configs')
      .upsert({ user_id: user.id, kick_access_token: accessToken }, { onConflict: 'user_id' })

    return res.redirect('/settings?kick_connected=1')
  } catch {
    return res.redirect('/settings?kick_error=token_fallido')
  }
}
