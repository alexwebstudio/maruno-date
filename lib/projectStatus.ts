import type { Project, ProjectStatus, SiteContent } from '@/types'

/**
 * Статус проекта считается из данных, а не хранится отдельной строкой,
 * которая может разойтись с реальностью.
 */

/**
 * Стабильная сериализация: ключи объектов сортируются.
 * Postgres нормализует порядок ключей в jsonb по-своему, а объект из редактора
 * приходит в порядке присваивания — без сортировки сравнение давало бы
 * ложное «есть изменения» сразу после публикации.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
}

function sameContent(a: SiteContent, b: SiteContent): boolean {
  return stableStringify(a) === stableStringify(b)
}

function draftOf(project: Project): SiteContent {
  return {
    blocks: project.blocks,
    colors: project.colors,
    fonts: project.fonts,
    music: project.music,
  }
}

/** Есть ли правки, которых ещё нет на публичном сайте. */
export function hasUnpublishedChanges(project: Project): boolean {
  if (!project.published) return false
  // Сайт опубликован до появления снимков — считаем, что расхождений нет
  if (!project.published_snapshot) return false
  return !sameContent(draftOf(project), project.published_snapshot)
}

export function getProjectStatus(project: Project): ProjectStatus {
  if (project.archived_at) return 'archived'
  if (!project.published) return 'draft'
  return hasUnpublishedChanges(project) ? 'unpublished-changes' : 'published'
}

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; hint: string; color: string; background: string }
> = {
  draft: {
    label: 'Черновик',
    hint: 'Приглашение видно только вам. Опубликуйте, чтобы отправить ссылку',
    color: 'var(--color-ink-600)',
    background: 'var(--color-paper-3)',
  },
  published: {
    label: 'Опубликован',
    hint: 'Гости видят актуальную версию сайта',
    color: 'var(--color-mint)',
    background: 'rgba(79, 95, 73, 0.12)',
  },
  'unpublished-changes': {
    label: 'Есть неопубликованные изменения',
    hint: 'Правки сохранены в черновике. Гости пока видят прошлую версию',
    color: 'var(--color-punch)',
    background: 'var(--color-cream)',
  },
  archived: {
    label: 'В архиве',
    hint: 'Сайт снят с публикации и убран из основного списка',
    color: 'var(--color-ink-400)',
    background: 'var(--color-paper-2)',
  },
}

/** Дата в формате «12 мая 2026, 14:30». */
export function formatMoment(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
