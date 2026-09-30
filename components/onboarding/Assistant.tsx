'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import type { OnboardingProgress } from '@/lib/onboarding'

interface AssistantProps {
  progress: OnboardingProgress
  /** Пропустить обучение — вернуться можно из настроек. */
  onSkip: () => void
  /** Больше не показывать подсказки совсем. */
  onDisable: () => void
  /** Обучение пройдено полностью — поздравление показано и закрыто. */
  onFinish?: () => void
  /**
   * В редакторе человек уже внутри инструмента, поэтому подсказка говорит,
   * куда именно нажать, а не зачем шаг нужен.
   */
  variant?: 'dashboard' | 'editor'
}

/**
 * Помощник по созданию приглашения.
 *
 * Свёрнут в небольшую кнопку в углу и раскрывается только по нажатию —
 * сам ничего не перекрывает и не открывается без причины. Никакого чата
 * и никакой языковой модели: подсказка выбирается по первому незакрытому
 * шагу, который посчитан из данных приглашения.
 */
export function Assistant({
  progress,
  onSkip,
  onDisable,
  onFinish,
  variant = 'dashboard',
}: AssistantProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { next, doneCount, total, percent, project, complete, siteState } = progress
  const projectId = project?.id
  // Поздравление показываем один раз на приглашение и без лишнего шума:
  // человек только что закончил работу, ему нужен покой, а не конфетти.
  const congratulate = complete && !siteState.congratulated
  // Поздравление раскрывает панель само, без отдельного состояния:
  // оно исчезнет, как только шаг отметится пройденным.
  const panelOpen = open || congratulate

  // Закрытие панели. Если это было поздравление — считаем его показанным,
  // иначе оно возвращалось бы при каждом заходе.
  const closePanel = useCallback(() => {
    setOpen(false)
    if (congratulate) onFinish?.()
  }, [congratulate, onFinish])

  useEffect(() => {
    if (!panelOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closePanel(); buttonRef.current?.focus() }
    }
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      closePanel()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [panelOpen, closePanel])

  return (
    <div className={`mrn-assistant${variant === 'editor' ? ' mrn-assistant--editor' : ''}`}>
      {panelOpen && (
        <div
          ref={panelRef}
          className="mrn-card mrn-assistant-panel"
          role="dialog"
          aria-label="Помощник по созданию приглашения"
        >
          <div
            className="flex items-start justify-between gap-3"
            style={{ padding: '18px 18px 0' }}
          >
            <div style={{ textAlign: 'left' }}>
              <p className="mrn-eyebrow">Шаг {Math.min(doneCount + 1, total)} из {total}</p>
              <p className="mrn-h3" style={{ fontSize: 17, marginTop: 6 }}>
                {congratulate ? 'Готово' : complete ? 'Всё готово' : next?.title}
              </p>
            </div>
            <button
              onClick={() => { closePanel(); buttonRef.current?.focus() }}
              className="mrn-icon-btn"
              aria-label="Свернуть помощника"
              style={{ width: 34, height: 34, flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '12px 18px 18px' }}>
            <p className="mrn-lead" style={{ fontSize: 14.5, textAlign: 'left' }}>
              {congratulate
                ? 'Вы разобрались с основными возможностями редактора. Приглашение опубликовано и открывается по вашей ссылке.'
                : complete
                  ? 'Приглашение опубликовано и открывается по вашей ссылке. Правки после публикации попадают в неё только после нажатия «Опубликовать изменения».'
                  : variant === 'editor' ? next?.editorHint : next?.hint}
            </p>

            {/* Прогресс: полоса + шаги */}
            <div
              aria-hidden="true"
              style={{
                height: 4, borderRadius: 999, marginTop: 16,
                background: 'var(--color-paper-3)', overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block', height: '100%', width: `${percent}%`,
                  background: 'var(--color-punch)',
                  transition: 'width var(--mrn-t-slow) var(--mrn-ease)',
                }}
              />
            </div>
            <p className="mrn-meta" style={{ fontSize: 12, marginTop: 8, textAlign: 'left' }}>
              Выполнено {doneCount} из {total}
            </p>

            {/* В редакторе большинство шагов делаются прямо здесь — ссылка
                «перейти» вела бы на ту же страницу и сбивала с толку. */}
            {!complete && next && (variant === 'dashboard' || next.id === 'create' || next.id === 'preview') && (
              <Link
                href={next.href(projectId)}
                onClick={() => setOpen(false)}
                className="mrn-btn mrn-btn--sm mrn-btn--primary mrn-btn--block"
                style={{ marginTop: 16 }}
              >
                {next.action} <ArrowRight size={15} />
              </Link>
            )}

            {congratulate ? (
              <button
                onClick={() => { setOpen(false); onFinish?.() }}
                className="mrn-btn mrn-btn--sm mrn-btn--primary mrn-btn--block"
                style={{ marginTop: 16 }}
              >
                Спасибо, закрыть
              </button>
            ) : (
              <>
                <div
                  className="flex flex-wrap items-center justify-between gap-2"
                  style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--mrn-line)' }}
                >
                  <button onClick={onSkip} className="mrn-btn mrn-btn--sm mrn-btn--ghost" style={{ paddingInline: 0 }}>
                    Пропустить обучение
                  </button>
                  <button onClick={onDisable} className="mrn-btn mrn-btn--sm mrn-btn--ghost" style={{ paddingInline: 0 }}>
                    Больше не показывать
                  </button>
                </div>
                <p className="mrn-meta" style={{ fontSize: 11.5, marginTop: 8, textAlign: 'left' }}>
                  Вернуть подсказки можно в настройках кабинета.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        onClick={() => (panelOpen ? closePanel() : setOpen(true))}
        className="mrn-assistant-toggle"
        aria-expanded={panelOpen}
        aria-label={
          complete
            ? 'Помощник: обучение завершено'
            : `Помощник: шаг ${Math.min(doneCount + 1, total)} из ${total} — ${next?.title ?? ''}`
        }
      >
        <span className="mrn-assistant-mark" aria-hidden="true">
          {complete ? <Check size={16} /> : `${doneCount}/${total}`}
        </span>
        <span className="mrn-assistant-label">
          {complete ? 'Готово' : 'Что дальше'}
        </span>
      </button>
    </div>
  )
}
