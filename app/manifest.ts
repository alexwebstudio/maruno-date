import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/seo'

/**
 * Web-манифест. Нужен, чтобы приглашение можно было добавить на домашний
 * экран телефона и чтобы браузер знал цвета интерфейса.
 *
 * display: 'standalone' не ставим намеренно — сервис живёт в браузере,
 * и полноэкранный режим только запутал бы возвратом назад.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Maruno',
    description:
      'Конструктор приглашений на свидание: выберите шаблон, поправьте вопросы, отправьте ссылку.',
    lang: 'ru',
    start_url: '/',
    display: 'browser',
    background_color: '#FCF6F5',
    theme_color: '#1A1016',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  }
}
