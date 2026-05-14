import { PlatformStats } from '@/types';

export const fetchKickStats = async (username: string): Promise<PlatformStats> => {
  if (!username) return { viewers: 0, isLive: false };

  try {
    const res = await fetch(`/api/kick/stats?username=${username}`);
    if (!res.ok) return { viewers: 0, isLive: false };
    const data = await res.json();
    return {
      viewers: data.viewers ?? 0,
      isLive: data.isLive ?? false,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
    };
  } catch {
    return { viewers: 0, isLive: false };
  }
};
