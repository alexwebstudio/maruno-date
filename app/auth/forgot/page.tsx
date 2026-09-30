import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import ForgotPasswordClient from './ForgotPasswordClient'

// Служебная страница — в поиске ей делать нечего
export const metadata: Metadata = pageMetadata({
  title: 'Восстановление пароля',
  description: 'Восстановление доступа к личному кабинету Maruno.',
  path: '/auth/forgot',
  noindex: true,
})

export default function Page() {
  return <ForgotPasswordClient />
}
