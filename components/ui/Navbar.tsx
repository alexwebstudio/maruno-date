'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import { LanguageSwitcher } from './LanguageSwitcher'

interface NavbarProps {
  /** Навигация лежит поверх тёмного первого экрана. */
  dark?: boolean
}

/** Пункты публичной части. Существующие маршруты не менялись. */
const NAV_ITEMS = [
  { href: '/templates', label: 'Шаблоны' },
  { href: '/pricing', label: 'Тарифы' },
  { href: '/blog', label: 'Советы' },
]

/**
 * Секция, над которой навигация должна быть светлой, помечается
 * атрибутом data-nav-dark-zone (сейчас это первый экран главной).
 * Пока панель находится над ней — тёмная тема и прозрачный фон;
 * как только уходит выше — обычная светлая панель с подложкой.
 */
const DARK_ZONE = '[data-nav-dark-zone]'

export function Navbar({ dark = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [overDarkZone, setOverDarkZone] = useState(false)
  const { user, signOut } = useAuth()
  const { t } = useAppStore()
  const pathname = usePathname()
  const router = useRouter()

  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      setScrolled(window.scrollY > 12)

      const zone = document.querySelector(DARK_ZONE)
      const navHeight = window.innerWidth < 768 ? 60 : 68
      setOverDarkZone(!!zone && zone.getBoundingClientRect().bottom > navHeight)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    toggleRef.current?.focus()
  }, [])

  // Блокировка прокрутки, Escape и удержание фокуса внутри меню.
  // В версии 1.1.5 ничего из этого не было: меню можно было «протабать» насквозь.
  useEffect(() => {
    if (!menuOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

    focusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return }
      if (e.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, closeMenu])

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    router.push('/')
  }

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : !!pathname?.startsWith(href))

  // Тёмная тема — либо задана страницей, либо панель сейчас над тёмной секцией
  const isDark = dark || overDarkZone
  const tone = isDark ? 'mrn-dark' : ''
  // Подложку показываем только когда панель ушла с тёмной секции
  const solid = scrolled && !overDarkZone

  const logo = (
    <Link href="/" className="mrn-logo" onClick={() => setMenuOpen(false)} aria-label="Maruno Date — на главную">
      <span className="mrn-logo-name">Maruno</span>
      <span className="mrn-logo-sub">date</span>
    </Link>
  )

  return (
    <>
      <header className={`mrn-nav ${tone}`} data-scrolled={solid}>
        <nav className="mrn-container h-full flex items-center justify-between gap-4" aria-label="Основная навигация">
          {logo}

          {/* Десктоп */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mrn-navlink"
                aria-current={isCurrent(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher dark={isDark} />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="mrn-navlink"
                  aria-current={pathname === '/dashboard' ? 'page' : undefined}
                >
                  {t('nav_dashboard')}
                </Link>
                <Link href="/dashboard/new" className="mrn-btn mrn-btn--sm mrn-btn--primary">
                  Создать приглашение
                </Link>
                <button onClick={handleSignOut} className="mrn-btn mrn-btn--sm mrn-btn--ghost">
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="mrn-navlink">Войти</Link>
                <Link href="/auth/register" className="mrn-btn mrn-btn--sm mrn-btn--primary">
                  Создать приглашение
                </Link>
              </>
            )}
          </div>

          {/* Мобильный */}
          <div className="flex md:hidden items-center gap-1">
            <LanguageSwitcher dark={isDark} />
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              className="mrn-icon-btn"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Мобильное меню — панель на весь экран, а не всплывающая шторка снизу */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`mrn-menu ${tone} md:hidden`}
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          data-lenis-prevent
        >
          <div className="mrn-container flex items-center justify-between" style={{ height: 60, flexShrink: 0 }}>
            {logo}
            <button type="button" onClick={closeMenu} className="mrn-icon-btn" aria-label="Закрыть меню">
              <X size={22} />
            </button>
          </div>

          <div className="mrn-container flex-1 overflow-y-auto" style={{ paddingBottom: 24 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mrn-menu-item"
                onClick={() => setMenuOpen(false)}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}

            {user && (
              <Link
                href="/dashboard"
                className="mrn-menu-item"
                onClick={() => setMenuOpen(false)}
                aria-current={pathname === '/dashboard' ? 'page' : undefined}
              >
                {t('nav_dashboard')}
              </Link>
            )}
          </div>

          <div
            className="mrn-container flex flex-col gap-3"
            style={{ paddingTop: 20, paddingBottom: 28, flexShrink: 0 }}
          >
            {user ? (
              <>
                <Link href="/dashboard/new" onClick={() => setMenuOpen(false)} className="mrn-btn mrn-btn--primary mrn-btn--block">
                  Создать приглашение
                </Link>
                <button onClick={handleSignOut} className="mrn-btn mrn-btn--ghost mrn-btn--block">
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="mrn-btn mrn-btn--primary mrn-btn--block">
                  Создать приглашение
                </Link>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="mrn-btn mrn-btn--secondary mrn-btn--block">
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
