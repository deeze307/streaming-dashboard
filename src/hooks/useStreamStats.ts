import { useState, useEffect, useCallback } from 'react';
import { StreamStats } from '@/types';
import { fetchYouTubeStats } from '@/services/api/youtube';
import { fetchTwitchStats } from '@/services/api/twitch';
import { fetchKickStats } from '@/services/api/kick';
import { useUserConfig } from '@/contexts/UserConfigContext';

const initialStats: StreamStats = {
  youtube: { viewers: 0, isLive: false },
  twitch: { viewers: 0, isLive: false },
  kick: { viewers: 0, isLive: false },
};

export const useStreamStats = () => {
  const { config, loading: configLoading } = useUserConfig();
  const [stats, setStats] = useState<StreamStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [youtube, twitch, kick] = await Promise.all([
        fetchYouTubeStats(config.youtube_channel_id, config.youtube_video_id),
        fetchTwitchStats(config.twitch_username, config.twitch_access_token),
        fetchKickStats(config.kick_username),
      ]);
      setStats({ youtube, twitch, kick });
      setLastUpdate(new Date());
    } catch {
      setError('Error al obtener estadísticas');
    } finally {
      setLoading(false);
    }
  }, [config.twitch_username, config.twitch_access_token, config.kick_username, config.youtube_channel_id, config.youtube_video_id]);

  useEffect(() => {
    if (configLoading) return;
    refresh();
    const interval = setInterval(refresh, (config.refresh_interval || 15) * 1000);
    return () => clearInterval(interval);
  }, [refresh, configLoading, config.refresh_interval]);

  const totalViewers = stats.youtube.viewers + stats.twitch.viewers + stats.kick.viewers;

  return { stats, loading, error, lastUpdate, refresh, totalViewers };
};
