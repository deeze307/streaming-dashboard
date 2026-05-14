import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Settings, LogOut, ExternalLink, Youtube, Twitch, Save, CheckCircle, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserConfig } from '@/contexts/UserConfigContext'
import { supabase } from '@/lib/supabase'
import logotipo from '@/assets/logos/logotipo.png'

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dashboard-bg border border-panel-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-cyan transition-colors pr-9"
      />
      {value && (
        <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none" />
      )}
    </div>
  </div>
)

const PlatformStatus: React.FC<{ configured: boolean; connected?: boolean }> = ({ configured, connected }) => {
  if (connected) return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full ml-auto">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Conectado
    </span>
  )
  if (configured) return (
    <span className="flex items-center gap-1 text-xs font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full ml-auto">
      <Check size={10} />
      Configurado
    </span>
  )
  return (
    <span className="text-xs text-gray-600 ml-auto">Sin configurar</span>
  )
}

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const { config, loading, saveConfig } = useUserConfig()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    youtube_channel_id: '',
    youtube_video_id: '',
    twitch_username: '',
    kick_username: '',
    refresh_interval: 15,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const twitchConnected = searchParams.get('twitch_connected') === '1'
  const twitchError = searchParams.get('twitch_error')
  const kickConnected = searchParams.get('kick_connected') === '1'
  const kickError = searchParams.get('kick_error')

  useEffect(() => {
    if (!loading) {
      setForm({
        youtube_channel_id: config.youtube_channel_id,
        youtube_video_id: config.youtube_video_id,
        twitch_username: config.twitch_username,
        kick_username: config.kick_username,
        refresh_interval: config.refresh_interval,
      })
    }
  }, [loading, config])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await saveConfig(form)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleTwitchConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    window.location.href = `/api/twitch/oauth/authorize?token=${session.access_token}`
  }

  const handleKickConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    window.location.href = `/api/kick/oauth/authorize?token=${session.access_token}`
  }

  return (
    <div className="h-screen w-screen bg-dashboard-bg overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <img src={logotipo} alt="StreamGrid" className="h-10" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Volver al dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 text-sm transition-colors"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Settings size={18} className="text-brand-cyan" />
          <h1 className="text-white font-semibold text-lg">Configuración</h1>
          <span className="text-gray-600 text-sm ml-1">{user?.email}</span>
        </div>

        {(twitchConnected || twitchError || kickConnected || kickError) && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm ${
            (twitchConnected || kickConnected) ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {(twitchConnected || kickConnected) ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {twitchConnected && 'Twitch conectado correctamente'}
            {twitchError && `Error al conectar Twitch: ${twitchError.replace(/_/g, ' ')}`}
            {kickConnected && 'Kick conectado correctamente'}
            {kickError && `Error al conectar Kick: ${kickError.replace(/_/g, ' ')}`}
          </div>
        )}

        <div className="space-y-4">

          {/* YouTube */}
          <div className="bg-panel-bg border border-panel-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Youtube size={16} className="text-youtube" />
              <h2 className="text-white font-medium">YouTube</h2>
              <PlatformStatus configured={!!(config.youtube_channel_id || config.youtube_video_id)} />
            </div>
            <div className="space-y-3">
              <Field
                label="Channel ID"
                value={form.youtube_channel_id}
                onChange={v => setForm(f => ({ ...f, youtube_channel_id: v }))}
                placeholder="UCxxxxxxxxxxxxxxxx"
              />
              <Field
                label="Video ID (stream activo)"
                value={form.youtube_video_id}
                onChange={v => setForm(f => ({ ...f, youtube_video_id: v }))}
                placeholder="dQw4w9WgXcQ"
              />
            </div>
          </div>

          {/* Twitch */}
          <div className="bg-panel-bg border border-panel-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Twitch size={16} className="text-twitch" />
              <h2 className="text-white font-medium">Twitch</h2>
              <PlatformStatus configured={!!config.twitch_username} connected={!!config.twitch_access_token} />
            </div>
            <div className="space-y-3">
              <Field
                label="Username"
                value={form.twitch_username}
                onChange={v => setForm(f => ({ ...f, twitch_username: v }))}
                placeholder="tu_usuario"
              />
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                  Eventos en tiempo real
                </label>
                {config.twitch_access_token ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-twitch" />
                    <span className="text-twitch text-sm">Cuenta conectada</span>
                    <button
                      onClick={handleTwitchConnect}
                      className="ml-auto text-gray-500 hover:text-gray-300 text-xs transition-colors"
                    >
                      Reconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTwitchConnect}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-twitch/10 border border-twitch/30 text-twitch text-sm hover:bg-twitch/20 transition-colors"
                  >
                    <ExternalLink size={13} />
                    Conectar cuenta de Twitch
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kick */}
          <div className="bg-panel-bg border border-panel-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-kick font-bold text-sm">K</span>
              <h2 className="text-white font-medium">Kick</h2>
              <PlatformStatus configured={!!config.kick_username} connected={!!config.kick_access_token} />
            </div>
            <div className="space-y-3">
              <Field
                label="Username"
                value={form.kick_username}
                onChange={v => setForm(f => ({ ...f, kick_username: v }))}
                placeholder="tu_usuario"
              />
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                  Eventos en tiempo real
                </label>
                {config.kick_access_token ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-cyan" />
                    <span className="text-brand-cyan text-sm">Cuenta conectada</span>
                    <button
                      onClick={handleKickConnect}
                      className="ml-auto text-gray-500 hover:text-gray-300 text-xs transition-colors"
                    >
                      Reconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleKickConnect}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-kick/10 border border-kick/30 text-kick text-sm hover:bg-kick/20 transition-colors"
                  >
                    <ExternalLink size={13} />
                    Conectar cuenta de Kick
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* General */}
          <div className="bg-panel-bg border border-panel-border rounded-xl p-5">
            <h2 className="text-white font-medium mb-4">General</h2>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                Intervalo de actualización (segundos)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={form.refresh_interval}
                onChange={e => setForm(f => ({ ...f, refresh_interval: parseInt(e.target.value) || 15 }))}
                className="w-32 bg-dashboard-bg border border-panel-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-cyan transition-colors"
              />
            </div>
          </div>

          {/* Guardar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-semibold py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar configuración'}
          </button>

        </div>
      </div>
    </div>
  )
}
