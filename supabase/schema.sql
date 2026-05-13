-- Tabla de configuración por usuario
CREATE TABLE public.user_configs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  -- YouTube
  youtube_channel_id  text,
  youtube_video_id    text,

  -- Twitch
  twitch_username     text,

  -- Kick
  kick_username       text,
  kick_access_token   text,  -- encriptado con pgcrypto

  -- Configuración general
  refresh_interval    integer DEFAULT 15,

  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo puede ver y modificar su propia fila
CREATE POLICY "select own config"
  ON public.user_configs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "insert own config"
  ON public.user_configs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own config"
  ON public.user_configs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "delete own config"
  ON public.user_configs FOR DELETE
  USING (user_id = auth.uid());

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_configs_updated_at
  BEFORE UPDATE ON public.user_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
