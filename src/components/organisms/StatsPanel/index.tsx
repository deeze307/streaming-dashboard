import React from 'react';
import { PlatformStat } from '@/components/molecules/PlatformStat';
import { Counter } from '@/components/atoms/Counter';
import { useStream } from '@/contexts/StreamContext';
import { RefreshCw, Users, Clock } from 'lucide-react';
import { REFRESH_INTERVAL_SECS } from '@/config';

export const StatsPanel: React.FC = () => {
  const { stats, loading, lastUpdate, refresh, totalViewers } = useStream();

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `Hace ${diffInSeconds}s`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes}m`;
    }
    
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-panel-bg rounded-xl border border-panel-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-brand-cyan" />
          <span className="text-white font-semibold">Estadísticas</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Última actualización */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Clock size={14} />
            <span>{formatLastUpdate(lastUpdate)}</span>
          </div>
          
          {/* Botón de refresh manual */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
            title="Actualizar ahora"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin' : ''}
            />
            <span className="text-xs">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Layout de 2 columnas */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {/* Columna izquierda: Total Viewers */}
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-br from-brand-pink/20 via-panel-bg to-brand-cyan/20 rounded-xl p-2 w-full h-full flex flex-col items-center justify-center shadow-lg border border-brand-pink/30">
            <span className="text-gray-300 text-sm block mb-2 uppercase tracking-wider">
              Total Viewers
            </span>
            <Counter value={totalViewers} size="lg" color="#00d4ff" />
            <div className="mt-4 text-center">
              <span className="text-gray-400 text-xs">
                En todas las plataformas
              </span>
            </div>
            
            {/* Indicador de auto-refresh */}
            <div className="mt-3 flex items-center gap-1.5 text-gray-500 text-xs">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-brand-pink animate-pulse' : 'bg-brand-cyan'}`}></div>
              <span>Auto-refresh cada {REFRESH_INTERVAL_SECS}s</span>
            </div>
          </div>
        </div>

        {/* Columna derecha: Plataformas */}
        <div className="space-y-2 overflow-y-auto pr-2">
          <PlatformStat platform="youtube" stats={stats.youtube} />
          <PlatformStat platform="twitch" stats={stats.twitch} />
          <PlatformStat platform="kick" stats={stats.kick} />
        </div>
      </div>
    </div>
  );
};