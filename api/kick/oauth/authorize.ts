import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return res.redirect('/settings?kick_error=no_autenticado')
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return res.redirect('/settings?kick_error=no_autenticado')
  }

  const clientId = process.env.KICK_CLIENT_ID
  const redirectUri = `${process.env.APP_URL}/api/kick/oauth/callback`
  if (!clientId) return res.status(500).json({ error: 'KICK_CLIENT_ID no configurado' })

  // PKCE
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  // Encode both supabase token and code verifier in state
  const state = Buffer.from(JSON.stringify({ token, verifier: codeVerifier })).toString('base64url')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user:read events:subscribe',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return res.redirect(`https://id.kick.com/oauth/authorize?${params}`)
}
