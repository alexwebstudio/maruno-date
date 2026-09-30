'use client'

import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  DEFAULT_SETTINGS,
  loadUserSettings,
  saveUserSettings,
  type SiteOnboardingState,
  type UserSettings,
} from '@/lib/userSettings'
import { getProjectProgress, getSiteState, shouldShowOnboarding } from '@/lib/onboarding'
import type { Project } from '@/types'

/**
 * Единое состояние подсказок для «Моих сайтов» и редактора.
 *
 * Обе страницы используют этот хук, поэтому второй, параллельной системы
 * обучения не появляется: они читают и пишут одну и ту же запись
 * user_settings.onboarding.sites[projectId].
 *
 * Прогресс переживает перезагрузку, выход и повторный вход, потому что
 * лежит в базе рядом с остальными настройками пользователя, а не в состоянии
 * компонента. Локальное хранилище остаётся запасным вариантом — так уже
 * работает loadUserSettings.
 */
export function useOnboarding(user: User | null, project: Project | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    loadUserSettings(user.id, user.email || '').then((loaded) => {
      if (cancelled) return
      setSettings(loaded)
      setReady(true)
    })
    return () => { cancelled = true }
  }, [user])

  const progress = getProjectProgress(project, settings.onboarding)
  const visible = ready && shouldShowOnboarding(settings.onboarding, progress)

  /** Правка прогресса конкретного сайта. */
  const patchSite = useCallback(
    (patch: Partial<SiteOnboardingState>) => {
      if (!user || !project) return
      setSettings((prev) => {
        const current = getSiteState(prev.onboarding, project.id)
        const next: UserSettings = {
          ...prev,
          onboarding: {
            ...prev.onboarding,
            sites: { ...prev.onboarding.sites, [project.id]: { ...current, ...patch } },
          },
        }
        // Сохраняем сразу: пользователь может уйти со страницы в любой момент
        saveUserSettings(user.id, next)
        return next
      })
    },
    [user, project],
  )

  /** Общий переключатель подсказок — он один на аккаунт. */
  const setHintsEnabled = useCallback(
    (enabled: boolean) => {
      if (!user) return
      setSettings((prev) => {
        const next: UserSettings = {
          ...prev,
          onboarding: { ...prev.onboarding, hintsEnabled: enabled },
        }
        saveUserSettings(user.id, next)
        return next
      })
    },
    [user],
  )

  /** Отметить шаг, который не виден в данных проекта (например, предпросмотр). */
  const markStep = useCallback(
    (step: string) => {
      if (!project) return
      const current = getSiteState(settings.onboarding, project.id)
      if (current.seenSteps.includes(step)) return
      patchSite({ seenSteps: [...current.seenSteps, step] })
    },
    [project, settings.onboarding, patchSite],
  )

  return {
    ready,
    settings,
    progress,
    visible,
    markStep,
    patchSite,
    setHintsEnabled,
    skip: () => patchSite({ finished: true }),
    disable: () => { patchSite({ finished: true }); setHintsEnabled(false) },
    markCongratulated: () => patchSite({ congratulated: true, finished: true }),
  }
}
