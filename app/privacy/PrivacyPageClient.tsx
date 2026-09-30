'use client'
import { SiteFooter } from '@/components/landing/SiteFooter'

import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'

// ВНИМАНИЕ: это рабочий каркас. Финальный юридический текст
// Александр предоставит позже — заменить содержимое SECTIONS.
const SECTIONS = [
  {
    h: '1. Общие положения',
    p: 'Настоящая Политика конфиденциальности описывает, как сервис Maruno собирает, использует и защищает персональные данные пользователей. Используя сервис, вы соглашаетесь с условиями данной Политики.',
  },
  {
    h: '2. Какие данные мы собираем',
    p: 'Мы обрабатываем: email (при регистрации), содержимое созданных вами сайтов (имена, даты, фотографии, тексты), а также технические данные (тип устройства, действия в конструкторе) для улучшения сервиса.',
  },
  {
    h: '3. Как используются данные',
    p: 'Данные используются исключительно для работы сервиса: хранения ваших проектов, публикации сайтов по личной ссылке, отправки ответов гостей (RSVP) и уведомлений об обновлениях, если вы на них подписались.',
  },
  {
    h: '4. Хранение и защита',
    p: 'Данные хранятся на защищённых серверах Supabase. Доступ к вашим проектам есть только у вас через ваш аккаунт. Мы применяем разумные технические меры для защиты информации.',
  },
  {
    h: '5. Передача третьим лицам',
    p: 'Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством.',
  },
  {
    h: '6. Ваши права',
    p: 'Вы можете в любой момент отредактировать или удалить свои проекты и аккаунт. Для полного удаления данных свяжитесь с поддержкой.',
  },
  {
    h: '7. Контакты',
    p: 'По вопросам конфиденциальности пишите в Telegram: @sanyamaster200.',
  },
]

export default function PrivacyPageClient() {
  return (
    <>
      <a href="#content" className="mrn-skip">К содержимому</a>
      <Navbar />

      <main id="content" style={{ background: 'var(--color-paper)' }}>
        <section style={{ paddingTop: 'clamp(104px, 13vh, 148px)', paddingBottom: 'clamp(56px, 8vw, 88px)' }}>
          <div className="mrn-container mrn-container--narrow">
            <p className="mrn-eyebrow">Документы</p>
            <h1 className="mrn-h1" style={{ marginTop: 16 }}>Политика конфиденциальности</h1>
            <p className="mrn-meta" style={{ marginTop: 14 }}>
              Последнее обновление: черновик · финальная редакция готовится
            </p>

            <div style={{ display: 'grid', gap: 28, marginTop: 44 }}>
              {SECTIONS.map((s) => (
                <section key={s.h}>
                  <h2 className="mrn-h3">{s.h}</h2>
                  <p style={{ marginTop: 8, color: 'var(--color-ink-600)', fontSize: 16, lineHeight: 1.75 }}>{s.p}</p>
                </section>
              ))}
            </div>

            <hr className="mrn-rule" style={{ marginBlock: 44 }} />
            <Link href="/" className="mrn-link" style={{ color: 'var(--color-punch)', fontSize: 15 }}>
              ← На главную
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
