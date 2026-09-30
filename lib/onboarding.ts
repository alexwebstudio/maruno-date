import type { Project } from '@/types'
import type { OnboardingState, SiteOnboardingState } from '@/lib/userSettings'
import { deriveVariables } from '@/lib/siteVariables'
import { getTemplate } from '@/lib/templateCatalog'
import { OPTIONS_JSON } from '@/lib/templateCatalog'

/**
 * Онбординг и подсказки помощника.
 *
 * Два принципа.
 *
 * 1. Шаги считаются из реальных данных сайта, а не из счётчика «нажал далее».
 *    Поэтому прогресс не врёт: удалили фотографии — шаг снова открылся,
 *    заполнили всё мимо обучения — шаги закрылись сами.
 *
 * 2. Прогресс привязан к конкретному сайту, а не к аккаунту. «Мои сайты»
 *    и редактор одного и того же сайта читают одну запись, поэтому шаг,
 *    пройденный в одном месте, сразу считается пройденным в другом.
 */

export type StepId =
  | 'create'
  | 'question'
  | 'answers'
  | 'sender'
  | 'preview'
  | 'publish'

export interface OnboardingStep {
  id: StepId
  title: string
  /** Что именно нужно сделать — короткой фразой, без общих слов. */
  hint: string
  /** Пояснение для редактора: там человек уже внутри и ждёт конкретики. */
  editorHint: string
  href: (projectId?: string) => string
  action: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'create',
    title: 'Выберите шаблон',
    hint: 'С него начинается приглашение: палитра, шрифты, персонаж и стартовые вопросы. Всё это меняется позже.',
    editorHint: 'Шаблон уже выбран. Оформление меняется на вкладке «Стиль» слева.',
    href: () => '/dashboard/new',
    action: 'Выбрать шаблон',
  },
  {
    id: 'question',
    title: 'Напишите свой главный вопрос',
    hint: 'Первый экран — это то, ради чего человек откроет ссылку. Стандартная фраза работает хуже вашей.',
    editorHint: 'Нажмите прямо на вопрос на первой сцене и напишите свой.',
    href: (id) => (id ? `/dashboard/edit/${id}` : '/dashboard/new'),
    action: 'Открыть редактор',
  },
  {
    id: 'answers',
    title: 'Поправьте варианты ответов',
    hint: 'Замените стандартные «Пицца / Суши» на то, что подходит именно вам двоим.',
    editorHint: 'Перейдите к сцене выбора: под вариантами есть поле, где их можно переписать и добавить свои.',
    href: (id) => (id ? `/dashboard/edit/${id}` : '/dashboard/new'),
    action: 'Настроить варианты',
  },
  {
    id: 'sender',
    title: 'Подпишитесь и оставьте контакт',
    hint: 'Подпись на финале и способ связи — чтобы ответ было куда прислать.',
    editorHint: 'Вкладка «Данные» слева: поля «Кто зовёт» и Telegram / WhatsApp.',
    href: (id) => (id ? `/dashboard/edit/${id}` : '/dashboard/new'),
    action: 'Заполнить данные',
  },
  {
    id: 'preview',
    title: 'Пройдите приглашение целиком',
    hint: 'Предпросмотр проходится по-настоящему: нажмите «Да», выберите варианты и дойдите до финала.',
    editorHint: 'Кнопка «Предпросмотр» вверху. Сценарий пройдётся по-настоящему, но ответы никуда не сохранятся.',
    href: (id) => (id ? `/dashboard/edit/${id}?preview=1` : '/dashboard'),
    action: 'Открыть предпросмотр',
  },
  {
    id: 'publish',
    title: 'Опубликуйте и отправьте ссылку',
    hint: 'Публикация — единственное действие, которое меняет то, что откроется по ссылке. Автосохранение этого не делает.',
    editorHint: 'Автосохранение пишет только в черновик. По ссылке правки появятся после кнопки «Опубликовать».',
    href: (id) => (id ? `/dashboard/edit/${id}` : '/dashboard'),
    action: 'Перейти к публикации',
  },
]

/**
 * Трогал ли автор варианты ответов.
 *
 * Сравниваем с наборами из шаблона: пока в сцене стоит ровно то, что
 * положил шаблон, человек её не настраивал. Это честнее счётчика
 * «нажал далее» — правки, сделанные мимо обучения, тоже засчитываются.
 */
function hasCustomOptions(project: Project): boolean {
  const stock = new Set(Object.values(OPTIONS_JSON))
  return project.blocks.some(
    (b) => b.type === 'date-choice'
      && typeof b.content.options === 'string'
      && !stock.has(b.content.options),
  )
}

/** Пустой прогресс для сайта, по которому обучение ещё не начиналось. */
export const EMPTY_SITE_STATE: SiteOnboardingState = { finished: false, seenSteps: [] }

export function getSiteState(state: OnboardingState, projectId?: string): SiteOnboardingState {
  if (!projectId) return EMPTY_SITE_STATE
  return state.sites[projectId] ?? EMPTY_SITE_STATE
}



export interface StepState extends OnboardingStep {
  done: boolean
}

export interface OnboardingProgress {
  steps: StepState[]
  doneCount: number
  total: number
  percent: number
  /** Первый незакрытый шаг — на него и указывает помощник. */
  next: StepState | null
  complete: boolean
  project: Project | null
  /** Прогресс именно этого сайта. */
  siteState: SiteOnboardingState
}

/** Прогресс по конкретному сайту. */
export function getProjectProgress(
  project: Project | null,
  state: OnboardingState,
): OnboardingProgress {
  const siteState = getSiteState(state, project?.id)
  const vars = project ? deriveVariables(project.blocks) : null
  const demo = project ? getTemplate(project.template).demo : null

  const done: Record<StepId, boolean> = {
    create: !!project,
    // Шаг закрывается не «любым текстом», а именно своим: пока в вопросе
    // стоит фраза из шаблона, человек его ещё не писал.
    question: !!vars?.question?.trim() && vars.question.trim() !== demo?.question,
    answers: project ? hasCustomOptions(project) : false,
    sender: !!vars?.sender?.trim()
      && Boolean(vars.telegram.trim() || vars.whatsapp.trim() || vars.instagram.trim() || vars.contactPhone.trim()),
    // Открытие предпросмотра из данных не видно — отмечаем флагом
    preview: siteState.seenSteps.includes('preview'),
    publish: !!project?.published,
  }

  const steps: StepState[] = ONBOARDING_STEPS.map((s) => ({ ...s, done: done[s.id] }))
  const doneCount = steps.filter((s) => s.done).length
  const total = steps.length

  return {
    steps,
    doneCount,
    total,
    percent: Math.round((doneCount / total) * 100),
    next: steps.find((s) => !s.done) ?? null,
    complete: doneCount === total,
    project,
    siteState,
  }
}

/**
 * Сайт, по которому показываем обучение в кабинете, — последний изменённый.
 * Именно с ним человек работает прямо сейчас.
 */
export function pickActiveProject(projects: Project[]): Project | null {
  if (!projects.length) return null
  return [...projects].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0]
}

/** Показывать ли обучение: подсказки включены, по этому сайту не пройдено. */
export function shouldShowOnboarding(state: OnboardingState, progress: OnboardingProgress): boolean {
  if (!state.hintsEnabled) return false
  if (progress.siteState.finished) return false
  return true
}
