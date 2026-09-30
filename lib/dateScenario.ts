import type { BlockData, CharacterId } from '@/types'

/**
 * СЦЕНАРИЙ ПРИГЛАШЕНИЯ НА СВИДАНИЕ
 *
 * Здесь живёт вся логика последовательности: какие сцены показывать,
 * в каком порядке, какие пропустить и что в итоге получилось.
 *
 * Логика намеренно отделена от компонентов: одну и ту же функцию
 * вызывают редактор (чтобы показать автору, какая сцена за какой),
 * предпросмотр и опубликованное приглашение. Разойтись они не могут.
 *
 * Своей «системы сценариев» тут нет: сцены — это обычные блоки проекта
 * из projects.blocks, а условие показа — обычное поле в данных блока.
 */

/** Ответ на одну сцену. Хранит и значение, и то, как его показать человеку. */
export interface Answer {
  /** Идентификатор варианта: 'eat', 'cinema'. Для своего варианта — 'custom'. */
  value: string
  /** Подпись варианта — она попадёт в сводку финального экрана. */
  label: string
  emoji?: string
}

/** Состояние прохождения: ключ сцены → ответ. */
export type Answers = Record<string, Answer>

export interface DateOption {
  id: string
  emoji: string
  label: string
}

/** Персонажи, доступные в редакторе. Список — часть конфигурации, не хардкод сцен. */
export const CHARACTERS: { id: CharacterId; label: string; emoji: string }[] = [
  { id: 'bunny', label: 'Зайка', emoji: '🐰' },
  { id: 'cat', label: 'Котик', emoji: '🐱' },
  { id: 'bear', label: 'Мишка', emoji: '🐻' },
  { id: 'fox', label: 'Лисёнок', emoji: '🦊' },
  { id: 'panda', label: 'Панда', emoji: '🐼' },
  { id: 'dog', label: 'Пёсик', emoji: '🐶' },
  { id: 'none', label: 'Без персонажа', emoji: '—' },
]

const CHARACTER_IDS = new Set<CharacterId>(['bunny', 'cat', 'bear', 'fox', 'panda', 'dog', 'none'])

export function isCharacterId(v: unknown): v is CharacterId {
  return typeof v === 'string' && CHARACTER_IDS.has(v as CharacterId)
}

/**
 * ТИПЫ СВИДАНИЯ
 *
 * Отправитель выбирает тип при создании — он задаёт тему приглашения:
 * главный вопрос, уточняющую сцену и её формулировки. Это и есть
 * «динамическая адаптация»: данные одного выбора меняют весь сценарий,
 * а не только подпись.
 */
export interface DateTypeDef {
  id: string
  emoji: string
  /** Короткая подпись в мастере: «Поужинать». */
  label: string
  /** Пояснение под подписью. */
  hint: string
  /** Главный вопрос первого экрана для этого типа. */
  question: string
}

export const DATE_TYPES: DateTypeDef[] = [
  { id: 'dinner',  emoji: '🍽', label: 'Поужинать',        hint: 'Ресторан, бар или ужин дома', question: 'Поужинаешь сегодня со мной?' },
  { id: 'walk',    emoji: '🚶', label: 'Погулять',          hint: 'Набережная, парк, крыша с видом', question: 'Прогуляешься со мной сегодня?' },
  { id: 'cinema',  emoji: '🎬', label: 'Сходить в кино',    hint: 'Сеанс на двоих', question: 'Сходим в кино вдвоём?' },
  { id: 'active',  emoji: '🎯', label: 'Активно',           hint: 'Боулинг, каток, квест', question: 'Проведём этот день активно?' },
  { id: 'surprise',emoji: '🎁', label: 'Устроить сюрприз',  hint: 'Ты решаешь всё сам', question: 'Доверишься мне на один вечер?' },
  { id: 'other',   emoji: '✨', label: 'Пока не решил',     hint: 'Спрошу у неё саму', question: 'Пойдёшь со мной на свидание?' },
]

export function isDateType(v: unknown): v is string {
  return typeof v === 'string' && DATE_TYPES.some((d) => d.id === v)
}

export function getDateType(id: string): DateTypeDef {
  return DATE_TYPES.find((d) => d.id === id) ?? DATE_TYPES[DATE_TYPES.length - 1]
}

export function readCharacter(content: BlockData['content'] | undefined): CharacterId {
  const v = content?.character
  return isCharacterId(v) ? v : 'bunny'
}

/** Строка из данных блока. Контент хранится как строки — тут одно место для приведения. */
export function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback
}

export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

/**
 * Варианты ответа сцены. Хранятся JSON-строкой в content.options —
 * ровно так же, как список фотографий или программа вечера в других
 * направлениях Maruno.
 */
export function parseOptions(raw: unknown): DateOption[] {
  if (Array.isArray(raw)) return raw as DateOption[]
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((o) => o && typeof o === 'object')
      .map((o, i) => ({
        id: str((o as DateOption).id) || `opt-${i}`,
        emoji: str((o as DateOption).emoji),
        label: str((o as DateOption).label),
      }))
      .filter((o) => o.label)
  } catch {
    return []
  }
}

export function stringifyOptions(options: DateOption[]): string {
  return JSON.stringify(options)
}

/** Ключ, под которым ответ сцены попадает в состояние. */
export function sceneKey(block: BlockData, index: number): string {
  if (block.type === 'date-when') return 'when'
  if (block.type === 'date-ask') return 'ask'
  return str(block.content.key) || `scene-${index}`
}

/**
 * Условие показа сцены: `activity=eat` или `activity=eat,drink`.
 *
 * Формат выбран так, чтобы автору не понадобился конструктор условий:
 * в редакторе это выпадающий список «показывать, если в сцене X выбрали Y».
 * Пустое условие — сцена показывается всегда.
 */
export function sceneVisible(block: BlockData, answers: Answers): boolean {
  if (block.enabled === false) return false
  const cond = str(block.content.showIf).trim()
  if (!cond) return true

  const [key, rawValues] = cond.split('=')
  if (!key || !rawValues) return true

  const wanted = rawValues.split(',').map((v) => v.trim()).filter(Boolean)
  const given = answers[key.trim()]?.value
  if (!given) return false
  return wanted.includes(given)
}

/**
 * Сцены, которые человек действительно увидит при текущих ответах.
 * Первая сцена показывается всегда — иначе приглашение не с чего начать.
 */
export function visibleScenes(blocks: BlockData[], answers: Answers): BlockData[] {
  return [...blocks]
    .sort((a, b) => a.order - b.order)
    .filter((b) => sceneVisible(b, answers))
}

/** Все сцены по порядку, включая условные. Нужно редактору: автор правит их все. */
export function allScenes(blocks: BlockData[]): BlockData[] {
  return [...blocks].sort((a, b) => a.order - b.order)
}

export interface SummaryRow {
  key: string
  label: string
  value: string
  emoji?: string
}

/**
 * Сводка для финального экрана: «Дата, Время, Место, Активность».
 * Строки собираются из самих сцен, а не из отдельного списка настроек —
 * поэтому переименованная сцена автоматически меняет подпись в финале
 * и рассинхронизироваться они не могут.
 */
export function summaryRows(blocks: BlockData[], answers: Answers): SummaryRow[] {
  const rows: SummaryRow[] = []

  for (const [i, block] of allScenes(blocks).entries()) {
    if (!sceneVisible(block, answers)) continue

    if (block.type === 'date-when') {
      const date = answers.date
      const time = answers.time
      if (date?.label) {
        rows.push({ key: 'date', label: str(block.content.summaryDateLabel, 'Дата'), value: date.label, emoji: '📅' })
      }
      if (time?.label) {
        rows.push({ key: 'time', label: str(block.content.summaryTimeLabel, 'Время'), value: time.label, emoji: '🕒' })
      }
      continue
    }

    if (block.type !== 'date-choice') continue

    const key = sceneKey(block, i)
    const answer = answers[key]
    if (!answer?.label) continue
    rows.push({
      key,
      label: str(block.content.summaryLabel) || str(block.content.question, 'Ответ'),
      value: answer.label,
      emoji: answer.emoji,
    })
  }

  return rows
}

/**
 * Ответ, который уходит автору приглашения.
 *
 * Ложится в существующую таблицу rsvp_responses: `attending` — согласился
 * человек или нет, `extra` — что именно он выбрал. Своей таблицы для
 * свиданий не заводим: это те же ответы на приглашение.
 */
export function buildAnswerPayload(blocks: BlockData[], answers: Answers): {
  attending: 'yes' | 'no'
  extra: Record<string, string>
} {
  const extra: Record<string, string> = {}
  for (const row of summaryRows(blocks, answers)) {
    extra[row.label] = row.value
  }
  return {
    attending: answers.ask?.value === 'no' ? 'no' : 'yes',
    extra,
  }
}

/** Читаемая дата для сводки: 14 августа. */
export function humanDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

/** Дразнилки убегающей кнопки. Пустой список — кнопка просто двигается молча. */
export function parseTaunts(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string')
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : []
  } catch {
    return []
  }
}
