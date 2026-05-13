import axios from 'axios';
import { PlatformStats } from '@/types';
import { streamConfig } from '@/config';

export const fetchKickStats = async (): Promise<PlatformStats> => {
  const { username } = streamConfig.kick;
  
  if (!username) {
    return { viewers: 0, isLive: false };
  }

  try {
    // Nota: Kick tiene CORS restrictions, necesitarás un proxy o backend
    // Por ahora usamos un approach que funciona desde el navegador
    const response = await axios.get(
      `https://kick.com/api/v1/channels/${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    if (data.livestream) {
      return {
        viewers: data.livestream.viewer_count || 0,
        isLive: true,
        startedAt: data.livestream.created_at
          ? new Date(data.livestream.created_at)
          : undefined,
      };
    }

    return { viewers: 0, isLive: false };
  } catch (error) {
    console.error('Kick API error:', error);
    // Kick puede bloquear requests desde el navegador
    // Considera usar un backend proxy
    return { viewers: 0, isLive: false };
  }
};