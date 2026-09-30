-- ============================================================
-- Maruno Birthday — Storage Policies
-- Запусти ОТДЕЛЬНО, только ПОСЛЕ создания bucket "media"
-- ============================================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Auth users can upload media"  ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media"        ON storage.objects;

-- Загрузка: только авторизованные пользователи
CREATE POLICY "Auth users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Обновление своих файлов
CREATE POLICY "Auth users can update own media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Удаление своих файлов
CREATE POLICY "Auth users can delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Публичное чтение
CREATE POLICY "Public can read media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');
