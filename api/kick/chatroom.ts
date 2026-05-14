import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username requerido' })
  }

  try {
    const authHeader = req.headers.authorization
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (authHeader) headers['Authorization'] = authHeader

    const { data } = await axios.get(`https://kick.com/api/v2/channels/${username}`, { headers })

    const chatroomId = data.chatroom?.id
    const channelId = data.id
    if (!chatroomId) return res.status(404).json({ error: 'Chatroom no encontrado' })

    res.setHeader('Cache-Control', 's-maxage=60')
    return res.json({ chatroomId, channelId })
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({ error: 'Canal no encontrado' })
    }
    return res.status(500).json({ error: 'Error al contactar Kick' })
  }
}
