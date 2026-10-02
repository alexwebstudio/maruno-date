-- ============================================================
-- Maruno — подключение Telegram к аккаунту + заявки владельцу
-- Запусти это в Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────
-- Связь Telegram ↔ аккаунт Maruno (один аккаунт — одна связь)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telegram_connections (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id      TEXT NOT NULL,
  tg_user_id   TEXT NOT NULL,
  username     TEXT,
  first_name   TEXT,
  last_name    TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Один Telegram-аккаунт нельзя привязать к двум разным аккаунтам Maruno
CREATE UNIQUE INDEX IF NOT EXISTS idx_tg_conn_tg_user
  ON public.telegram_connections(tg_user_id);

ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

-- Пользователь видит и удаляет ТОЛЬКО свою связь.
-- Запись делает webhook через service role — RLS на него не распространяется.
DROP POLICY IF EXISTS "tg read own"   ON public.telegram_connections;
DROP POLICY IF EXISTS "tg delete own" ON public.telegram_connections;
CREATE POLICY "tg read own"   ON public.telegram_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tg delete own" ON public.telegram_connections FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- Одноразовые токены привязки (deep link ?start=TOKEN)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  token       TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tg_tokens_user ON public.telegram_link_tokens(user_id);

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;

-- Токен создаёт авторизованный пользователь (для себя). Читает/гасит его
-- webhook через service role. Поэтому клиенту даём только INSERT/SELECT своих.
DROP POLICY IF EXISTS "tg token insert own" ON public.telegram_link_tokens;
DROP POLICY IF EXISTS "tg token read own"   ON public.telegram_link_tokens;
CREATE POLICY "tg token insert own" ON public.telegram_link_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tg token read own"   ON public.telegram_link_tokens FOR SELECT USING (auth.uid() = user_id);
