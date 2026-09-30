'use client'
import { SiteFooter } from '@/components/landing/SiteFooter'

import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { ShieldAlert } from 'lucide-react'

const SECTIONS = [
  {
    h: '1. Использование сервиса',
    p: 'Maruno Date предоставляет инструмент для создания интерактивных приглашений на свидание для личного использования. Регистрируясь, вы соглашаетесь с настоящими условиями.',
  },
  {
    h: '2. Личное использование',
    p: 'Сервис предназначен для создания личных приглашений. Вы можете создавать приглашения, редактировать их и делиться личной ссылкой.',
  },
  {
    h: '3. Запрет коммерческого использования',
    danger: true,
    p: 'Строго запрещается использование сервиса в коммерческих целях, в том числе: перепродажа созданных на платформе сайтов третьим лицам, оказание платных услуг по созданию приглашений на базе Maruno под видом собственной студии, а также любое иное извлечение прибыли за счёт функциональности сервиса без письменного разрешения.',
  },
  {
    h: '4. Последствия нарушения',
    danger: true,
    p: 'При выявлении нарушения пункта 3 аккаунт блокируется без возможности разблокировки и без возврата средств. Созданные сайты могут быть удалены. Решение о блокировке принимается администрацией сервиса.',
  },
  {
    h: '5. Контент пользователя',
    p: 'Вы несёте ответственность за загружаемый контент (фото, тексты). Запрещено размещать материалы, нарушающие закон, права третьих лиц или содержащие оскорбления.',
  },
  {
    h: '6. Оплата',
    p: 'Платные тарифы приобретаются разово и действуют бессрочно для аккаунта (email), на который оформлена покупка. Передача доступа третьим лицам запрещена.',
  },
  {
    h: '7. Изменения условий',
    p: 'Администрация вправе обновлять настоящие условия. Актуальная версия всегда доступна на этой странице.',
  },
]

export default function TermsPageClient() {
  return (
    <>
      <a href="#content" className="mrn-skip">К содержимому</a>
      <Navbar />

      <main id="content" style={{ background: 'var(--color-paper)' }}>
        <section style={{ paddingTop: 'clamp(104px, 13vh, 148px)', paddingBottom: 'clamp(56px, 8vw, 88px)' }}>
          <div className="mrn-container mrn-container--narrow">
            <p className="mrn-eyebrow">Документы</p>
            <h1 className="mrn-h1" style={{ marginTop: 16 }}>Условия использования</h1>

            <div style={{ display: 'grid', gap: 28, marginTop: 44 }}>
              {SECTIONS.map((s) => (
                <section
                  key={s.h}
                  style={
                    s.danger
                      ? {
                          padding: 'clamp(20px, 3vw, 26px)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--color-cream)',
                          border: '1px solid rgba(228, 69, 31, 0.2)',
                        }
                      : undefined
                  }
                >
                  <h2 className="mrn-h3 flex items-center gap-2" style={s.danger ? { color: 'var(--color-punch)' } : undefined}>
                    {s.danger && <ShieldAlert size={18} aria-hidden="true" />}
                    {s.h}
                  </h2>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 16,
                      lineHeight: 1.75,
                      color: s.danger ? 'var(--color-ink-700)' : 'var(--color-ink-600)',
                    }}
                  >
                    {s.p}
                  </p>
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
