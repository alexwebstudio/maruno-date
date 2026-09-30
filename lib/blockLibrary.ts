import type { BlockData, BlockType } from '@/types'
import { SCENE_META } from './sceneMeta'
import { OPTIONS_JSON } from './templateCatalog'

/**
 * БИБЛИОТЕКА СЦЕН
 *
 * То же место в архитектуре, что библиотека блоков в остальных
 * направлениях Maruno: список готовых заготовок, которые автор
 * добавляет в приглашение из редактора.
 *
 * Заготовок немного и это не недоработка. Сценарий свидания держится
 * на четырёх типах экранов, а разнообразие даёт не число компонентов,
 * а содержимое: «Что делаем», «Что едим» и «Кто платит» — это одна
 * и та же сцена выбора с разными вариантами в данных.
 */

export type BlockCategory = 'ask' | 'choice' | 'when' | 'story' | 'final'

export const CATEGORIES: { id: BlockCategory; label: string; icon: string }[] = [
  { id: 'ask', label: 'Вопрос', icon: '💌' },
  { id: 'choice', label: 'Выбор', icon: '🎯' },
  { id: 'when', label: 'Дата и время', icon: '🗓' },
  { id: 'story', label: 'Наша история', icon: '📸' },
  { id: 'final', label: 'Финал', icon: '❤️' },
]

export interface CatalogItem {
  id: string
  category: BlockCategory
  name: string
  desc: string
  type: BlockType
  content: BlockData['content']
}

/** Общие для всех сцен поля. Персонаж и раскладку потом выровняет applyVariables. */
const base = { character: 'bunny', layout: 'center' }

export const BLOCK_CATALOG: CatalogItem[] = [
  {
    id: 'ask-main',
    category: 'ask',
    name: 'Главный вопрос',
    desc: 'Первый экран приглашения: «Да» и убегающее «Нет»',
    type: 'date-ask',
    content: {
      ...base,
      question: 'Ты хочешь пойти со мной на свидание?',
      subtitle: '',
      recipient: '',
      yesLabel: 'Да',
      noLabel: 'Нет',
      runaway: true,
      taunts: JSON.stringify(['Точно?', 'Подумай ещё', 'Не получится 😏', 'Не догонишь']),
      particles: 'hearts',
    },
  },
  {
    id: 'choice-activity',
    category: 'choice',
    name: 'Чем займёмся',
    desc: 'Поесть, кино, прогулка, активность',
    type: 'date-choice',
    content: {
      ...base,
      key: 'activity',
      question: 'Что ты хочешь?',
      subtitle: '',
      summaryLabel: 'Чем займёмся',
      options: OPTIONS_JSON.activities,
      allowCustom: false,
      customLabel: 'Свой вариант',
      showIf: '',
      runawayOption: '',
    },
  },
  {
    id: 'choice-food',
    category: 'choice',
    name: 'Что будем есть',
    desc: 'Условная сцена: показывается, если выбрали «Поесть»',
    type: 'date-choice',
    content: {
      ...base,
      key: 'food',
      question: 'А что будем есть?',
      subtitle: '',
      summaryLabel: 'Что едим',
      options: OPTIONS_JSON.food,
      allowCustom: true,
      customLabel: 'Свой вариант',
      showIf: 'activity=eat',
      runawayOption: '',
    },
  },
  {
    id: 'choice-payer',
    category: 'choice',
    name: 'Кто платит',
    desc: 'Шутка на один экран: вариант «Ты» может уворачиваться',
    type: 'date-choice',
    content: {
      ...base,
      key: 'payer',
      question: 'Кто сегодня платит? 😏',
      subtitle: '',
      summaryLabel: 'Кто платит',
      options: OPTIONS_JSON.payers,
      allowCustom: false,
      customLabel: 'Свой вариант',
      showIf: '',
      runawayOption: 'you',
    },
  },
  {
    id: 'choice-place',
    category: 'choice',
    name: 'Куда пойдём',
    desc: 'Готовые места плюс своё',
    type: 'date-choice',
    content: {
      ...base,
      key: 'place',
      question: 'Куда пойдём?',
      subtitle: '',
      summaryLabel: 'Место',
      options: OPTIONS_JSON.places,
      allowCustom: true,
      customLabel: 'Своё место',
      customPlaceholder: 'Напиши, куда хочешь',
      showIf: '',
      runawayOption: '',
    },
  },
  {
    id: 'choice-blank',
    category: 'choice',
    name: 'Свой вопрос',
    desc: 'Пустая сцена выбора — вопрос и варианты задаёте вы',
    type: 'date-choice',
    content: {
      ...base,
      key: '',
      question: 'Свой вопрос',
      subtitle: '',
      summaryLabel: 'Ответ',
      options: JSON.stringify([
        { id: 'a', emoji: '✨', label: 'Первый вариант' },
        { id: 'b', emoji: '✨', label: 'Второй вариант' },
      ]),
      allowCustom: false,
      customLabel: 'Свой вариант',
      showIf: '',
      runawayOption: '',
    },
  },
  {
    id: 'when-main',
    category: 'when',
    name: 'Дата и время',
    desc: 'День и час встречи',
    type: 'date-when',
    content: {
      ...base,
      question: 'Когда ты свободен?',
      subtitle: 'Выбери день и время — я подстроюсь',
      dateLabel: 'День',
      timeLabel: 'Время',
      summaryDateLabel: 'Дата',
      summaryTimeLabel: 'Время',
      quickTimes: JSON.stringify(['18:00', '19:00', '20:00', '21:00']),
      confirmLabel: 'Готово',
    },
  },
  {
    id: 'final-main',
    category: 'final',
    name: 'Финал',
    desc: 'Итог истории со сводкой ответов',
    type: 'date-final',
    content: {
      ...base,
      title: 'Тогда договорились ❤️',
      subtitle: '',
      refusedTitle: 'Ладно. Может, в другой раз 🙂',
      refusedSubtitle: '',
      signature: '',
      showSummary: true,
      particles: 'hearts',
      telegram: '',
      whatsapp: '',
      instagram: '',
      phone: '',
    },
  },
  {
    id: 'story-main',
    category: 'story',
    name: 'Наша история',
    desc: 'Ваше фото на весь экран и текст поверх него',
    type: 'date-story',
    content: {
      ...base,
      title: 'Помнишь?',
      text: 'Здесь могла бы быть пара строк только про вас двоих.',
      cta: 'Дальше',
      photo: '',
    },
  },
]

export function itemsByCategory(category: BlockCategory): CatalogItem[] {
  return BLOCK_CATALOG.filter((i) => i.category === category)
}

/** Человеческое имя типа сцены. Источник — SCENE_META, чтобы не расходиться. */
export function typeLabel(type: BlockType): string {
  return SCENE_META[type]?.label ?? type
}

/**
 * Новая сцена из заготовки.
 *
 * Идентификатор уникален: два экрана «Выбор» в одном приглашении —
 * обычное дело, и одинаковый id сломал бы и правку, и порядок.
 * Ключ ответа тоже разводится, иначе вторая сцена затирала бы ответ первой.
 */
export function makeBlockFromCatalog(item: CatalogItem, order: number): BlockData {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)

  const content = { ...item.content }
  if (item.type === 'date-choice' && !String(content.key || '').trim()) {
    content.key = `choice-${suffix}`
  }

  return {
    id: `${item.type}-${suffix}`,
    type: item.type,
    enabled: true,
    order,
    content,
  }
}
