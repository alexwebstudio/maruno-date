'use client'

import Link from 'next/link'

const STUDIO_URL = 'https://alexwebstudio.ru'

const NAV_COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: 'Продукт',
    links: [
      { href: '/templates', label: 'Шаблоны' },
      { href: '/pricing', label: 'Тарифы' },
      { href: '/#reviews', label: 'Отзывы' },
    ],
  },
  {
    title: 'Помощь',
    links: [
      { href: '/blog', label: 'Полезные советы' },
      { href: 'https://t.me/sanyamaster200', label: 'Написать в Telegram', external: true },
      {
        href: 'https://api.whatsapp.com/send/?phone=77780824759&text&type=phone_number&app_absent=0',
        label: 'Написать в WhatsApp',
        external: true,
      },
    ],
  },
  {
    title: 'Документы',
    links: [
      { href: '/privacy', label: 'Конфиденциальность' },
      { href: '/terms', label: 'Условия использования' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mrn-dark" style={{ background: 'var(--color-ink)', paddingBlock: '64px 32px' }}>
      <div className="mrn-container">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
          <div>
            <Link href="/" className="mrn-logo" style={{ color: 'var(--color-paper)' }}>
              <span className="mrn-logo-name">Maruno</span>
              <span className="mrn-logo-sub">date</span>
            </Link>
            <p className="mrn-lead" style={{ marginTop: 14, fontSize: 15, maxWidth: '32ch' }}>
              Интерактивные приглашения на свидание. Выбираете шаблон,
              правите вопросы — отправляете ссылку.
            </p>
          </div>

          {NAV_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              {/* Это подпись колонки навигации, а не заголовок раздела:
                  тремя лишними h2 на каждой странице ломалась иерархия. */}
              <p className="mrn-eyebrow">{col.title}</p>
              <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 10 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mrn-link"
                        style={{ color: 'rgba(250,247,242,0.72)', fontSize: 14.5 }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="mrn-link"
                        style={{ color: 'rgba(250,247,242,0.72)', fontSize: 14.5 }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="mrn-rule" style={{ marginBlock: 'clamp(32px, 5vw, 48px) 20px' }} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="mrn-meta">© {new Date().getFullYear()} Maruno</p>
          <p className="mrn-meta">
            Разработано веб-студией{' '}
            <a
              href={STUDIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mrn-link"
              style={{ color: 'rgba(255,255,255,.72)' }}
            >
              AlexWebStudio
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
