'use server'

import { moderateReview } from '@/lib/moderation'

export interface ReviewInput {
  name: string
  rating: number
  text: string
  images?: string[]
}

export interface ReviewRow {
  id: string
  name: string
  rating: number
  text: string
  images?: string[]
  created_at: string
}

export interface SubmitReviewResult {
  ok: boolean
  message: string
}

// Отправка отзыва. Проходит через модерацию, затем в Supabase.
// Auto-approve только если модерация чистая.
export async function submitReview(input: ReviewInput): Promise<SubmitReviewResult> {
  const name = (input.name || '').trim().slice(0, 60)
  const text = (input.text || '').trim().slice(0, 800)
  const rating = Math.max(1, Math.min(5, Math.round(input.rating || 5)))

  if (!name || name.length < 2) {
    return { ok: false, message: 'Укажите ваше имя.' }
  }

  const check = moderateReview(text)
  if (!check.ok) {
    return { ok: false, message: check.message }
  }

  // Имя тоже проверяем на мат/оскорбления
  const nameCheck = moderateReview(name.padEnd(12, ' ') + ' ' + name)
  if (nameCheck.reason === 'profanity' || nameCheck.reason === 'slur') {
    return { ok: false, message: 'Пожалуйста, используйте корректное имя.' }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const images = (input.images || []).filter(Boolean).slice(0, 4)
    const base = { name, rating, text, approved: true }

    // Пытаемся сохранить с изображениями; если колонки ещё нет — сохраняем без них.
    let error = null as { message: string } | null
    if (images.length) {
      const res = await supabase.from('reviews').insert({ ...base, images })
      error = res.error
      if (error && /images|column/i.test(error.message)) {
        const retry = await supabase.from('reviews').insert(base)
        error = retry.error
      }
    } else {
      const res = await supabase.from('reviews').insert(base)
      error = res.error
    }

    if (error) {
      console.warn('Review insert error:', error.message)
      return {
        ok: false,
        message: 'Не удалось сохранить отзыв. Попробуйте позже.',
      }
    }

    return { ok: true, message: 'Спасибо! Ваш отзыв опубликован 🤍' }
  } catch (err) {
    console.error('submitReview error:', err)
    return { ok: false, message: 'Ошибка сервера. Попробуйте позже.' }
  }
}

// Получить одобренные отзывы для главной
export async function getApprovedReviews(limit = 12): Promise<ReviewRow[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reviews')
      .select('id, name, rating, text, images, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // Колонки images может ещё не быть — повторяем без неё.
      const retry = await supabase
        .from('reviews')
        .select('id, name, rating, text, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (retry.error || !retry.data) return []
      return retry.data as ReviewRow[]
    }
    if (!data) return []
    return data as ReviewRow[]
  } catch {
    return []
  }
}
