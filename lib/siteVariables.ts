import type { BlockData, SiteVariables } from '@/types'
import { isCharacterId, str } from './dateScenario'

/**
 * ГЛОБАЛЬНЫЕ ЗНАЧЕНИЯ ПРИГЛАШЕНИЯ
 *
 * Механизм тот же, что в остальных направлениях Maruno: значения физически
 * живут внутри сцен, а эти две функции умеют их оттуда прочитать и разложить
 * обратно. Отдельного хранилища «настройки приглашения» нет — иначе данные
 * пришлось бы синхронизировать в двух местах.
 *
 * Для свидания сюда попадает то, что относится ко всему приглашению целиком:
 * кто зовёт, кого зовут, какой персонаж ведёт историю и как с автором
 * связаться. Дата, место и активность в этот список НЕ входят: их выбирает
 * тот, кому приглашение отправили, — в этом весь смысл.
 */

export const EMPTY_VARS: SiteVariables = {
  sender: '', recipient: '', character: 'bunny', dateType: 'other',
  question: '', finalTitle: '',
  contactPhone: '', telegram: '', whatsapp: '', instagram: '',
  musicTitle: '',
}

/** Читаемая дата для сводки и подписей: dd.mm.yyyy. */
export function displayDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
  } catch { return iso }
}

// Считывает глобальные значения из сцен (первое совпадение по типу).
export function deriveVariables(blocks: BlockData[]): SiteVariables {
  const byType = (t: string) => blocks.find((b) => b.type === t)?.content ?? {}
  const ask = byType('date-ask')
  const final = byType('date-final')
  const rawCharacter = ask.character ?? final.character

  return {
    sender: str(final.signature),
    recipient: str(ask.recipient),
    character: isCharacterId(rawCharacter) ? rawCharacter : 'bunny',
    // Тип свидания живёт на первой сцене: он задан при создании и дальше
    // определяет, какие уточняющие сцены показывать.
    dateType: str(ask.dateType) || 'other',
    question: str(ask.question),
    finalTitle: str(final.title),
    contactPhone: str(final.phone),
    telegram: str(final.telegram),
    whatsapp: str(final.whatsapp),
    instagram: str(final.instagram),
    musicTitle: '',
  }
}

/**
 * Раскладывает глобальные значения обратно во все подходящие сцены.
 * Меняет только те поля, что относятся к переменным — остальной контент
 * (варианты ответов, условия показа, подписи сводки) не трогает.
 *
 * Персонаж попадает в КАЖДУЮ сцену: он ведёт историю целиком, и разные
 * маскоты на соседних экранах выглядели бы ошибкой.
 */
export function applyVariables(blocks: BlockData[], v: SiteVariables): BlockData[] {
  return blocks.map((b) => {
    const c = { ...b.content }

    if (v.character) c.character = v.character

    switch (b.type) {
      case 'date-ask':
        if (v.question) c.question = v.question
        if (v.recipient !== undefined) c.recipient = v.recipient
        if (v.dateType) c.dateType = v.dateType
        break
      case 'date-final':
        if (v.finalTitle) c.title = v.finalTitle
        if (v.sender !== undefined) c.signature = v.sender
        if (v.telegram !== undefined) c.telegram = v.telegram
        if (v.whatsapp !== undefined) c.whatsapp = v.whatsapp
        if (v.instagram !== undefined) c.instagram = v.instagram
        if (v.contactPhone !== undefined) c.phone = v.contactPhone
        break
    }

    return { ...b, content: c }
  })
}
