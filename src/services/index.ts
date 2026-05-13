import { fetchYouTubeStats } from './api/youtube';
import { fetchTwitchStats } from './api/twitch';
import { fetchKickStats } from './api/kick';
import { StreamStats } from '@/types';

export const fetchAllStats = async (): Promise<StreamStats> => {
  const [youtube, twitch, kick] = await Promise.all([
    fetchYouTubeStats(),
    fetchTwitchStats(),
    fetchKickStats(),
  ]);

  return { youtube, twitch, kick };
};

export { fetchYouTubeStats, fetchTwitchStats, fetchKickStats };