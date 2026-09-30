import type { BlockData, ProjectColors, ProjectFonts } from '@/types'
import type { Answer, Answers } from '@/lib/dateScenario'

/**
 * Единый контракт сцены.
 *
 * Первая половина полей — та же, что у блоков остальных направлений
 * Maruno (block / colors / fonts / isEditing / onChange): сцена остаётся
 * обычным блоком проекта и редактируется тем же способом.
 *
 * Вторая половина — то, чем сцена отличается от секции лендинга:
 * она принимает ответ человека и передаёт его дальше по сценарию.
 */
export interface SceneProps {
  block: BlockData
  colors: ProjectColors
  fonts: ProjectFonts
  /** Режим правки: тексты редактируются, переходы по сценарию выключены. */
  isEditing: boolean
  onChange: (content: BlockData['content']) => void
  /**
   * Ответ человека. Передаётся набором, потому что одна сцена может
   * заполнить сразу несколько значений (дата и время).
   * Переход к следующей сцене делает DateSite — сцена о порядке не знает.
   */
  onAnswer: (patch: Answers) => void
  /** Уже собранные ответы. Нужны финалу для сводки. */
  answers: Answers
  /** Все сцены приглашения. Нужны финалу, чтобы собрать сводку по порядку. */
  blocks: BlockData[]
  /** Нужны сценам с загрузкой фото (напр. «Наша история»). */
  userId?: string
  projectId?: string
}

export type { Answer, Answers }
