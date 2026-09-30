import toast from 'react-hot-toast'

/**
 * Единая работа с ошибками.
 *
 * До этого каждая функция ловила исключение и показывала своё сообщение —
 * от «Ошибка» до пустого catch. Здесь одно место, где ошибка превращается
 * в понятный пользователю текст и в запись для диагностики.
 */

/** Короткий идентификатор, чтобы связать жалобу пользователя с логом. */
export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export interface AppErrorContext {
  /** Что пытались сделать: 'publish', 'save', 'upload' и т.п. */
  action: string
  /** Дополнительные технические детали. Персональные данные сюда не кладём. */
  meta?: Record<string, string | number | boolean | null>
}

const OFFLINE_MESSAGE = 'Нет соединения с интернетом. Изменения сохранены на устройстве'
const SESSION_MESSAGE = 'Сессия закончилась — войдите заново'

/**
 * Приводит ошибку к тексту для пользователя.
 * Технические подробности наружу не выносим: они уходят в лог.
 */
export function describeError(error: unknown, fallback: string): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return OFFLINE_MESSAGE

  const message = error instanceof Error ? error.message : String(error ?? '')

  if (/jwt|not authenticated|session|refresh token/i.test(message)) return SESSION_MESSAGE
  if (/fetch failed|network|timeout|failed to fetch/i.test(message)) {
    return 'Сервер не отвечает. Попробуйте ещё раз через минуту'
  }
  if (/payload too large|body exceeded|413/i.test(message)) return 'Файл слишком большой'
  if (/unsupported|mime|content type/i.test(message)) return 'Формат файла не поддерживается'
  if (/duplicate key|already exists/i.test(message)) return 'Такая запись уже есть'
  if (/row-level security|permission denied|403/i.test(message)) {
    return 'Недостаточно прав для этого действия'
  }

  return fallback
}

/**
 * Записывает ошибку с техническим контекстом.
 *
 * Здесь же подключается внешний мониторинг: точка одна, поэтому добавить
 * Sentry или аналог можно, не трогая компоненты. Персональные данные
 * (тексты приглашений, почты, телефоны) в контекст не передаются.
 */
export function logError(error: unknown, context: AppErrorContext): string {
  const requestId = newRequestId()

  const payload = {
    requestId,
    action: context.action,
    message: error instanceof Error ? error.message : String(error ?? 'unknown'),
    name: error instanceof Error ? error.name : 'UnknownError',
    ...context.meta,
  }

  // TODO(monitoring): здесь вызывается Sentry.captureException(error, { extra: payload })
  // или аналог. Пока пишем в консоль — без этого диагностировать нечего.
  console.error('[maruno]', payload)

  return requestId
}

/**
 * Показать ошибку пользователю и записать её.
 * Возвращает requestId — его можно показать в интерфейсе для обращения в поддержку.
 */
export function reportError(error: unknown, context: AppErrorContext, fallback: string): string {
  const requestId = logError(error, context)
  toast.error(describeError(error, fallback))
  return requestId
}

/** Успешные действия — тем же набором формулировок, что и ошибки. */
export const notify = {
  saved: () => toast.success('Сохранено в черновик'),
  published: () => toast.success('Изменения опубликованы'),
  linkCopied: () => toast.success('Ссылка скопирована'),
  offline: () => toast.error(OFFLINE_MESSAGE),
  sessionExpired: () => toast.error(SESSION_MESSAGE),
}
