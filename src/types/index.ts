export type Platform = 'youtube' | 'twitch' | 'kick';

export interface PlatformStats {
  viewers: number;
  isLive: boolean;
  startedAt?: Date;
  likes?: number; // Solo YouTube
}

export interface StreamStats {
  youtube: PlatformStats;
  twitch: PlatformStats;
  kick: PlatformStats;
}

export interface StreamConfig {
  youtube: {
    videoId: string;
    channelId?: string;
  };
  twitch: {
    username: string;
  };
  kick: {
    username: string;
  };
}

export interface VideoPlayerConfig {
  platform: Platform;
  videoId?: string;
  username?: string;
  muted: boolean;
  playing: boolean;
}

export type ActivityEventType = 'follow' | 'subscription' | 'donation' | 'host' | 'raid' | 'cheer';

export interface ChatMessage {
  id: string;
  platform: Platform;
  username: string;
  text: string;
  timestamp: Date;
}

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  platform: Platform;
  username: string;
  message?: string;
  amount?: number;
  timestamp: Date;
}