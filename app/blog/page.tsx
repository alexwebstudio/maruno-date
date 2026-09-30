import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import BlogPageClient from './BlogPageClient'

// Серверная обёртка с метаданными: клиентские компоненты не могут
// экспортировать metadata, из-за чего страница наследовала title главной.
export const metadata: Metadata = pageMetadata({
  title: 'Как сделать приглашение на свидание: гайды и советы',
  description: 'Пошаговые гайды по созданию интерактивного приглашения на свидание и обновлениям сервиса Maruno Date.',
  path: '/blog',
})

export default function Page() {
  return <BlogPageClient />
}
