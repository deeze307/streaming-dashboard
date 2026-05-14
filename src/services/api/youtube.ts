import { PlatformStats } from '@/types';
import { streamConfig } from '@/config';

// Client-side cache — persists while the app is open
let cachedVideoId: string | null = null;
let lastSearchTime = 0;
const SEARCH_COOLDOWN = 10 * 60 * 1000; // 10 minutes between searches

export const fetchYouTubeStats = async (
  channelId?: string,
  videoId?: string
): Promise<PlatformStats> => {
  const resolvedChannelId = channelId ?? streamConfig.youtube.channelId;
  const resolvedVideoId = videoId ?? streamConfig.youtube.videoId;

  if (!resolvedChannelId && !resolvedVideoId) return { viewers: 0, isLive: false };

  try {
    const params = new URLSearchParams();
    const now = Date.now();

    if (cachedVideoId && now - lastSearchTime < SEARCH_COOLDOWN) {
      params.set('videoId', cachedVideoId);
    } else if (resolvedVideoId) {
      params.set('videoId', resolvedVideoId);
    } else if (resolvedChannelId) {
      params.set('channelId', resolvedChannelId);
    }

    const res = await fetch(`/api/youtube/stats?${params}`);
    if (!res.ok) return { viewers: 0, isLive: false };

    const data = await res.json();

    if (data.foundVideoId) {
      cachedVideoId = data.foundVideoId;
      lastSearchTime = now;
    }

    return {
      viewers: data.viewers ?? 0,
      isLive: data.isLive ?? false,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      likes: data.likes,
    };
  } catch {
    return { viewers: 0, isLive: false };
  }
};

export const refreshYouTubeLiveVideoId = () => {
  cachedVideoId = null;
  lastSearchTime = 0;
};
