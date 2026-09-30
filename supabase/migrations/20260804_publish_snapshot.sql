-- ============================================================
-- Maruno 1.2 — этап 2: разделение черновика и опубликованной версии
--
-- ПРОБЛЕМА, КОТОРУЮ ЧИНИТ МИГРАЦИЯ
-- До неё у проекта была одна копия содержимого: колонки blocks/colors/fonts/music.
-- Автосохранение редактора писало прямо в них, а публичная страница /<slug>
-- читала ту же строку. Значит любая правка в редакторе мгновенно уходила
-- на живой сайт, который уже видят гости.
--
-- ЧТО ДЕЛАЕТ
-- Добавляет снимок опубликованной версии. Редактор продолжает писать в blocks
-- (черновик), гости читают published_snapshot. Публикация — явное копирование
-- черновика в снимок.
--
-- БЕЗОПАСНОСТЬ
-- Миграция только добавляет колонки. Существующие данные не удаляются
-- и не перезаписываются: backfill заполняет снимок лишь там, где он NULL.
-- Публичные сайты после миграции выглядят ровно так же, как до неё.
--
-- ОТКАТ
--   ALTER TABLE public.projects
--     DROP COLUMN IF EXISTS published_snapshot,
--     DROP COLUMN IF EXISTS published_at,
--     DROP COLUMN IF EXISTS archived_at;
-- Код версии 1.1.5 после этого продолжит работать без изменений.
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS published_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS published_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at        TIMESTAMPTZ;

COMMENT ON COLUMN public.projects.published_snapshot IS
  'Содержимое сайта на момент последней публикации: {blocks, colors, fonts, music}. NULL — сайт ещё не публиковался.';
COMMENT ON COLUMN public.projects.published_at IS
  'Момент последней публикации. Вместе со снимком даёт статус «есть неопубликованные изменения».';
COMMENT ON COLUMN public.projects.archived_at IS
  'Момент архивации проекта. NULL — проект активен.';

-- ────────────────────────────────────────────────
-- BACKFILL: уже опубликованные сайты получают снимок из текущего содержимого.
-- Это ровно то, что гости видят сейчас, — визуально ничего не изменится.
-- ────────────────────────────────────────────────
UPDATE public.projects
SET
  published_snapshot = jsonb_build_object(
    'blocks', blocks,
    'colors', colors,
    'fonts',  fonts,
    'music',  music
  ),
  published_at = COALESCE(published_at, updated_at)
WHERE published = true
  AND published_snapshot IS NULL;

-- Индекс под выборку опубликованного сайта по слагу
CREATE INDEX IF NOT EXISTS idx_projects_published_slug
  ON public.projects(slug) WHERE published = true;

-- ────────────────────────────────────────────────
-- Существующие RLS-политики покрывают новые колонки автоматически:
-- они действуют на строку целиком, а не на отдельные поля. Менять их не нужно.
-- ────────────────────────────────────────────────
