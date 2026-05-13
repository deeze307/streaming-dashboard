import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { Platform } from '@/types'
import { streamConfig, PLATFORM_COLORS, PLATFORM_NAMES } from '@/config'
import { useStream } from '@/contexts/StreamContext'

const PLATFORMS: Platform[] = ['twitch', 'youtube', 'kick']

function hasConfig(p: Platform): boolean {
  if (p === 'twitch') return !!streamConfig.twitch.username
  if (p === 'youtube') return !!streamConfig.youtube.channelId
  if (p === 'kick') return !!streamConfig.kick.username
  return false
}

function getEmbedUrl(p: Platform, muted: boolean): string {
  const host = window.location.hostname || 'localhost'
  switch (p) {
    case 'twitch':
      return `https://player.twitch.tv/?channel=${streamConfig.twitch.username}&parent=${host}&autoplay=true&muted=${muted}`
    case 'youtube':
      // live_stream embed usa channelId directamente → siempre apunta al stream activo
      return `https://www.youtube.com/embed/live_stream?channel=${streamConfig.youtube.channelId}&autoplay=1&enablejsapi=1&mute=${muted ? 1 : 0}&controls=0`
    case 'kick':
      return `https://player.kick.com/${streamConfig.kick.username}`
    default:
      return ''
  }
}

export const VideoPlayer: React.FC = () => {
  const { stats } = useStream()

  // Plataformas disponibles: vivas primero, sino todas las configuradas
  const livePlatforms = PLATFORMS.filter((p) => stats[p].isLive && hasConfig(p))
  const availablePlatforms = livePlatforms.length > 0
    ? livePlatforms
    : PLATFORMS.filter(hasConfig)

  const [platform, setPlatform] = useState<Platform>(availablePlatforms[0] ?? 'twitch')
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  // Cambiar iframeKey fuerza remount del iframe (usado para Twitch/Kick)
  const [iframeKey, setIframeKey] = useState(0)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const embedUrl = useMemo(() => getEmbedUrl(platform, muted), [platform, muted])

  // Envía comandos a YouTube via postMessage (requiere enablejsapi=1)
  const ytCmd = useCallback((func: string, args?: any[]) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: args ?? [] }),
      '*'
    )
  }, [])

  // Cuando se monta el iframe de YouTube, inicializar volumen
  const handleIframeLoad = useCallback(() => {
    if (platform === 'youtube') {
      setTimeout(() => {
        ytCmd('setVolume', [volume])
        ytCmd(muted ? 'mute' : 'unMute')
      }, 500)
    }
  }, [platform, volume, muted, ytCmd])

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p)
    setPlaying(true)
    setIframeKey((k) => k + 1)
  }

  const handlePlayPause = () => {
    if (platform === 'youtube') {
      ytCmd(playing ? 'pauseVideo' : 'playVideo')
      setPlaying((v) => !v)
    } else {
      // Twitch/Kick: si es play, reconectar al stream en vivo
      if (!playing) setIframeKey((k) => k + 1)
      setPlaying((v) => !v)
    }
  }

  const handleStop = () => {
    if (platform === 'youtube') ytCmd('stopVideo')
    else setIframeKey((k) => k + 1)
    setPlaying(false)
  }

  const handleMute = () => {
    const next = !muted
    setMuted(next)
    if (platform === 'youtube') {
      ytCmd(next ? 'mute' : 'unMute')
    } else {
      // Twitch/Kick: remount con nuevo parámetro muted en URL
      setIframeKey((k) => k + 1)
    }
  }

  const handleVolume = (v: number) => {
    setVolume(v)
    if (v === 0) {
      setMuted(true)
      if (platform === 'youtube') ytCmd('mute')
      else setIframeKey((k) => k + 1)
    } else {
      if (muted) {
        setMuted(false)
        if (platform !== 'youtube') setIframeKey((k) => k + 1)
      }
      if (platform === 'youtube') {
        ytCmd('unMute')
        ytCmd('setVolume', [v])
      }
    }
  }

  // Si las plataformas en vivo cambian y la actual ya no está disponible, cambiar
  useEffect(() => {
    if (!availablePlatforms.includes(platform) && availablePlatforms.length > 0) {
      handlePlatformChange(availablePlatforms[0])
    }
  }, [availablePlatforms.join(',')])  // eslint-disable-line

  const isLive = stats[platform]?.isLive ?? false

  return (
    <div className="h-full flex flex-col bg-black rounded-xl border border-panel-border overflow-hidden">
      {/* Video — ocupa todo el espacio disponible */}
      <div className="flex-1 relative bg-black min-h-0">
        {playing && embedUrl ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={embedUrl}
            onLoad={handleIframeLoad}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={`${PLATFORM_NAMES[platform]} Preview`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <Play size={24} className="text-gray-400 ml-1" />
            </button>
            <span className="text-gray-600 text-sm">Stream detenido</span>
          </div>
        )}
      </div>

      {/* Barra de controles */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-950 border-t border-panel-border">
        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          title={playing ? 'Pausar' : 'Reproducir'}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          title="Detener"
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <Square size={13} />
        </button>

        {/* Mute */}
        <button
          onClick={handleMute}
          title={muted ? 'Activar sonido' : 'Silenciar'}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Volumen */}
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(e) => handleVolume(Number(e.target.value))}
          className="w-20 h-1 cursor-pointer accent-gray-300"
          title={`Volumen: ${muted ? 0 : volume}%`}
        />

        <div className="flex-1" />

        {/* Selector de plataforma — solo las que están online */}
        <div className="flex items-center gap-1">
          {availablePlatforms.map((p) => {
            const color = PLATFORM_COLORS[p]
            const live = stats[p]?.isLive
            const active = platform === p
            return (
              <button
                key={p}
                onClick={() => handlePlatformChange(p)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
                style={
                  active
                    ? { backgroundColor: color + '28', color, border: `1px solid ${color}55` }
                    : { color: '#4b5563', border: '1px solid transparent' }
                }
              >
                {live && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: active ? color : '#ef4444' }}
                  />
                )}
                {PLATFORM_NAMES[p]}
              </button>
            )
          })}
        </div>

        {/* Indicador live */}
        {isLive && (
          <span className="text-xs font-bold text-red-500 tracking-wider">LIVE</span>
        )}
      </div>
    </div>
  )
}
