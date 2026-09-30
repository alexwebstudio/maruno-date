'use server'

export interface SubscribeResult {
  ok: boolean
  message: string
}

// Подписка на обновления сайта (новые апдейты, шаблоны и т.д.)
export async function subscribeToUpdates(email: string): Promise<SubscribeResult> {
  const clean = (email || '').trim().toLowerCase()
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)

  if (!valid) {
    return { ok: false, message: 'Введите корректный email.' }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await supabase
      .from('subscribers')
      .upsert({ email: clean }, { onConflict: 'email' })

    if (error) {
      console.warn('Subscribe error:', error.message)
      return { ok: false, message: 'Не удалось подписаться. Попробуйте позже.' }
    }

    return { ok: true, message: 'Готово! Сообщим о новых апдейтах ♥' }
  } catch (err) {
    console.error('subscribe error:', err)
    return { ok: false, message: 'Ошибка сервера. Попробуйте позже.' }
  }
}
