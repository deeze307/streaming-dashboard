import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

export interface UserConfig {
  youtube_channel_id: string
  youtube_video_id: string
  twitch_username: string
  twitch_access_token: string | null
  twitch_refresh_token: string | null
  twitch_broadcaster_id: string | null
  kick_username: string
  kick_access_token: string | null
  refresh_interval: number
}

const DEFAULT_CONFIG: UserConfig = {
  youtube_channel_id: '',
  youtube_video_id: '',
  twitch_username: '',
  twitch_access_token: null,
  twitch_refresh_token: null,
  twitch_broadcaster_id: null,
  kick_username: '',
  kick_access_token: null,
  refresh_interval: 15,
}

interface UserConfigContextValue {
  config: UserConfig
  loading: boolean
  saveConfig: (partial: Partial<UserConfig>) => Promise<{ error: string | null }>
}

const UserConfigContext = createContext<UserConfigContextValue | null>(null)

export const UserConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  const fetchConfig = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) setConfig({ ...DEFAULT_CONFIG, ...data })
    setLoading(false)
  }, [user])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const saveConfig = async (partial: Partial<UserConfig>) => {
    if (!user) return { error: 'No autenticado' }

    const updated = { ...config, ...partial }
    const { error } = await supabase
      .from('user_configs')
      .upsert({ user_id: user.id, ...updated }, { onConflict: 'user_id' })

    if (!error) setConfig(updated)
    return { error: error?.message ?? null }
  }

  return (
    <UserConfigContext.Provider value={{ config, loading, saveConfig }}>
      {children}
    </UserConfigContext.Provider>
  )
}

export const useUserConfig = () => {
  const ctx = useContext(UserConfigContext)
  if (!ctx) throw new Error('useUserConfig debe usarse dentro de UserConfigProvider')
  return ctx
}
