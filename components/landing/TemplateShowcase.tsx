'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'
import { TemplateCard } from './TemplateCard'
import { TemplateDemoModal } from '@/components/templates/TemplateDemoModal'
import { SiteFonts } from '@/components/providers/SiteFonts'
import { ACTIVE_TEMPLATES, CATALOG_FONT_FAMILIES, type TemplateEntry } from '@/lib/templateCatalog'

interface TemplateShowcaseProps {
  /** Куда ведёт карточка: вошедшего — сразу в мастер с выбранным шаблоном. */
  templateHref: (id: string) => string
  /** На главной показываем часть каталога, на /templates — весь. */
  limit?: number
  showAllLink?: boolean
  background?: string
  eyebrow?: string
  title?: string
  description?: string
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Ритм сетки на широком экране.
 *
 * Двенадцать колонок, карточки разной ширины. Порядок не случайный:
 * широкая карточка открывает ряд и задаёт масштаб, следующие две
 * уравновешивают его, затем ритм зеркалится. Получается редакционный
 * разворот вместо девяти одинаковых плиток.
 *
 * Значения повторяются циклически, поэтому сетка не сломается,
 * если сценариев станет больше или меньше девяти.
 */
const SPAN_RHYTHM = [7, 5, 4, 4, 4, 5, 7, 6, 6]

/**
 * Вертикальное смещение ячейки, в пикселях.
 *
 * Соседи в ряду встают на разной высоте — ряд перестаёт читаться линейкой,
 * и появляется лёгкий заход карточек друг за друга по вертикали.
 * Смещения небольшие и знакопеременные: сетка остаётся сеткой, а карточки
 * не «сползают» вниз бесконечно. Работает только на широком экране —
 * на телефоне колонка одна, и смещать в ней нечего.
 */
// Значения намеренно небольшие: при 40–56px между рядами появлялись
// заметные пустоты — смещение читалось как дыра в сетке, а не как ритм.
const OFFSET_RHYTHM = [0, 26, 0, 16, 32, 0, 20, 0, 14]

/** Пропорция подбирается под ширину: широкой карточке — горизонтальный кадр. */
function ratioFor(span: number): string {
  if (span >= 7) return '4 / 3'
  if (span >= 6) return '1 / 1'
  if (span >= 5) return '4 / 5'
  return '3 / 4'
}

export function TemplateShowcase({
  templateHref,
  limit,
  showAllLink = false,
  background = 'var(--color-paper)',
  eyebrow = 'Шаблоны',
  title = 'Восемь характеров одного вопроса',
  description = 'Сценарий у шаблонов общий, а оформление, персонаж и характер анимаций — разные. В карточке настоящий первый экран, а в демо приглашение проходится целиком.',
}: TemplateShowcaseProps) {
  const [demo, setDemo] = useState<TemplateEntry | null>(null)
  const grid = useRef<HTMLDivElement>(null)

  const list = limit ? ACTIVE_TEMPLATES.slice(0, limit) : ACTIVE_TEMPLATES

  useIsomorphicLayoutEffect(() => {
    const el = grid.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Карточки появляются рядами по мере прокрутки. Один триггер на ряд,
      // а не на каждую карточку: иначе получается столько независимых
      // наблюдателей, сколько карточек, и рваный каскад.
      const cards = gsap.utils.toArray<HTMLElement>('.mrn-tpl-card')
      cards.forEach((card, i) => {
        gsap.from(card, {
          autoAlpha: 0,
          y: 34,
          duration: 0.6,
          ease: 'power3.out',
          // Соседи в одном ряду выезжают с небольшим сдвигом
          delay: (i % 3) * 0.07,
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [list.length])

  return (
    <section id="templates" className="mrn-section" style={{ background }}>
      {/* Живые превью используют типографику пользовательских сайтов */}
      <SiteFonts families={CATALOG_FONT_FAMILIES} />

      <div className="mrn-container">
        <Reveal className="flex flex-wrap items-end justify-between gap-6" style={{ marginBottom: 40 }}>
          <div>
            <p className="mrn-eyebrow">{eyebrow}</p>
            <h2 className="mrn-h2" style={{ marginTop: 14, maxWidth: '18ch' }}>{title}</h2>
          </div>
          <p className="mrn-lead" style={{ maxWidth: '44ch', fontSize: 15.5 }}>{description}</p>
        </Reveal>

        <div ref={grid} className="mrn-tpl-grid">
          {list.map((tpl, i) => {
            const span = SPAN_RHYTHM[i % SPAN_RHYTHM.length]
            const offset = OFFSET_RHYTHM[i % OFFSET_RHYTHM.length]
            return (
              <div
                key={tpl.id}
                className="mrn-tpl-cell"
                style={{
                  ['--span' as string]: span,
                  ['--offset' as string]: `${offset}px`,
                } as React.CSSProperties}
              >
                <TemplateCard
                  template={tpl}
                  href={templateHref(tpl.id)}
                  lead={span >= 7}
                  ratio={ratioFor(span)}
                  onDemo={setDemo}
                  eager={i < 2}
                />
              </div>
            )
          })}
        </div>

        {showAllLink && (
          <Reveal className="flex justify-center" style={{ marginTop: 34 }}>
            <Link href="/templates" className="mrn-btn mrn-btn--secondary">
              Все шаблоны <ArrowRight size={16} />
            </Link>
          </Reveal>
        )}
      </div>

      <TemplateDemoModal
        template={demo}
        onClose={() => setDemo(null)}
        href={demo ? templateHref(demo.id) : undefined}
      />
    </section>
  )
}
