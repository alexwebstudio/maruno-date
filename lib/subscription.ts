'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import type { BlockType } from '@/types'

/**
 * Тарифы Maruno Date.
 *
 * Их ровно два, и оба — та же система тарифов Maruno, что в остальных
 * направлениях. Отдельной оплаты «для свиданий» нет и не планируется.
 *
 * Смысл платного тарифа здесь простой: 2000 ₸ за аккаунт, в аккаунте
 * до десяти приглашений. Библиотека сцен при этом не делится на
 * «доступное» и «показываем, но не дадим» — все сцены доступны всем.
 */
export type Plan = 'start' | 'standard'

export const PLAN_RANK: Record<Plan, number> = { start: 0, standard: 1 }

/*
 * Названия и цены совпадают с посадочной страницей: человек не должен
 * видеть в кабинете одно название тарифа, а на сайте — другое.
 */
export const PLAN_META: Record<Plan, { label: string; short: string; color: string; desc: string; price: string }> = {
  start:    { label: 'Бесплатно', short: 'Free',     color: '#8A7680', price: '0 ₸',     desc: 'До 2 приглашений и базовые сцены' },
  standard: { label: 'Стандарт',  short: 'Standard', color: '#F5306B', price: '2 000 ₸', desc: 'До 10 приглашений, дополнительные сцены и рассылки' },
}

// Сцены, доступные на бесплатном тарифе. Сценарий свидания держится
// на четырёх типах экранов, и урезать этот набор было бы нечестно:
// приглашение без выбора или без финала — не приглашение.
export const BASE_BLOCK_TYPES: BlockType[] = ['date-ask', 'date-choice', 'date-when', 'date-final']

export function isBaseBlockType(t: BlockType): boolean {
  return BASE_BLOCK_TYPES.includes(t)
}

// На бесплатном тарифе нельзя добавлять новые сцены — только править те,
// что пришли из выбранного шаблона.
export function canAddBlocks(plan: Plan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK.standard
}

const keyFor = (id?: string) => `maruno.date.plan.${id || 'anon'}`

export function resolvePlan(override?: Plan | null): Plan {
  return override ?? 'start'
}

/**
 * Тариф текущего пользователя. Пока оплата не подключена, тариф хранится
 * локально и переключается «демо-оплатой» — статус меняется мгновенно,
 * без повторного входа.
 */
export function usePlan() {
  const { user } = useAuth()
  const [override, setOverride] = useState<Plan | null>(null)

  useEffect(() => {
    if (!user) { setOverride(null); return }
    try {
      const v = localStorage.getItem(keyFor(user.id)) as Plan | null
      setOverride(v === 'start' || v === 'standard' ? v : null)
    } catch { setOverride(null) }
  }, [user])

  const plan = resolvePlan(override)

  const setPlan = useCallback((next: Plan) => {
    if (!user) return
    try { localStorage.setItem(keyFor(user.id), next) } catch {}
    setOverride(next)
  }, [user])

  return { plan, setPlan, meta: PLAN_META[plan] }
}
