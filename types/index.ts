export type Language = 'ru' | 'kz'

/**
 * Направление внутри экосистемы Maruno.
 * Значение пишется в колонку projects.event_type (см. supabase/migrations/
 * 20260901_event_type.sql). Это приложение всегда работает с 'date',
 * поэтому кабинет Date не видит свадебные сайты и приглашения на день
 * рождения — и наоборот. Колонка текстовая, поэтому новое направление
 * не потребовало ни одной миграции базы.
 */
export type EventType = 'wedding' | 'birthday' | 'gender_reveal' | 'date'

/** Направление этого приложения. Одна константа на весь проект. */
export const APP_EVENT_TYPE: EventType = 'date'

// Значения совпадают с колонкой projects.template.
// Человеческие названия и оформление живут в lib/templateCatalog.ts.
export type TemplateId =
  | 'soft-invite'
  | 'midnight-invite'
  | 'playful-invite'
  | 'city-walk'
  | 'cinema-night'
  | 'surprise-date'
  | 'minimal-rose'
  | 'active-day'

/**
 * СЦЕНЫ ПРИГЛАШЕНИЯ НА СВИДАНИЕ
 *
 * Приглашение на свидание — не длинная страница с секциями, а
 * последовательность экранов: вопрос → действие человека → реакция →
 * следующий экран. Поэтому «блок» здесь означает «сцену».
 *
 * Типов ровно четыре, и этого достаточно для любого сценария:
 *   date-ask    — первый экран с «Да / Нет» и убегающей кнопкой;
 *   date-choice — выбор варианта. Универсальная сцена: и «Что делаем»,
 *                 и «А что едим», и «Кто платит» — это она с разными
 *                 вариантами в данных, а не три разных компонента;
 *   date-when   — дата и время;
 *   date-final  — финал со сводкой ответов.
 *
 * Пятого типа «место» намеренно нет: место — это тот же выбор варианта
 * со своим полем «другое», то есть date-choice.
 */
export type BlockType =
  | 'date-ask'
  | 'date-choice'
  | 'date-when'
  | 'date-final'
  | 'date-story'

/** Маскот приглашения. Часть конфигурации, а не зашитый в код кролик. */
export type CharacterId = 'bunny' | 'cat' | 'bear' | 'fox' | 'panda' | 'dog' | 'none'

/**
 * Глобальные значения приглашения — единый источник того, кто зовёт,
 * кого зовут и какой персонаж ведёт историю. Значения «живут» внутри
 * сцен; этот тип описывает их для панели «Данные приглашения».
 */
export interface SiteVariables {
  /** Кто зовёт. Подставляется в подпись финального экрана. */
  sender: string
  /** Кому адресовано приглашение. Может быть пустым. */
  recipient: string
  /** Маскот, который ведёт историю по всем сценам. */
  character: CharacterId
  /**
   * Тип свидания, выбранный отправителем при создании: dinner | walk |
   * cinema | active | surprise | other. От него зависит, какие уточняющие
   * сцены попадут в сценарий и как они сформулированы.
   */
  dateType: string
  /** Главный вопрос первого экрана. */
  question: string
  /** Заголовок финального экрана. */
  finalTitle: string
  /** Куда написать после ответа. */
  contactPhone: string
  telegram: string
  whatsapp: string
  instagram: string
  musicTitle: string
}

export interface BlockData {
  id: string
  type: BlockType
  enabled: boolean
  order: number
  content: Record<string, string | string[] | boolean | number>
}

export interface ProjectColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface ProjectFonts {
  heading: string
  body: string
  // Форма элементов приглашения. Опциональны — старые проекты не ломаются.
  buttonStyle?: 'rounded' | 'pill' | 'sharp'
  imageStyle?: 'rounded' | 'square' | 'pill' | 'circle'
}

export interface ProjectMusic {
  url: string | null
  autoplay: boolean
  title: string
  accessPin?: string // PIN-код доступа к приглашению (хранится тут, чтобы не требовать миграции БД)
}

/** Содержимое приглашения: то, что редактируется и то, что публикуется. */
export interface SiteContent {
  blocks: BlockData[]
  colors: ProjectColors
  fonts: ProjectFonts
  music: ProjectMusic
}

export interface Project {
  id: string
  user_id: string
  title: string
  slug: string
  template: TemplateId
  language: Language
  /** Направление Maruno. У старых записей колонки может не быть — тогда undefined. */
  event_type?: EventType
  /**
   * Куда доставляются ответы получателя: 'site' | 'telegram' | 'email'.
   * По умолчанию 'site' — ответы копятся в разделе «Ответы» приглашения.
   * У записей до миграции 20260921 колонки нет, поэтому поле опционально.
   */
  rsvp_delivery?: 'site' | 'telegram' | 'email'
  /** Черновик. Сюда пишет автосохранение редактора. */
  colors: ProjectColors
  fonts: ProjectFonts
  music: ProjectMusic
  blocks: BlockData[]
  published: boolean
  /**
   * Снимок содержимого на момент последней публикации — именно его видит
   * тот, кому отправили ссылку. NULL у приглашений, которые ещё ни разу
   * не публиковались.
   */
  published_snapshot: SiteContent | null
  published_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** Статус проекта вычисляется из данных, а не хранится отдельной строкой. */
export type ProjectStatus =
  | 'draft'
  | 'published'
  | 'unpublished-changes'
  | 'archived'

export interface Template {
  id: TemplateId
  name: string
  description: string
  preview_url: string
  colors: ProjectColors
  fonts: ProjectFonts
  isPremium: boolean
}

export interface User {
  id: string
  email: string
  created_at: string
}

export type I18nKeys = {
  // Navigation
  nav_dashboard: string
  nav_new_project: string
  nav_logout: string
  nav_login: string
  nav_register: string
  // Landing
  hero_title: string
  hero_subtitle: string
  hero_cta: string
  hero_cta_secondary: string
  // Dashboard
  dashboard_title: string
  dashboard_empty: string
  dashboard_create: string
  dashboard_edit: string
  dashboard_delete: string
  dashboard_publish: string
  dashboard_unpublish: string
  dashboard_view: string
  dashboard_copy_link: string
  // Auth
  auth_email: string
  auth_password: string
  auth_login: string
  auth_register: string
  auth_no_account: string
  auth_have_account: string
  // Editor
  editor_save: string
  editor_publish: string
  editor_preview: string
  editor_back: string
  editor_template: string
  editor_colors: string
  editor_fonts: string
  editor_music: string
  editor_blocks: string
  editor_language: string
  // Scenes
  block_ask: string
  block_choice: string
  block_when: string
  block_final: string
  // Common
  save: string
  cancel: string
  delete: string
  close: string
  upload: string
  choose: string
  loading: string
  error: string
  success: string
  copied: string
  // Support
  support_title: string
  support_subtitle: string
}
