import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = pageMetadata({
  title: 'Тарифы Maruno Date',
  description:
    'Сейчас конструктор приглашений на свидание бесплатный. Платный тариф — 2000 ₸ за аккаунт и до 10 приглашений, разовая покупка без подписок.',
  path: '/pricing',
})

export default function Page() {
  return <PricingPageClient />
}
