import { createClient } from '@supabase/supabase-js'

/**
 * Серверный клиент с service role.
 *
 * Нужен там, где нет пользовательской сессии и нужно обойти RLS:
 *   — Telegram webhook (приходит от Telegram, не от браузера) пишет связь;
 *   — отправка заявки владельцу ищет его chat_id по project.user_id.
 *
 * Используется ТОЛЬКО на сервере. Ключ берётся из SUPABASE_SERVICE_ROLE_KEY
 * (серверная переменная окружения) и никогда не попадает в клиентский код.
 * Если ключ не задан — возвращаем null, вызывающий код обрабатывает это
 * как «функция не настроена», а не падает.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
