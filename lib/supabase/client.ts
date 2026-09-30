import { createBrowserClient } from '@supabase/ssr'

/**
 * Браузерный клиент Supabase.
 *
 * Если переменные окружения не заданы, подставляем безопасные заглушки,
 * а НЕ падаем. Иначе сборка на Vercel рушится: страницы вроде /auth/login —
 * клиентские компоненты, которые Next пререндерит во время build, и вызов
 * createClient() в их теле бросал бы «URL and API key are required», обрывая
 * весь деплой. Реальные значения подставляются в рантайме (в браузере),
 * где переменные окружения есть; заглушка используется только на этапе
 * сборки, где сетевых запросов к Supabase всё равно не происходит.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  return createBrowserClient(url, key)
}
