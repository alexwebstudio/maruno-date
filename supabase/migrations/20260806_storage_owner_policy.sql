-- ============================================================
-- Maruno 1.2 — этап 8: доступ к файлам только в своей папке
--
-- ПРОБЛЕМА
-- Политика загрузки в бакет media выглядела так:
--   WITH CHECK (bucket_id = 'media')
-- То есть любой авторизованный пользователь мог записать файл в чужую папку
-- media/<чужой user_id>/... Политики на UPDATE и DELETE проверку папки
-- выполняли, а INSERT — нет.
--
-- ЧТО ДЕЛАЕТ
-- Приводит INSERT к тому же правилу: первый сегмент пути должен совпадать
-- с id текущего пользователя. Приложение и раньше загружало по такому пути
-- (lib/projects.ts → uploadMedia), поэтому поведение для честных клиентов
-- не меняется.
--
-- БЕЗОПАСНОСТЬ
-- Существующие файлы не трогаются: политика влияет только на новые операции.
--
-- ОТКАТ
--   DROP POLICY IF EXISTS "Auth users can upload own media" ON storage.objects;
--   CREATE POLICY "Auth users can upload media"
--     ON storage.objects FOR INSERT TO authenticated
--     WITH CHECK (bucket_id = 'media');
-- ============================================================

DROP POLICY IF EXISTS "Auth users can upload media"     ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload own media" ON storage.objects;

CREATE POLICY "Auth users can upload own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Чтение остаётся публичным: гости открывают приглашение без входа,
-- и фотографии должны загружаться у них так же, как у автора.
