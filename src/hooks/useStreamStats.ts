import { useState, useEffect, useCallback } from 'react';
import { StreamStats } from '@/types';
import { fetchAllStats } from '@/services';
import { REFRESH_INTERVAL } from '@/config';

const initialStats: StreamStats = {
  youtube: { viewers: 0, isLive: false },
  twitch: { viewers: 0, isLive: false },
  kick: { viewers: 0, isLive: false },
};

export const useStreamStats = () => {
  const [stats, setStats] = useState<StreamStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newStats = await fetchAllStats();
      setStats(newStats);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Error al obtener estadísticas');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const totalViewers =
    stats.youtube.viewers + stats.twitch.viewers + stats.kick.viewers;

  return {
    stats,
    loading,
    error,
    lastUpdate,
    refresh,
    totalViewers,
  };
};