'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ArrowRight, Monitor, Smartphone, X } from 'lucide-react'
import { TemplatePreview } from './TemplatePreview'
import type { TemplateEntry } from '@/lib/templateCatalog'

interface TemplateDemoModalProps {
  template: TemplateEntry | null
  onClose: () => void
  /** Ссылка «Выбрать этот дизайн». */
  href?: string
  /** Либо действие вместо ссылки — используется в мастере создания. */
  onChoose?: (template: TemplateEntry) => void
}

/**
 * Демо шаблона: тот же первый экран в двух вьюпортах.
 *
 * Показывает ровно то, что получится после создания сайта, — превью и создание
 * берут содержимое из одного источника (lib/templateCatalog).
 */
export function TemplateDemoModal({ template, onClose, href, onChoose }: TemplateDemoModalProps) {
  // На телефоне десктопный кадр пришлось бы ужимать до нечитаемого размера,
  // поэтому там демо открывается сразу в мобильном виде.
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
  )

  useEffect(() => {
    if (!template) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [template, onClose])

  if (!template || typeof document === 'undefined') return null

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Демо шаблона «${template.name}»`}
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 95, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: 'clamp(12px, 4vh, 40px) clamp(12px, 3vw, 24px)',
        background: 'rgba(20,20,22,.62)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mrn-card"
        style={{ width: '100%', maxWidth: 1080, margin: 'auto', boxShadow: 'var(--mrn-shadow-lift)' }}
      >
        <div
          className="flex flex-wrap items-start justify-between gap-4"
          style={{ padding: 'clamp(18px, 3vw, 24px)', borderBottom: '1px solid var(--mrn-line)' }}
        >
          <div style={{ textAlign: 'left' }}>
            <h2 className="mrn-h3">{template.name}</h2>
            <p className="mrn-meta" style={{ marginTop: 4 }}>{template.tagline}</p>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Размер экрана"
              className="flex items-center"
              style={{ border: '1px solid var(--mrn-line-strong)', borderRadius: 'var(--radius-sm)', padding: 2 }}
            >
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                aria-pressed={viewport === 'desktop'}
                className="mrn-btn mrn-btn--sm"
                style={{
                  background: viewport === 'desktop' ? 'var(--color-paper-2)' : 'transparent',
                  color: 'var(--color-ink)',
                  height: 34,
                }}
              >
                <Monitor size={15} aria-hidden="true" /> Компьютер
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                aria-pressed={viewport === 'mobile'}
                className="mrn-btn mrn-btn--sm"
                style={{
                  background: viewport === 'mobile' ? 'var(--color-paper-2)' : 'transparent',
                  color: 'var(--color-ink)',
                  height: 34,
                }}
              >
                <Smartphone size={15} aria-hidden="true" /> Телефон
              </button>
            </div>

            <button onClick={onClose} className="mrn-icon-btn" aria-label="Закрыть демо">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: 'clamp(16px, 3vw, 24px)', background: 'var(--color-paper-2)' }}>
          {/*
            Демо показывает приглашение целиком, а не один первый экран:
            человек выбирает дизайн-концепцию — структуру, типографику,
            галерею, анкету и переходы между секциями. Внутри рамки
            работает прокрутка, поэтому пролистать можно всё.
          */}
          {viewport === 'desktop' ? (
            <TemplatePreview template={template} viewport="desktop" depth="full" eager />
          ) : (
            <div style={{ maxWidth: 400, marginInline: 'auto' }}>
              <TemplatePreview template={template} ratio="400 / 800" depth="full" eager />
            </div>
          )}

          <p className="mrn-meta" style={{ textAlign: 'center', marginTop: 12 }}>
            Внутри рамки можно прокручивать — это всё приглашение целиком
          </p>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-4"
          style={{ padding: 'clamp(18px, 3vw, 24px)' }}
        >
          <div style={{ textAlign: 'left', maxWidth: '54ch' }}>
            <p className="mrn-lead" style={{ fontSize: 15 }}>{template.description}</p>
            <p className="mrn-meta" style={{ marginTop: 8 }}>
              Входит: {template.includes.join(' · ')}
            </p>
          </div>

          {onChoose ? (
            <button
              type="button"
              onClick={() => { onChoose(template); onClose() }}
              className="mrn-btn mrn-btn--primary"
            >
              Выбрать этот дизайн <ArrowRight size={16} />
            </button>
          ) : href ? (
            <Link href={href} className="mrn-btn mrn-btn--primary">
              Выбрать этот дизайн <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
