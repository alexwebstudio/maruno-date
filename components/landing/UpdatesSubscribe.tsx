'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { subscribeToUpdates } from '@/app/actions/subscribe'
import Link from 'next/link'
import { Reveal } from './Reveal'

// Пункт 10: получать сообщения о новых апдейтах.
export default function UpdatesSubscribe() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const handle = async () => {
    setSending(true)
    const res = await subscribeToUpdates(email)
    setSending(false)
    if (res.ok) { toast.success(res.message); setEmail('') }
    else toast.error(res.message)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sending) handle()
  }

  return (
    <section className="mrn-section--tight mrn-tone-sand">
      <div className="mrn-container">
        <Reveal
          className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
          style={{
            background: 'var(--color-paper)',
            border: '1px solid var(--mrn-line)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(26px, 4vw, 40px)',
          }}
        >
          <div>
            <p className="mrn-eyebrow">Обновления</p>
            <h2 className="mrn-h3" style={{ marginTop: 12, fontSize: 'clamp(1.35rem, 2.6vw, 1.75rem)' }}>
              Узнавайте о новых шаблонах первыми
            </h2>
            <p className="mrn-lead" style={{ marginTop: 10, fontSize: 15, maxWidth: '48ch' }}>
              Новые направления, блоки и улучшения редактора — короткое письмо, когда есть что показать.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-wrap gap-3" style={{ minWidth: 'min(100%, 340px)' }}>
            <label className="mrn-sr" htmlFor="subscribe-email">Электронная почта</label>
            <input
              id="subscribe-email"
              className="mrn-input"
              style={{ flex: '1 1 200px', minWidth: 0 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              autoComplete="email"
            />
            <button type="submit" disabled={sending} className="mrn-btn mrn-btn--primary">
              {sending ? 'Отправляем…' : 'Подписаться'}
            </button>
            {/* Согласие на рассылку: ссылка на политику, без выдуманных формулировок */}
            <p className="mrn-meta" style={{ flexBasis: '100%', margin: 0, fontSize: 12.5 }}>
              Нажимая «Подписаться», вы соглашаетесь с{' '}
              <Link href="/privacy" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
                политикой конфиденциальности
              </Link>.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  )
}
