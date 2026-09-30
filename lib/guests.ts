import { createClient } from './supabase/client'

/**
 * ОТВЕТЫ НА ПРИГЛАШЕНИЕ
 *
 * Ответы хранятся в той же таблице `rsvp_responses`, что и ответы гостей
 * в остальных направлениях Maruno, и всегда привязаны к конкретному
 * приглашению через `project_id`. Своей таблицы для свиданий нет: это те
 * же ответы на приглашение, только пришедшие из интерактивного сценария.
 *
 * Что именно человек выбрал — активность, еду, дату, место — лежит в
 * `extra`: набор вопросов у каждого приглашения свой, поэтому колонок
 * под них быть не может.
 *
 * Права разграничивает RLS в Supabase: владелец приглашения читает и
 * удаляет только свои ответы, отвечающий может лишь добавить запись.
 * Поэтому здесь нет ни одной проверки прав — она была бы иллюзией
 * защиты на клиенте.
 */

/** Куда попадают ответы. Задаётся отдельно для каждого приглашения. */
export type RsvpDelivery = 'site' | 'telegram' | 'email'

export const DEFAULT_RSVP_DELIVERY: RsvpDelivery = 'site'

export const DELIVERY_LABELS: Record<RsvpDelivery, { title: string; hint: string }> = {
  site: {
    title: 'В кабинет',
    hint: 'Ответы копятся в разделе «Ответы» этого приглашения. Ничего настраивать не нужно.',
  },
  telegram: {
    title: 'В Telegram',
    hint: 'Каждый ответ приходит сообщением боту. Ответы всё равно сохраняются в разделе «Ответы».',
  },
  email: {
    title: 'На почту',
    hint: 'Каждый ответ приходит письмом. Ответы всё равно сохраняются в разделе «Ответы».',
  },
}

export interface GuestResponse {
  id: string
  project_id: string
  name: string
  attending: 'yes' | 'no'
  guest_count: number
  /** Комментарий. Может отсутствовать у старых записей. */
  comment: string | null
  /**
   * Что человек выбрал в сценарии: ключ — подпись сцены в сводке
   * («Чем займёмся», «Дата»), значение — выбранный вариант.
   */
  extra: Record<string, string>
  created_at: string
}

export interface GuestStats {
  /** Сколько раз приглашение прошли до конца. */
  responses: number
  /** Сколько раз согласились. */
  attending: number
  /** Сколько раз отказались. */
  declined: number
}

/**
 * Признак того, что миграция 20260921_guest_responses.sql ещё не выполнена.
 * Проверяем по тексту ошибки: Supabase не отдаёт машиночитаемый код
 * для отсутствующей колонки в SELECT.
 */
function isMissingColumn(message?: string): boolean {
  return !!message && /column|does not exist|comment|extra/i.test(message)
}

/** Ответы одного приглашения, новые сверху. */
export async function getGuestResponses(projectId: string): Promise<GuestResponse[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('rsvp_responses')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Старые записи созданы до появления comment/extra — приводим к общему виду,
  // чтобы интерфейсу не приходилось знать про историю схемы.
  return (data ?? []).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    name: r.name,
    attending: r.attending,
    guest_count: r.guest_count ?? 0,
    comment: r.comment ?? null,
    extra: (r.extra ?? {}) as Record<string, string>,
    created_at: r.created_at,
  }))
}

/** Сводка по ответам — то, что человек хочет увидеть первым. */
export function summarize(list: GuestResponse[]): GuestStats {
  return list.reduce<GuestStats>(
    (acc, r) => {
      acc.responses += 1
      if (r.attending === 'yes') acc.attending += 1
      else acc.declined += 1
      return acc
    },
    { responses: 0, attending: 0, declined: 0 },
  )
}

/** Удаление ответа владельцем приглашения (дубль, случайное прохождение). */
export async function deleteGuestResponse(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('rsvp_responses').delete().eq('id', id)
  if (error) throw error
}

/**
 * Смена способа получения ответов у конкретного приглашения.
 *
 * Если колонки ещё нет, сообщаем об этом честно: молча «сохранить»
 * настройку, которой некуда записаться, значит соврать человеку —
 * он уйдёт уверенным, что ответы теперь приходят в Telegram.
 */
export async function setRsvpDelivery(projectId: string, delivery: RsvpDelivery): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ rsvp_delivery: delivery })
    .eq('id', projectId)

  if (!error) return

  if (isMissingColumn(error.message)) {
    throw new Error(
      'Не удалось сохранить: в базе нет колонки rsvp_delivery. ' +
      'Выполните supabase/migrations/20260921_guest_responses.sql.',
    )
  }
  throw error
}

/** Дата ответа в человеческом виде: «21 августа 2026, 14:30». */
export function formatAnsweredAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/**
 * Выгрузка ответов в CSV.
 *
 * Колонки собираются из самих ответов: набор вопросов у каждого
 * приглашения свой, поэтому фиксированного списка колонок быть не может.
 */
export function toCsv(list: GuestResponse[]): string {
  const extraKeys = Array.from(
    new Set(list.flatMap((r) => Object.keys(r.extra ?? {}))),
  )

  const head = ['Кому', 'Ответ', ...extraKeys, 'Дата ответа']
  const rows = list.map((r) => [
    r.name,
    r.attending === 'yes' ? 'Согласие' : 'Отказ',
    ...extraKeys.map((k) => r.extra?.[k] ?? ''),
    formatAnsweredAt(r.created_at),
  ])
  // Экранируем кавычки по правилам CSV, иначе значение с запятой
  // разъедет по колонкам при открытии в Excel
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [head, ...rows].map((row) => row.map(esc).join(',')).join('\r\n')
}
