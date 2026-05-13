import { PlatformStats } from '@/types';
import { streamConfig } from '@/config';

export const fetchTwitchStats = async (): Promise<PlatformStats> => {
  const { username } = streamConfig.twitch;
  if (!username) return { viewers: 0, isLive: false };

  try {
    const res = await fetch(`/api/twitch/stream?username=${username}`);
    if (!res.ok) return { viewers: 0, isLive: false };
    const data = await res.json();
    return {
      viewers: data.viewers,
      isLive: data.isLive,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
    };
  } catch {
    return { viewers: 0, isLive: false };
  }
};
