import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Кабинет, редактор и экраны входа закрыты от индексации:
 * это приватные разделы, а не посадочные страницы.
 * Сайты гостей (/<slug>) индексируются — они публичные по замыслу.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/dashboard/', '/auth/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
