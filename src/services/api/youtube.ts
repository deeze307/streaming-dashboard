import { PlatformStats } from '@/types';
import { streamConfig } from '@/config';

export const fetchYouTubeStats = async (): Promise<PlatformStats> => {
  const { channelId, videoId } = streamConfig.youtube;
  if (!channelId && !videoId) return { viewers: 0, isLive: false };

  try {
    const params = new URLSearchParams()
    if (channelId) params.set('channelId', channelId)
    if (videoId) params.set('videoId', videoId)

    const res = await fetch(`/api/youtube/stats?${params}`)
    if (!res.ok) return { viewers: 0, isLive: false }

    const data = await res.json()
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

export const refreshYouTubeLiveVideoId = () => {};
