import React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Timer } from '@/components/atoms/Timer';
import { useTimer } from '@/hooks/useTimer';

interface LiveIndicatorProps {
  isLive: boolean;
  startedAt?: Date;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  isLive,
  startedAt,
}) => {
  const elapsed = useTimer(startedAt);

  return (
    <div className="flex flex-col gap-2">
      <Badge variant={isLive ? 'live' : 'offline'}>
        {isLive ? '● EN VIVO' : '○ OFFLINE'}
      </Badge>
      {isLive && startedAt && <Timer elapsed={elapsed} />}
    </div>
  );
};