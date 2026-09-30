-- ============================================================
-- Maruno Date — Database Schema
-- (та же таблица, что у остальных направлений Maruno: одна база, один аккаунт)
-- Запусти это в Supabase SQL Editor
-- ============================================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ТАБЛИЦА PROJECTS — общая для всех направлений Maruno
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  template    TEXT NOT NULL DEFAULT 'modern-adult', -- значение направления; Date пишет 'soft-invite'
  language    TEXT NOT NULL DEFAULT 'ru',
  -- Направление Maruno: wedding | birthday | gender_reveal | date.
  -- Строка, а не enum: именно поэтому добавление направления Date
  -- не потребовало ни одной миграции базы. Значение всегда проставляет
  -- приложение (APP_EVENT_TYPE), на DEFAULT полагаться нельзя.
  event_type  TEXT NOT NULL DEFAULT 'birthday',
  colors      JSONB NOT NULL DEFAULT '{"primary":"#E4451F","secondary":"#7A2411","accent":"#F4E3D6","background":"#FAF7F2","text":"#141416"}'::jsonb,
  fonts       JSONB NOT NULL DEFAULT '{"heading":"Unbounded","body":"Golos Text"}'::jsonb,
  music       JSONB NOT NULL DEFAULT '{"url":null,"autoplay":false,"title":""}'::jsonb,
  blocks      JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Куда приходят ответы гостей: site | telegram | email.
  -- 'site' по умолчанию — ответы копятся в разделе «Гости» приглашения,
  -- и человеку не нужно ничего настраивать, чтобы их увидеть.
  rsvp_delivery TEXT NOT NULL DEFAULT 'site',
  published   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_projects_slug    ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_event ON public.projects(user_id, event_type, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть (чтобы не было конфликта)
DROP POLICY IF EXISTS "Users can read own projects"      ON public.projects;
DROP POLICY IF EXISTS "Anyone can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects"    ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects"    ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects"    ON public.projects;

-- Создаём политики заново
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read published projects"
  ON public.projects FOR SELECT
  USING (published = true);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.projects;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RSVP RESPONSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rsvp_responses (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Ответ всегда принадлежит конкретному приглашению. Общего списка
  -- «все ответы пользователя» не существует: два приглашения одного
  -- человека — это два независимых набора ответов.
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  attending   TEXT NOT NULL CHECK (attending IN ('yes','no')),
  guest_count INTEGER NOT NULL DEFAULT 1,
  comment     TEXT,
  -- Дополнительные поля ответа. В направлении Date сюда ложится весь
  -- пройденный сценарий: что выбрали, когда и где.
  -- JSONB, потому что набор вопросов у каждого приглашения свой.
  extra       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rsvp_project_id ON public.rsvp_responses(project_id);
-- Панель гостей читает ответы одного сайта, новые сверху
CREATE INDEX IF NOT EXISTS idx_rsvp_project_created ON public.rsvp_responses(project_id, created_at DESC);

ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project owner can read rsvp" ON public.rsvp_responses;
DROP POLICY IF EXISTS "Anyone can insert rsvp"      ON public.rsvp_responses;

-- Project owner sees their RSVPs
CREATE POLICY "Project owner can read rsvp"
  ON public.rsvp_responses FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Anyone (guests) can submit RSVP
CREATE POLICY "Anyone can insert rsvp"
  ON public.rsvp_responses FOR INSERT
  WITH CHECK (true);

-- Владелец может удалить ошибочный или задвоенный ответ
DROP POLICY IF EXISTS "Project owner can delete rsvp" ON public.rsvp_responses;

CREATE POLICY "Project owner can delete rsvp"
  ON public.rsvp_responses FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
