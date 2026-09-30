import type { Metadata } from 'next'

/**
 * Базовый адрес сайта для canonical, Open Graph и sitemap.
 *
 * Задаётся переменной NEXT_PUBLIC_APP_URL (см. .env.example). Пока она не
 * выставлена на проде, используется запасное значение — тогда canonical
 * и sitemap будут указывать не туда, поэтому переменную нужно задать
 * в настройках деплоя.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://date.maruno.kz').replace(/\/$/, '')

export const SITE_NAME = 'Maruno Date'

interface PageMetaInput {
  title: string
  description: string
  /** Путь без домена, например '/templates'. */
  path: string
  /** Служебные страницы не нужны в индексе. */
  noindex?: boolean
}

/**
 * Метаданные страницы: заголовок, описание, canonical и Open Graph.
 * До этого патча пять публичных страниц были клиентскими и наследовали
 * title главной — в выдаче они выглядели одинаково.
 */
export function pageMetadata({ title, description, path, noindex }: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: SITE_NAME,
      url,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
