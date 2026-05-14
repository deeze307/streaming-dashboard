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

  // Decode state to get supabase token and PKCE verifier
  let supabaseToken: string
  let codeVerifier: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    supabaseToken = decoded.token
    codeVerifier = decoded.verifier
    if (!supabaseToken || !codeVerifier) throw new Error()
  } catch {
    return res.redirect('/settings?kick_error=estado_invalido')
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(supabaseToken)
  if (authError || !user) {
    return res.redirect('/settings?kick_error=no_autenticado')
  }

  try {
    const { data: tokenData } = await axios.post(
      'https://id.kick.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    await supabaseAdmin
      .from('user_configs')
      .upsert({ user_id: user.id, kick_access_token: tokenData.access_token }, { onConflict: 'user_id' })

    return res.redirect('/settings?kick_connected=1')
  } catch {
    return res.redirect('/settings?kick_error=token_fallido')
  }
}
