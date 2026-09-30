import type { NextConfig } from 'next'

/**
 * Домен сервиса. Задаётся NEXT_PUBLIC_APP_URL, для свадебного направления —
 * https://wedding.maruno.site. Подробности в SEO_SETUP.md.
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://wedding.maruno.site'
const APP_HOST = (() => {
  try { return new URL(APP_URL).host } catch { return 'wedding.maruno.site' }
})()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  /**
   * Один канонический хост.
   *
   * Без склейки одна и та же страница доступна и на www, и без www — для поиска
   * это два разных адреса с одинаковым содержимым. HTTPS обеспечивает хостинг
   * (на Vercel — автоматически), поэтому здесь только www.
   */
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: `www.${APP_HOST}` }],
        destination: `${APP_URL}/:path*`,
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        // Служебные разделы не должны попадать в индекс даже случайно:
        // заголовок работает и там, где robots.txt проигнорирован
        source: '/:path(dashboard|auth)/:rest*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
