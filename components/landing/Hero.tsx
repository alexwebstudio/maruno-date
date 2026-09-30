'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowRight } from 'lucide-react'
import { Character } from '@/components/date/Character'
import type { ProjectColors } from '@/types'

interface HeroProps {
  /** Куда ведёт основное действие: нового человека — на регистрацию, вошедшего — в кабинет. */
  startHref: string
}

/** Что человек получает. Три факта, а не три обещания. */
const TRUST = ['Готово за полчаса', 'Проходится с телефона', 'Ответ приходит вам']

/** Палитра карточки-превью в Hero — светлая «бумага приглашения» на тёмном экране. */
const CARD_COLORS: ProjectColors = {
  primary: '#F5306B',
  secondary: '#FF6F98',
  accent: '#FFE1EC',
  background: '#FFF4F7',
  text: '#241019',
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * ПЕРВЫЙ ЭКРАН
 *
 * Не «огромный текст по центру пустого фона». Экран разбит на две части:
 * слева — редакционный заголовок и суть, справа — живая карточка первого
 * вопроса приглашения с настоящим персонажем и убегающей кнопкой «Нет».
 * Так первый экран сразу и объясняет продукт, и показывает его характер,
 * а не описывает словами.
 */
export function Hero({ startHref }: HeroProps) {
  const root = useRef<HTMLElement>(null)
  // Кнопка «Нет» на карточке слегка уворачивается — намёк на механику,
  // без полноценного побега (в Hero это витрина, а не сам сценарий).
  const [dodge, setDodge] = useState(0)

  useIsomorphicLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-hero="eyebrow"]', { autoAlpha: 0, y: -10, duration: 0.5 })
        .from('[data-hero="line"]', { yPercent: 110, duration: 0.85, stagger: 0.09 }, '-=0.2')
        .from('[data-hero="lead"]', { autoAlpha: 0, y: 12, duration: 0.6 }, '-=0.45')
        .from('[data-hero="cta"]', { autoAlpha: 0, y: 12, duration: 0.55 }, '-=0.4')
        .from('[data-hero="trust"] li', { autoAlpha: 0, y: 8, duration: 0.45, stagger: 0.07 }, '-=0.35')
        .from('[data-hero="card"]', { autoAlpha: 0, y: 40, rotate: -8, duration: 0.9, ease: 'power4.out' }, '-=0.9')
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      data-nav-dark-zone
      className="mrn-hero mrn-tone-night mrn-dark"
      style={{ paddingTop: 'clamp(104px, 15vh, 176px)', paddingBottom: 'clamp(56px, 9vh, 120px)' }}
    >
      <span className="mrn-hero-grain" aria-hidden="true" />
      {/* Мягкое розовое свечение за карточкой — глубина, а не декоративный градиент во всю секцию */}
      <span className="mrn-hero__glow" aria-hidden="true" />

      <div className="mrn-container mrn-hero__grid">
        <div className="mrn-hero__copy">
          <p data-hero="eyebrow" className="mrn-eyebrow" style={{ color: 'var(--color-punch-soft)' }}>
            Maruno Date
          </p>

          <h1 className="mrn-display mrn-hero__title">
            <span className="mrn-sr">Приглашение на свидание, которое проходят, а не читают</span>
            <span aria-hidden="true">
              <span className="mrn-line-mask"><span data-hero="line" style={{ display: 'block' }}>Приглашение</span></span>
              <span className="mrn-line-mask">
                <span data-hero="line" style={{ display: 'block' }}>на <span className="mrn-h1-accent">свидание</span></span>
              </span>
            </span>
          </h1>

          <p data-hero="lead" className="mrn-lead mrn-hero__lead">
            Не сообщение «пойдём куда-нибудь?», которое остаётся без ответа. Маленькая
            история: вопрос, убегающее «Нет», выбор места и времени, финал. Человек
            проходит её сам — а вам приходит готовая договорённость.
          </p>

          <div data-hero="cta" className="mrn-actions" style={{ marginTop: 'clamp(26px, 3vw, 36px)' }}>
            <Link href={startHref} className="mrn-btn mrn-btn--primary mrn-btn--lg">
              Создать приглашение <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/templates" className="mrn-btn mrn-btn--secondary mrn-btn--lg">
              Посмотреть шаблоны
            </Link>
          </div>

          <ul data-hero="trust" className="mrn-hero__trust">
            {TRUST.map((t) => (
              <li key={t}>
                <span aria-hidden="true" className="mrn-hero__dot" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Карточка первого вопроса ── */}
        <div className="mrn-hero__stage" aria-hidden="true">
          <div data-hero="card" className="mrn-hero__card">
            <div className="mrn-hero__card-glow" />
            <Character character="bunny" mood="curious" colors={CARD_COLORS} size={116} />
            <p className="mrn-hero__q">
              Ты хочешь пойти со&nbsp;мной на&nbsp;<em>свидание</em>?
            </p>
            <div className="mrn-hero__answers">
              <button type="button" className="mrn-hero__yes">Да</button>
              <button
                type="button"
                className="mrn-hero__no"
                style={{ transform: `translate(${dodge ? 46 : 0}px, ${dodge ? -8 : 0}px)` }}
                onMouseEnter={() => setDodge((d) => (d + 1) % 2)}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
