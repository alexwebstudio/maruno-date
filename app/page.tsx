import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import LandingPage from '@/components/LandingPage'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Приглашение на свидание — конструктор Maruno',
    description:
      'Соберите интерактивное приглашение на свидание за полчаса: вопрос, убегающая кнопка ' +
      '«Нет», выбор места и времени. Отправьте ссылку — ответ придёт вам готовой договорённостью.',
    path: '/',
  }),
  // На главной бренд уже внутри заголовка — шаблон «%s — Maruno Date» не нужен
  title: {
    absolute: 'Приглашение на свидание — конструктор Maruno',
  },
}

export default function Page() {
  return <LandingPage />
}
