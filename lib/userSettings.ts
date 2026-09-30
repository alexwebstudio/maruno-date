'use client'

import { createClient } from '@/lib/supabase/client'

export type FontSize = 'small' | 'medium' | 'large'
export type HeadingStyle = 'classic' | 'modern' | 'script'
export type ButtonStyle = 'rounded' | 'pill' | 'sharp'
export type ImageStyle = 'rounded' | 'square' | 'pill' | 'circle'
export type PaletteId = 'gold' | 'ivory' | 'burgundy' | 'pastel' | 'dark' | 'sage'
export type DisplayType = 'elegant' | 'minimal' | 'luxury'
export type BuildFirst = 'mobile' | 'desktop'
export type AccessMode = 'link' | 'password' | 'hidden'
export type MsgChannel = 'email' | 'telegram' | 'both'

/**
 * Прогресс обучения. Живёт в том же jsonb, что и остальные настройки,
 * поэтому отдельная миграция не нужна: merge() ниже добавляет секцию
 * к записям, созданным до этого патча.
 */
/** Прогресс обучения по одному сайту. */
export interface SiteOnboardingState {
  /** Обучение по этому сайту пройдено или пропущено. */
  finished: boolean
  /** Шаги, которые нельзя вывести из данных проекта (например, «открыл предпросмотр»). */
  seenSteps: string[]
  /** Поздравление показано — второй раз не показываем. */
  congratulated?: boolean
}

export interface OnboardingState {
  /** Подсказки включены целиком. Выключается кнопкой «Больше не показывать». */
  hintsEnabled: boolean
  /**
   * Прогресс по каждому сайту отдельно, ключ — id проекта.
   *
   * Прогресс намеренно не общий на аккаунт: у второго и третьего сайта
   * обучение начинается заново, а «Мои сайты» и редактор одного и того же
   * сайта читают и пишут одну и ту же запись.
   */
  sites: Record<string, SiteOnboardingState>
}

export interface UserSettings {
  defaults: {
    fontSize: FontSize
    headingStyle: HeadingStyle
    buttonStyle: ButtonStyle
    imageStyle: ImageStyle
    palette: PaletteId
    displayType: DisplayType
    buildFirst: BuildFirst
  }
  security: {
    access: AccessMode
    pin: string
    noindex: boolean
    privateSlug: boolean
  }
  messages: {
    channel: MsgChannel
    email: string
    telegramConnected: boolean
  }
  onboarding: OnboardingState
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaults: {
    fontSize: 'medium',
    headingStyle: 'classic',
    buttonStyle: 'rounded',
    imageStyle: 'rounded',
    palette: 'gold',
    displayType: 'elegant',
    buildFirst: 'mobile',
  },
  security: {
    access: 'link',
    pin: '',
    noindex: false,
    privateSlug: false,
  },
  messages: {
    channel: 'email',
    email: '',
    telegramConnected: false,
  },
  onboarding: {
    hintsEnabled: true,
    sites: {},
  },
}

const LS_KEY = 'maruno.date.user-settings'

function hasSupabase() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  )
}

// глубокое слияние с дефолтами, чтобы новые поля не ломали старые записи
function merge(base: UserSettings, patch: Partial<UserSettings> | null | undefined): UserSettings {
  if (!patch) return base
  return {
    defaults: { ...base.defaults, ...(patch.defaults || {}) },
    security: { ...base.security, ...(patch.security || {}) },
    messages: { ...base.messages, ...(patch.messages || {}) },
    onboarding: {
      ...base.onboarding,
      ...(patch.onboarding || {}),
      // Записи по сайтам объединяем, иначе параллельное сохранение
      // из «Моих сайтов» и редактора затирало бы чужой прогресс
      sites: { ...base.onboarding.sites, ...(patch.onboarding?.sites || {}) },
    },
  }
}

export async function loadUserSettings(userId: string, fallbackEmail = ''): Promise<UserSettings> {
  const withEmail = merge(DEFAULT_SETTINGS, { messages: { ...DEFAULT_SETTINGS.messages, email: fallbackEmail } })

  // 1) Supabase
  if (hasSupabase() && userId) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle()
      if (!error && data?.settings) {
        return merge(withEmail, data.settings as Partial<UserSettings>)
      }
    } catch {
      /* fallthrough to localStorage */
    }
  }

  // 2) localStorage
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) : null
    if (raw) return merge(withEmail, JSON.parse(raw))
  } catch { /* ignore */ }

  return withEmail
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<{ ok: boolean; persisted: 'supabase' | 'local' }> {
  // всегда пишем в localStorage как резерв
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }

  if (hasSupabase() && userId) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (!error) return { ok: true, persisted: 'supabase' }
    } catch { /* fallthrough */ }
  }
  return { ok: true, persisted: 'local' }
}
