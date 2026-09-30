import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import TemplatesPageClient from './TemplatesPageClient'

// Страница разделена на серверную обёртку с метаданными и клиентскую часть:
// клиентские компоненты не могут экспортировать metadata, поэтому раньше
// эта страница наследовала title и description главной.
export const metadata: Metadata = pageMetadata({
  title: 'Шаблоны приглашений на свидание',
  description:
    'Готовые шаблоны интерактивного приглашения: мягкое, вечернее и игривое. В карточке — живой первый экран, в демо приглашение проходится целиком.',
  path: '/templates',
})

export default function Page() {
  return <TemplatesPageClient />
}
