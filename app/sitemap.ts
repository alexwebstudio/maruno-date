import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Только публичные маршруты. Приглашения пользователей (/<slug>) сюда
 * намеренно не попадают: это личные страницы, и владелец может закрыть их
 * кодом или скрыть от поиска в настройках сайта.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/templates`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]
}
