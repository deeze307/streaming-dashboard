import { StreamConfig } from '@/types';

export const streamConfig: StreamConfig = {
  youtube: {
    videoId: import.meta.env.VITE_YOUTUBE_VIDEO_ID || '',
    channelId: import.meta.env.VITE_YOUTUBE_CHANNEL_ID || '',
  },
  twitch: {
    username: import.meta.env.VITE_TWITCH_USERNAME || '',
  },
  kick: {
    username: import.meta.env.VITE_KICK_USERNAME || '',
  },
};

// Cambiado a 10 segundos por defecto
export const REFRESH_INTERVAL_SECS = import.meta.env.VITE_REFRESH_INTERVAL; 
export const REFRESH_INTERVAL = parseInt(
  import.meta.env.VITE_REFRESH_INTERVAL || '10'
) * 1000;

export const PLATFORM_COLORS = {
  youtube: '#ff0000',
  twitch: '#9146ff',
  kick: '#53fc18',
} as const;

export const PLATFORM_NAMES = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  kick: 'Kick',
} as const;