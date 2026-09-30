'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface AuthShellProps {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  children: ReactNode
  /** Ссылка внизу формы: «Нет аккаунта?», «Вспомнили пароль?» и подобные. */
  footer?: ReactNode
}

/**
 * Общая рамка всех экранов доступа: вход, регистрация, восстановление,
 * создание нового пароля.
 *
 * Сетка одна на все страницы — раньше каждый экран верстался по-своему,
 * и переход между ними выглядел как переход между разными сайтами.
 * Слева смысловая колонка в тоне первого экрана сайта, справа форма
 * фиксированной ширины.
 */
export function AuthShell({ eyebrow, title, lead, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* Смысловая колонка. На телефоне сжимается в компактную шапку. */}
      <section className="mrn-tone-night mrn-dark relative overflow-hidden lg:w-1/2 flex flex-col">
        <span className="mrn-hero-grain" aria-hidden="true" />

        <div className="mrn-container relative" style={{ paddingTop: 'clamp(24px, 5vh, 44px)' }}>
          <Link href="/" className="mrn-logo" aria-label="Maruno Date — на главную">
            <span className="mrn-logo-name">Maruno</span>
            <span className="mrn-logo-sub">date</span>
          </Link>
        </div>

        <div
          className="mrn-container relative flex-1 flex flex-col justify-center"
          style={{ paddingBlock: 'clamp(28px, 6vh, 72px)' }}
        >
          <p className="mrn-eyebrow" style={{ color: 'rgba(255,255,255,.72)' }}>{eyebrow}</p>
          <h1
            className="mrn-h1 hidden lg:block"
            style={{ marginTop: 16, maxWidth: '15ch', fontSize: 'clamp(1.9rem, 2.9vw, 2.7rem)' }}
          >
            {title}
          </h1>
          {lead && (
            <p className="mrn-lead hidden lg:block" style={{ marginTop: 18, maxWidth: '36ch' }}>
              {lead}
            </p>
          )}
        </div>
      </section>

      {/* Форма. На телефоне прижата к верху: центрирование оставляло пустое поле. */}
      <section
        className="lg:w-1/2 flex items-start lg:items-center"
        style={{ background: 'var(--color-paper)', paddingBlock: 'clamp(28px, 5vh, 72px)' }}
      >
        <div className="mrn-container" style={{ maxWidth: 480 }}>
          <h2
            className="mrn-h2 lg:hidden"
            style={{ fontSize: 'clamp(1.7rem, 6vw, 2.1rem)', marginBottom: 22 }}
          >
            {title}
          </h2>

          {children}

          {footer && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--mrn-line)' }}>
              {footer}
            </div>
          )}

          <p className="mrn-meta" style={{ marginTop: 20, fontSize: 12 }}>
            Продолжая, вы принимаете{' '}
            <Link href="/terms" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
              условия использования
            </Link>{' '}
            и{' '}
            <Link href="/privacy" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
              политику конфиденциальности
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
