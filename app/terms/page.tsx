import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import TermsPageClient from './TermsPageClient'

// Серверная обёртка с метаданными: клиентские компоненты не могут
// экспортировать metadata, из-за чего страница наследовала title главной.
export const metadata: Metadata = pageMetadata({
  title: 'Условия использования',
  description: 'Условия использования конструктора приглашений Maruno Date.',
  path: '/terms', noindex: true,
})

export default function Page() {
  return <TermsPageClient />
}
