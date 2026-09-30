import type { BlockData, BlockType } from '@/types'
import { str } from './dateScenario'

/**
 * Как сцена называется для человека.
 *
 * Один список на редактор, ленту сцен и библиотеку: иначе одна и та же
 * сцена называлась бы в трёх местах по-разному.
 */
export const SCENE_META: Record<BlockType, { icon: string; label: string; desc: string }> = {
  'date-ask': {
    icon: '💌',
    label: 'Главный вопрос',
    desc: 'Первый экран с «Да» и убегающим «Нет»',
  },
  'date-choice': {
    icon: '🎯',
    label: 'Выбор',
    desc: 'Вопрос со списком вариантов. Может показываться по условию',
  },
  'date-when': {
    icon: '🗓',
    label: 'Дата и время',
    desc: 'Когда встречаемся',
  },
  'date-final': {
    icon: '❤️',
    label: 'Финал',
    desc: 'Итог истории и сводка ответов',
  },
  'date-story': {
    icon: '📸',
    label: 'Наша история',
    desc: 'Ваше фото на весь экран и текст поверх него',
  },
}

/** Короткое имя конкретной сцены: её вопрос, иначе — название типа. */
export function sceneTitle(scene: BlockData): string {
  const question = str(scene.content.question) || str(scene.content.title)
  const short = question.trim().replace(/\s+/g, ' ')
  if (!short) return SCENE_META[scene.type]?.label ?? 'Сцена'
  return short.length > 28 ? `${short.slice(0, 27)}…` : short
}
