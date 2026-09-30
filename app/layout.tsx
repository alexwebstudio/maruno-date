import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SmoothScroll from '@/components/providers/SmoothScroll'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

/**
 * Интерфейсные шрифты — ровно три, self-hosted из public/fonts.
 *
 * Google Fonts здесь намеренно не используется: сборка не должна зависеть
 * от внешней сети, а в CIS их CDN отдаёт шрифты нестабильно. Начертания
 * объявлены через @font-face в app/globals.css, файлы лежат в public/fonts —
 * переменные (variable) woff2, по одному файлу на языковое подмножество.
 *
 * Библиотека шрифтов для сайтов пользователей подключается отдельно
 * (components/providers/SiteFonts.tsx) и только там, где она нужна.
 */

const DESCRIPTION =
  'Конструктор интерактивных приглашений на свидание: вопрос, убегающая кнопка «Нет», ' +
  'выбор места и времени. Выберите шаблон, поправьте тексты и отправьте ссылку.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Приглашение на свидание — конструктор Maruno',
    // Страницы задают свой заголовок, а бренд подставляется сюда
    template: '%s — Maruno Date',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'Приглашение на свидание — конструктор Maruno',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Приглашение на свидание — конструктор Maruno',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#170D14',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/*
          Дисплейный и интерфейсный шрифты нужны первому экрану — просим
          браузер начать их загрузку до разбора CSS. Моноширинный не
          предзагружаем: он используется мелкими подписями и не влияет
          на то, как отрисуется заголовок.
        */}
        <link rel="preload" href="/fonts/unbounded-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/golos-text-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/*
          Playfair Display — акцентная антиква интерфейса Maruno Date.
          Ею набрано только выделенное слово в заголовках (.mrn-h1-accent):
          горячий розовый + курсивная антиква посреди гротеска — это
          редакционный приём, который сразу отличает Date от Birthday.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap"
        />
      </head>
      <body className="antialiased">
        {/* Разметка для поисковых систем: что за сервис и кому принадлежит */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: SITE_NAME,
              url: SITE_URL,
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
              inLanguage: 'ru-RU',
              description: DESCRIPTION,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'KZT',
                description: 'Базовый тариф — создание и публикация приглашения без оплаты',
              },
              publisher: {
                '@type': 'Organization',
                name: 'AlexWebStudio',
                url: 'https://alexwebstudio.ru',
              },
            }),
          }}
        />
        <SmoothScroll>{children}</SmoothScroll>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#170D14',
              color: '#FCF6F5',
              border: '1px solid rgba(250,247,242,0.14)',
              borderRadius: '10px',
              fontFamily: 'var(--font-golos), system-ui, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#F5306B', secondary: '#170D14' } },
            error: {
              style: { background: '#3A0F22', border: '1px solid rgba(250,247,242,0.22)' },
            },
          }}
        />
      </body>
    </html>
  )
}
