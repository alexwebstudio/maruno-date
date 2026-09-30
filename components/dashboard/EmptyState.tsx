'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, CloudOff, Loader2, RotateCcw, Search, Archive, TriangleAlert } from 'lucide-react'

export type EmptyKind =
  | 'no-projects'
  | 'no-results'
  | 'all-archived'
  | 'load-error'
  | 'creating'
  | 'offline'

interface EmptyStateProps {
  kind: EmptyKind
  /** Запросить обучение заново — только для пустого кабинета. */
  onStartTour?: () => void
  /** Повторить загрузку — для ошибки и офлайна. */
  onRetry?: () => void
  /** Сбросить поиск — когда ничего не нашлось. */
  onResetSearch?: () => void
  /** Показать архивные проекты. */
  onShowArchived?: () => void
}

interface Copy {
  icon: ReactNode
  title: string
  text: string
}

const COPY: Record<EmptyKind, Copy> = {
  'no-projects': {
    icon: null,
    title: 'Пока здесь нет приглашений',
    text: 'Соберите первое приглашение — обычно на это уходит полчаса.',
  },
  'no-results': {
    icon: <Search size={22} aria-hidden="true" />,
    title: 'Ничего не нашлось',
    text: 'По этому запросу приглашений нет. Попробуйте другое слово или сбросьте поиск.',
  },
  'all-archived': {
    icon: <Archive size={22} aria-hidden="true" />,
    title: 'Все приглашения в архиве',
    text: 'Активных приглашений нет. Верните нужное из архива или создайте новое.',
  },
  'load-error': {
    icon: <TriangleAlert size={22} aria-hidden="true" />,
    title: 'Не удалось загрузить приглашения',
    text: 'Данные на месте — не отвечает соединение с сервером. Попробуйте ещё раз через минуту.',
  },
  creating: {
    icon: <Loader2 size={22} aria-hidden="true" className="animate-spin" />,
    title: 'Создаём приглашение',
    text: 'Готовим сцены и оформление выбранного шаблона. Это займёт несколько секунд.',
  },
  offline: {
    icon: <CloudOff size={22} aria-hidden="true" />,
    title: 'Нет интернета',
    text: 'Проверьте соединение. Черновики сохранены и никуда не денутся.',
  },
}

/**
 * Пустые состояния кабинета.
 *
 * Раньше был один вариант — «нет проектов». Остальные случаи выглядели как
 * пустой экран без объяснения: непонятно, сломалось что-то или всё в порядке.
 */
export function EmptyState({ kind, onStartTour, onRetry, onResetSearch, onShowArchived }: EmptyStateProps) {
  const copy = COPY[kind]

  return (
    <div
      className="mrn-card"
      style={{
        padding: 'clamp(32px, 6vw, 56px) clamp(20px, 5vw, 40px)',
        textAlign: 'center',
        background: 'var(--color-sand)',
      }}
      role={kind === 'load-error' || kind === 'offline' ? 'alert' : undefined}
    >
      {kind === 'no-projects' ? (
        // Небольшая карточка-приглашение вместо иконки: сразу понятно, о чём сервис
        <span
          aria-hidden="true"
          style={{
            display: 'block', width: 132, height: 172, marginInline: 'auto', marginBottom: 26,
            borderRadius: 'var(--radius-lg)', transform: 'rotate(-3deg)',
            background: 'linear-gradient(168deg, var(--color-paper), var(--color-cream-soft))',
            border: '1px solid var(--mrn-line)',
            boxShadow: 'var(--mrn-shadow)',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16,
            }}
          >
            <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-ink-400)', fontFamily: 'var(--font-numeric)' }}>
              Сцена 1
            </span>
            {/* Вопрос и две кнопки — то, вокруг чего строится любое
                приглашение на свидание. В карточке это заменяет иконку. */}
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.25 }}>
              Пойдёшь со мной?
            </span>
            <span style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 10, padding: '5px 12px', borderRadius: 999, background: 'var(--color-punch)', color: '#fff' }}>Да</span>
              <span style={{ fontSize: 10, padding: '5px 12px', borderRadius: 999, border: '1px solid var(--mrn-line-strong)', color: 'var(--color-ink-400)' }}>Нет</span>
            </span>
          </span>
        </span>
      ) : (
        <span
          className="flex items-center justify-center"
          style={{
            width: 48, height: 48, borderRadius: 999, marginInline: 'auto', marginBottom: 18,
            background: 'var(--color-cream-soft)', color: 'var(--color-punch)',
          }}
        >
          {copy.icon}
        </span>
      )}

      <h2 className="mrn-h3">{copy.title}</h2>
      <p className="mrn-lead" style={{ marginTop: 10, marginInline: 'auto', maxWidth: '44ch', fontSize: 15 }}>
        {copy.text}
      </p>

      <div className="flex flex-wrap justify-center gap-2.5" style={{ marginTop: 24 }}>
        {kind === 'no-projects' && (
          <>
            <Link href="/dashboard/new" className="mrn-btn mrn-btn--primary">
              Создать приглашение <ArrowRight size={16} />
            </Link>
            <Link href="/templates" className="mrn-btn mrn-btn--secondary">
              Посмотреть шаблоны
            </Link>
            {onStartTour && (
              <button onClick={onStartTour} className="mrn-btn mrn-btn--ghost">
                Запустить обучение
              </button>
            )}
          </>
        )}

        {kind === 'no-results' && onResetSearch && (
          <button onClick={onResetSearch} className="mrn-btn mrn-btn--secondary">
            Сбросить поиск
          </button>
        )}

        {kind === 'all-archived' && (
          <>
            {onShowArchived && (
              <button onClick={onShowArchived} className="mrn-btn mrn-btn--secondary">
                Показать архив
              </button>
            )}
            <Link href="/dashboard/new" className="mrn-btn mrn-btn--primary">
              Создать приглашение
            </Link>
          </>
        )}

        {(kind === 'load-error' || kind === 'offline') && onRetry && (
          <button onClick={onRetry} className="mrn-btn mrn-btn--primary">
            <RotateCcw size={16} aria-hidden="true" /> Попробовать снова
          </button>
        )}
      </div>
    </div>
  )
}
