'use server'

export interface SubscribeResult {
  ok: boolean
  message: string
}

/**
 * Реальная подписка на обновления (блок «Узнавайте о новых шаблонах первыми»).
 *
 * Email действительно сохраняется — в таблицу Supabase `subscribers`
 * (это и есть источник правды для рассылки). Если дополнительно задан
 * Resend Audience (RESEND_API_KEY + RESEND_AUDIENCE_ID), контакт параллельно
 * добавляется туда — тогда письма можно слать прямо из Resend. Если сервис
 * рассылки ещё не подключён, подписка всё равно работает: адрес сохранён,
 * и его можно выгрузить/подключить к любому сервису позже.
 */
export async function subscribeToUpdates(email: string): Promise<SubscribeResult> {
  const clean = (email || '').trim().toLowerCase()
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
  if (!valid) {
    return { ok: false, message: 'Введите корректный email.' }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // insert, а не upsert: upsert при конфликте делает UPDATE, а RLS-политика
    // разрешает только INSERT — на повторном email запрос упал бы. Повтор
    // ловим по коду уникального ограничения и считаем успехом.
    const { error } = await supabase.from('subscribers').insert({ email: clean })

    if (error) {
      // 23505 — duplicate key: человек уже подписан, это не ошибка для него.
      if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
        return { ok: true, message: 'Вы уже подписаны ♥' }
      }
      console.warn('Subscribe error:', error.message)
      return { ok: false, message: 'Не удалось подписаться. Попробуйте позже.' }
    }

    // Необязательная синхронизация с сервисом рассылки (Resend Audience).
    // Сбой здесь не отменяет подписку: адрес уже сохранён в базе.
    await syncToResendAudience(clean)

    return { ok: true, message: 'Готово! Сообщим о новых апдейтах ♥' }
  } catch (err) {
    console.error('subscribe error:', err)
    return { ok: false, message: 'Ошибка сервера. Попробуйте позже.' }
  }
}

async function syncToResendAudience(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!key || !audienceId) return // сервис не подключён — тихо пропускаем
  try {
    await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false }),
    })
  } catch (err) {
    console.warn('Resend audience sync failed:', err)
  }
}
