import { PlatformStats } from '@/types';
import { streamConfig } from '@/config';

// Caché en memoria del cliente — persiste mientras la app esté abierta
let cachedVideoId: string | null = null;
let lastSearchTime = 0;
const SEARCH_COOLDOWN = 10 * 60 * 1000; // 10 minutos entre búsquedas

export const fetchYouTubeStats = async (): Promise<PlatformStats> => {
  const { channelId, videoId: manualVideoId } = streamConfig.youtube;
  if (!channelId && !manualVideoId) return { viewers: 0, isLive: false };

  try {
    const params = new URLSearchParams()

    // Si ya tenemos un videoId cacheado y no expiró, usarlo directamente
    // Esto evita el endpoint de búsqueda (100 unidades) en cada refresh
    const now = Date.now()
    if (cachedVideoId && now - lastSearchTime < SEARCH_COOLDOWN) {
      params.set('videoId', cachedVideoId)
    } else if (manualVideoId) {
      // Usar el videoId manual del .env sin búsqueda
      params.set('videoId', manualVideoId)
    } else if (channelId) {
      // Buscar solo si no hay caché ni videoId manual (consume 100 unidades)
      params.set('channelId', channelId)
    }

    const res = await fetch(`/api/youtube/stats?${params}`)
    if (!res.ok) return { viewers: 0, isLive: false }

    const data = await res.json()

    // Si la respuesta incluye un videoId encontrado, cachearlo en el cliente
    if (data.foundVideoId) {
      cachedVideoId = data.foundVideoId
      lastSearchTime = now
    }

    return {
      viewers: data.viewers ?? 0,
      isLive: data.isLive ?? false,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      likes: data.likes,
    }
  } catch {
    return { viewers: 0, isLive: false };
  }
};

export const refreshYouTubeLiveVideoId = () => {
  cachedVideoId = null;
  lastSearchTime = 0;
};
