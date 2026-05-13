import axios from 'axios';
import { PlatformStats } from '@/types';
import { streamConfig } from '@/config';

// Cache global para el video ID activo
let cachedVideoId: string | null = null;
let lastSearchTime: number = 0;
const SEARCH_COOLDOWN = 10 * 60 * 1000; // Buscar nuevo video ID cada 10 minutos máximo

/**
 * Obtiene el video ID del stream en vivo (con caché agresivo)
 */
const getLiveVideoId = async (): Promise<string | null> => {
  const { apiKey, channelId, videoId } = streamConfig.youtube;
  
  // Si no hay API Key, usar el manual
  if (!apiKey) {
    return videoId || null;
  }

  // Si no hay Channel ID, usar el manual
  if (!channelId) {
    return videoId || null;
  }

  // Si ya tenemos un video ID cacheado y no pasó el cooldown, usarlo
  const now = Date.now();
  if (cachedVideoId && (now - lastSearchTime) < SEARCH_COOLDOWN) {
    return cachedVideoId;
  }

  try {
    console.log('🔍 Buscando stream en vivo (esto consume 100 puntos de cuota)...');
    
    const searchResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'id',
          channelId: channelId,
          eventType: 'live',
          type: 'video',
          key: apiKey,
          maxResults: 1,
        },
        timeout: 10000,
      }
    );

    const items = searchResponse.data.items;
    
    if (items && items.length > 0) {
      const liveVideoId = items[0].id.videoId;
      
      // Actualizar cache
      cachedVideoId = liveVideoId;
      lastSearchTime = now;
      
      console.log('✅ Video ID encontrado:', liveVideoId);
      console.log('⏰ Próxima búsqueda en 5 minutos');
      
      return liveVideoId;
    }

    console.log('⚠️ No hay stream en vivo, usando Video ID manual');
    return videoId || null;
    
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      console.error('❌ CUOTA EXCEDIDA - Usando Video ID manual del .env');
      console.log('💡 La cuota se resetea a las 5 AM (hora Argentina)');
    }
    return videoId || null;
  }
};

export const fetchYouTubeStats = async (): Promise<PlatformStats> => {
  const { apiKey } = streamConfig.youtube;
  
  if (!apiKey) {
    return { viewers: 0, isLive: false };
  }

  try {
    // Obtener video ID (solo busca cada 5 minutos)
    const videoId = await getLiveVideoId();
    
    if (!videoId) {
      return { viewers: 0, isLive: false };
    }

    // Obtener estadísticas (solo consume 1 punto)
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'liveStreamingDetails,statistics',
          id: videoId,
          key: apiKey,
        },
        timeout: 10000,
      }
    );

    const items = response.data.items;
    if (!items || items.length === 0) {
      return { viewers: 0, isLive: false };
    }

    const item = items[0];
    const liveDetails = item.liveStreamingDetails;
    const statistics = item.statistics;

    if (liveDetails && !liveDetails.actualEndTime) {
      const viewers = liveDetails.concurrentViewers 
        ? parseInt(liveDetails.concurrentViewers, 10) 
        : 0;
      
      const likes = statistics?.likeCount 
        ? parseInt(statistics.likeCount, 10) 
        : 0;
      
      return {
        viewers,
        isLive: true,
        startedAt: liveDetails.actualStartTime
          ? new Date(liveDetails.actualStartTime)
          : undefined,
        likes,
      };
    }

    return {
      viewers: 0,
      isLive: false,
      likes: statistics?.likeCount ? parseInt(statistics.likeCount, 10) : 0,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      console.error('❌ YouTube: Cuota excedida');
    }
    return { viewers: 0, isLive: false };
  }
};

// Función para forzar una nueva búsqueda (útil cuando empezás a streamear)
export const refreshYouTubeLiveVideoId = () => {
  cachedVideoId = null;
  lastSearchTime = 0;
  console.log('🔄 Caché de Video ID limpiado - próxima request buscará un nuevo stream');
};