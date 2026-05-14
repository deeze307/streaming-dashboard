import { PlatformStats } from '@/types';

export const fetchTwitchStats = async (username: string, accessToken?: string | null): Promise<PlatformStats> => {
  if (!username) return { viewers: 0, isLive: false };

  try {
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`/api/twitch/stream?username=${username}`, { headers });
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
