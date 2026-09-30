import { buildSiteFontsHref, SITE_FONTS_HREF } from '@/lib/siteFonts'

interface SiteFontsProps {
  /** Ограничить набор конкретными семействами. По умолчанию — вся библиотека редактора. */
  families?: string[]
}

/**
 * Подключает шрифты пользовательских сайтов.
 * React 19 сам поднимает <link> в <head> и дедуплицирует его по href,
 * поэтому компонент можно ставить рядом с тем, что его действительно требует.
 */
export function SiteFonts({ families }: SiteFontsProps) {
  const href = families ? buildSiteFontsHref(families) : SITE_FONTS_HREF
  if (!href) return null

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={href} />
    </>
  )
}
