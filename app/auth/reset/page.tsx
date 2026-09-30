import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = pageMetadata({
  title: 'Новый пароль',
  description: 'Создание нового пароля для личного кабинета Maruno.',
  path: '/auth/reset',
  noindex: true,
})

export default function Page() {
  return <ResetPasswordClient />
}
