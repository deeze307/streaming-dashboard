import React from 'react';
import { IconButton } from '@/components/atoms/IconButton';
import { Play, Pause, Volume2, VolumeX, Square } from 'lucide-react';

interface VideoControlsProps {
  playing: boolean;
  muted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onStop: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  playing,
  muted,
  onPlayPause,
  onMuteToggle,
  onStop,
}) => {
  return (
    <div className="flex items-center gap-2 bg-black bg-opacity-75 p-2 rounded-lg">
      <IconButton
        icon={playing ? Pause : Play}
        onClick={onPlayPause}
        title={playing ? 'Pausar' : 'Reproducir'}
      />
      <IconButton
        icon={muted ? VolumeX : Volume2}
        onClick={onMuteToggle}
        active={!muted}
        title={muted ? 'Activar sonido' : 'Silenciar'}
      />
      <IconButton
        icon={Square}
        onClick={onStop}
        title="Detener"
      />
    </div>
  );
};