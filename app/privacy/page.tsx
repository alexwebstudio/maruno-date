import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import PrivacyPageClient from './PrivacyPageClient'

// Серверная обёртка с метаданными: клиентские компоненты не могут
// экспортировать metadata, из-за чего страница наследовала title главной.
export const metadata: Metadata = pageMetadata({
  title: 'Политика конфиденциальности',
  description: 'Как Maruno собирает, использует и защищает персональные данные пользователей сервиса.',
  path: '/privacy', noindex: true,
})

export default function Page() {
  return <PrivacyPageClient />
}
