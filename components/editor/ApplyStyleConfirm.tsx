'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, X } from 'lucide-react'
import type { StylePreset } from '@/lib/editorPresets'

interface ApplyStyleConfirmProps {
  preset: StylePreset | null
  onConfirm: () => void
  onClose: () => void
}

/**
 * Подтверждение смены оформления на уже заполненном сайте.
 *
 * Готовый стиль переписывает палитру и обе гарнитуры разом — на собранном
 * сайте это заметное изменение. Раньше оно применялось по одному нажатию
 * без предупреждения.
 *
 * Тексты и фотографии не затрагиваются, а вернуть прежнее оформление можно
 * отменой действия — редактор хранит историю правок.
 */
export function ApplyStyleConfirm({ preset, onConfirm, onClose }: ApplyStyleConfirmProps) {
  useEffect(() => {
    if (!preset) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preset, onClose])

  if (!preset || typeof document === 'undefined') return null

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Применить стиль «${preset.name}»`}
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
        style={{ width: '100%', maxWidth: 440, boxShadow: 'var(--mrn-shadow-lift)' }}
      >
        <div
          className="flex items-start justify-between gap-4"
          style={{ padding: 'clamp(20px, 4vw, 24px)', paddingBottom: 0 }}
        >
          <div style={{ textAlign: 'left' }}>
            <p className="mrn-eyebrow">Смена оформления</p>
            <h2 className="mrn-h3" style={{ marginTop: 8 }}>Применить стиль «{preset.name}»?</h2>
          </div>
          <button onClick={onClose} className="mrn-icon-btn" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 'clamp(20px, 4vw, 24px)' }}>
          <p className="mrn-lead" style={{ fontSize: 15 }}>
            Палитра и шрифты сайта заменятся целиком. Тексты, фотографии
            и порядок блоков останутся на месте.
          </p>

          {/* Что именно поменяется — видно до нажатия */}
          <div
            className="flex items-center gap-3"
            style={{
              marginTop: 16, padding: 14,
              borderRadius: 'var(--radius-sm)',
              background: preset.colors.background,
              border: '1px solid var(--mrn-line)',
            }}
          >
            <span className="flex gap-1.5" aria-hidden="true">
              {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.text].map((c, i) => (
                <span key={i} className="mrn-swatch" style={{ background: c }} />
              ))}
            </span>
            <span style={{ fontSize: 13.5, color: preset.colors.text }}>
              {preset.fonts.heading} · {preset.fonts.body}
            </span>
          </div>

          <p
            className="flex items-start gap-2"
            style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-600)' }}
          >
            <RotateCcw size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-punch)' }} />
            Если не понравится — отмените действие сочетанием Ctrl+Z или кнопкой отмены в панели редактора.
          </p>

          <div className="flex flex-wrap gap-2" style={{ marginTop: 20 }}>
            <button onClick={onConfirm} className="mrn-btn mrn-btn--primary">
              Применить стиль
            </button>
            <button onClick={onClose} className="mrn-btn mrn-btn--secondary">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
