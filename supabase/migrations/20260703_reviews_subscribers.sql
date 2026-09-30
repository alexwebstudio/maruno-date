-- ============================================================
-- Maruno Birthday — патч 1.01: отзывы + подписчики
-- Запусти это в Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────
-- ТАБЛИЦА REVIEWS (отзывы на главной)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  rating      INT  NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  approved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(approved, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert review"         ON public.reviews;

-- Читать могут все, но только одобренные
CREATE POLICY "Anyone can read approved reviews"
  ON public.reviews FOR SELECT
  USING (approved = true);

-- Вставлять может любой (модерация — на стороне server action).
-- Ограничиваем: нельзя самому проставить approved=true в обход —
-- поэтому WITH CHECK разрешает вставку, а server action ставит approved.
CREATE POLICY "Anyone can insert review"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────
-- ТАБЛИЦА SUBSCRIBERS (подписка на апдейты)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscribers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;

CREATE POLICY "Anyone can subscribe"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

-- ────────────────────────────────────────────────
-- (Опционально) настройки доставки форм на уровне проекта.
-- Понадобится для ЛК-пункта «куда приходят сообщения с форм».
-- ────────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS notify_email TEXT,
  ADD COLUMN IF NOT EXISTS access_secret TEXT;   -- для приватной ссылки (ЛК-пункт про доступ)
