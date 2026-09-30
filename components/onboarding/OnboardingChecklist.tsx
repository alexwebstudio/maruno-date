'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import type { OnboardingProgress } from '@/lib/onboarding'

interface OnboardingChecklistProps {
  progress: OnboardingProgress
  onSkip: () => void
}

/**
 * Чек-лист первого приглашения в кабинете.
 *
 * Показывает, где человек находится и что делать дальше. Шаги закрываются
 * сами, когда данные появляются в проекте, — отдельной кнопки «готово» нет,
 * поэтому список не может разойтись с реальностью.
 */
export function OnboardingChecklist({ progress, onSkip }: OnboardingChecklistProps) {
  const { steps, doneCount, total, percent, project } = progress
  const projectId = project?.id

  return (
    <section
      className="mrn-card"
      style={{ padding: 'clamp(20px, 3vw, 26px)', marginBottom: 24, background: 'var(--color-sand)' }}
      aria-labelledby="onboarding-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mrn-eyebrow">С чего начать</p>
          <h2 id="onboarding-title" className="mrn-h3" style={{ marginTop: 8 }}>
            Ваше первое приглашение
          </h2>
        </div>
        <span className="mrn-tag">{percent}%</span>
      </div>

      <div
        aria-hidden="true"
        style={{ height: 4, borderRadius: 999, marginTop: 16, background: 'var(--color-paper-3)', overflow: 'hidden' }}
      >
        <span
          style={{
            display: 'block', height: '100%', width: `${percent}%`,
            background: 'var(--color-punch)',
            transition: 'width var(--mrn-t-slow) var(--mrn-ease)',
          }}
        />
      </div>
      <p className="mrn-meta" style={{ fontSize: 12.5, marginTop: 8 }}>
        Выполнено {doneCount} из {total}
      </p>

      <ol style={{ listStyle: 'none', margin: '18px 0 0', padding: 0 }}>
        {steps.map((step, i) => {
          // Активный — первый незакрытый: только у него показываем подсказку и действие
          const isNext = !step.done && steps.findIndex((s) => !s.done) === i
          return (
            <li
              key={step.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 12,
                alignItems: 'start',
                paddingBlock: 12,
                borderTop: i === 0 ? 'none' : '1px solid var(--mrn-line)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 22, height: 22, borderRadius: 999, marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11.5, fontWeight: 600,
                  background: step.done ? 'var(--color-punch)' : 'var(--color-paper-3)',
                  color: step.done ? 'var(--color-paper)' : 'var(--color-ink-400)',
                }}
              >
                {step.done ? <Check size={13} /> : i + 1}
              </span>

              <div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: isNext ? 600 : 500,
                    color: step.done ? 'var(--color-ink-400)' : 'var(--color-ink)',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}
                >
                  {step.title}
                  <span className="mrn-sr">{step.done ? ' — выполнено' : ''}</span>
                </p>

                {isNext && (
                  <>
                    <p className="mrn-lead" style={{ fontSize: 14, marginTop: 6 }}>{step.hint}</p>
                    <Link
                      href={step.href(projectId)}
                      className="mrn-btn mrn-btn--sm mrn-btn--primary"
                      style={{ marginTop: 12 }}
                    >
                      {step.action} <ArrowRight size={15} />
                    </Link>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <button
        onClick={onSkip}
        className="mrn-btn mrn-btn--sm mrn-btn--ghost"
        style={{ marginTop: 12, paddingInline: 0 }}
      >
        Пропустить обучение
      </button>
    </section>
  )
}
