-- ============================================================
-- Maruno — ответы гостей внутри продукта
--
-- До этой миграции ответы уходили в Telegram и на почту, а таблица
-- rsvp_responses хранила только имя, факт присутствия и число гостей.
-- Комментарий гостя и дополнительные поля шаблона терялись, а хозяин
-- приглашения искал ответы по переписке.
--
-- Здесь появляется всё, что нужно, чтобы ответы жили в самом Maruno
-- и были привязаны к конкретному сайту:
--   projects.rsvp_delivery — способ получения ответов;
--   rsvp_responses.comment — комментарий гостя;
--   rsvp_responses.extra   — дополнительные поля конкретного шаблона.
--
-- Миграция обратно совместима: существующие записи и код, который
-- о новых столбцах не знает, продолжают работать.
-- ============================================================

-- ── Способ получения ответов ──
-- site | telegram | email. Строка, а не enum: добавить WhatsApp
-- не должно требовать миграции типа.
-- По умолчанию 'site': ответы копятся внутри Maruno, и человеку
-- не нужно ничего настраивать, чтобы их увидеть.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS rsvp_delivery TEXT NOT NULL DEFAULT 'site';

-- ── Расширение ответа гостя ──
ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS comment TEXT;

-- Дополнительные поля формы конкретного шаблона: блюдо, трансфер и т.п.
-- JSONB, потому что набор полей у каждого шаблона свой и меняется
-- без участия базы.
ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Панель гостей всегда читает ответы одного сайта, новые сверху —
-- индекс повторяет этот запрос.
CREATE INDEX IF NOT EXISTS idx_rsvp_project_created
  ON public.rsvp_responses(project_id, created_at DESC);

-- ── Удаление ответа владельцем ──
-- Гость мог ответить дважды или ошибиться; владелец должен иметь
-- возможность убрать запись. Политика на чтение уже существует.
DROP POLICY IF EXISTS "Project owner can delete rsvp" ON public.rsvp_responses;

CREATE POLICY "Project owner can delete rsvp"
  ON public.rsvp_responses FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
