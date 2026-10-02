'use server'

import { botUsername, makeLinkToken } from '@/lib/telegram'

export interface TelegramStatus {
  connected: boolean
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  chatId?: string | null
}

/**
 * Шаг 1–3 сценария привязки: авторизованный пользователь нажимает
 * «Подключить Telegram». Создаём одноразовый токен за ЕГО аккаунтом и
 * возвращаем deep link вида https://t.me/<bot>?start=<token>.
 *
 * Токен живёт 15 минут и гасится webhook'ом после нажатия Start.
 */
export async function startTelegramLink(): Promise<{ ok: boolean; url?: string; message?: string }> {
  const username = botUsername()
  if (!username) {
    return { ok: false, message: 'Бот не настроен. Укажите TELEGRAM_BOT_USERNAME.' }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: 'Войдите в аккаунт.' }

    const token = makeLinkToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('telegram_link_tokens')
      .insert({ token, user_id: user.id, expires_at: expiresAt })

    if (error) {
      if (/relation .*telegram_link_tokens.* does not exist|does not exist/i.test(error.message)) {
        return { ok: false, message: 'База не готова: выполните миграцию supabase/migrations/20261001_telegram.sql.' }
      }
      console.error('[telegram] token insert error:', error.message)
      return { ok: false, message: 'Не удалось начать подключение. Попробуйте ещё раз.' }
    }

    return { ok: true, url: `https://t.me/${username}?start=${token}` }
  } catch (err) {
    console.error('[telegram] startTelegramLink error:', err)
    return { ok: false, message: 'Ошибка сервера.' }
  }
}

/** Текущее состояние привязки для настроек ЛК. */
export async function getTelegramStatus(): Promise<TelegramStatus> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { connected: false }

    const { data, error } = await supabase
      .from('telegram_connections')
      .select('username, first_name, last_name, chat_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return { connected: false }
    return {
      connected: true,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      chatId: data.chat_id,
    }
  } catch {
    return { connected: false }
  }
}

/** Отключение Telegram: удаляем связь — заявки туда больше не уходят. */
export async function disconnectTelegram(): Promise<{ ok: boolean; message?: string }> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: 'Войдите в аккаунт.' }

    const { error } = await supabase
      .from('telegram_connections')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('[telegram] disconnect error:', error.message)
      return { ok: false, message: 'Не удалось отключить. Попробуйте ещё раз.' }
    }
    return { ok: true }
  } catch (err) {
    console.error('[telegram] disconnectTelegram error:', err)
    return { ok: false, message: 'Ошибка сервера.' }
  }
}
