'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, ExternalLink, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatMoment } from '@/lib/projectStatus'

interface PublishPanelProps {
  open: boolean
  slug: string
  publishedAt: string | null
  /** Публиковали впервые или обновляли уже живое приглашение. */
  firstTime: boolean
  onClose: () => void
}

/**
 * Итог публикации: ссылка, действия и время.
 *
 * Раньше единственным подтверждением был тост, который исчезал через три
 * секунды, — пользователь не успевал скопировать ссылку.
 */
export function PublishPanel({ open, slug, publishedAt, firstTime, onClose }: PublishPanelProps) {
  // Панель показывается только по действию пользователя, поэтому адрес можно
  // взять прямо при отрисовке — расхождения с серверным рендером не будет.
  const url = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Ссылка скопирована')
    } catch {
      toast.error('Не удалось скопировать — выделите ссылку вручную')
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Приглашение опубликовано"
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 95, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(20,20,22,.6)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mrn-card"
        style={{ width: '100%', maxWidth: 480, boxShadow: 'var(--mrn-shadow-lift)' }}
      >
        <div
          className="flex items-start justify-between gap-4"
          style={{ padding: 'clamp(20px, 4vw, 26px)', paddingBottom: 0 }}
        >
          <div style={{ textAlign: 'left' }}>
            <span
              aria-hidden="true"
              className="flex items-center justify-center"
              style={{
                width: 40, height: 40, borderRadius: 999,
                background: 'rgba(79, 95, 73, 0.14)', color: 'var(--color-mint)',
                marginBottom: 14,
              }}
            >
              <Check size={20} />
            </span>
            <h2 className="mrn-h3">
              {firstTime ? 'Приглашение опубликовано' : 'Изменения опубликованы'}
            </h2>
            <p className="mrn-meta" style={{ marginTop: 6 }}>
              {firstTime
                ? 'Приглашение открывается по этой ссылке — отправляйте её.'
                : 'По ссылке уже открывается обновлённая версия.'}
            </p>
          </div>
          <button onClick={onClose} className="mrn-icon-btn" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 'clamp(20px, 4vw, 26px)' }}>
          <p className="mrn-label" style={{ marginBottom: 7 }}>Ссылка на приглашение</p>
          <p
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-paper-2)',
              border: '1px solid var(--mrn-line)',
              fontSize: 14,
              wordBreak: 'break-all',
              userSelect: 'all',
            }}
          >
            {url}
          </p>

          <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mrn-btn mrn-btn--sm mrn-btn--primary"
            >
              <ExternalLink size={15} aria-hidden="true" /> Открыть приглашение
            </a>
            <button type="button" onClick={copy} className="mrn-btn mrn-btn--sm mrn-btn--secondary">
              <Copy size={15} aria-hidden="true" /> Скопировать ссылку
            </button>
          </div>

          {publishedAt && (
            <p className="mrn-meta" style={{ marginTop: 16 }}>
              Опубликовано: {formatMoment(publishedAt)}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
