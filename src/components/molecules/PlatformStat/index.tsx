import React from 'react';
import { Logo } from '@/components/atoms/Logo';
import { LiveIndicator } from '@/components/molecules/LiveIndicator';
import { Platform, PlatformStats } from '@/types';
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/config';
import { Users, Heart, Clock } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';

interface PlatformStatProps {
  platform: Platform;
  stats: PlatformStats;
}

export const PlatformStat: React.FC<PlatformStatProps> = ({
  platform,
  stats,
}) => {
  const elapsed = useTimer(stats.startedAt);

  return (
    <div className="bg-panel-bg rounded-lg p-2 border border-panel-border hover:border-gray-600 transition-colors">
      {/* Fila principal: Logo + Nombre | Viewers */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Logo platform={platform} size="xs" />
          <span className="text-white font-semibold text-sm">
            {PLATFORM_NAMES[platform]}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: PLATFORM_COLORS[platform] }} />
          <span 
            className="text-xl font-bold"
            style={{ color: PLATFORM_COLORS[platform] }}
          >
            {stats.viewers.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Fila secundaria: Estado + Info adicional */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {stats.isLive ? (
            <>
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                EN VIVO
              </span>
              {stats.startedAt && (
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock size={12} />
                  {elapsed}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              OFFLINE
            </span>
          )}
        </div>

        {platform === 'youtube' && stats.likes !== undefined && stats.likes > 0 && (
          <span className="flex items-center gap-1 text-gray-400">
            <Heart size={12} className="text-red-400" />
            {stats.likes.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};