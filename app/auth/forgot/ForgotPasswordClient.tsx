'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/AuthShell'

/** Пауза перед повторной отправкой — защита от перебора и от случайных дублей. */
const RESEND_SECONDS = 60

/**
 * Восстановление доступа.
 *
 * Шаг 1 — почта, шаг 2 — подтверждение владения ящиком.
 * Поддерживаются оба способа, которые умеет Supabase: письмо со ссылкой
 * и шестизначный код. Какой из них придёт — зависит от шаблона письма
 * в настройках проекта Supabase (см. docs/PASSWORD_RECOVERY.md).
 *
 * Сообщение об отправке одинаково и для существующей, и для несуществующей
 * почты: иначе форма превращается в способ проверять чужие аккаунты.
 */
export default function ForgotPasswordClient() {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const codeRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Таймер повторной отправки
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((v) => (v > 0 ? v - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value) return

    setSending(true)
    try {
      await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })
    } catch {
      // Ошибку не показываем намеренно — иначе по ответу можно узнать,
      // зарегистрирована ли почта. Проблемы доставки видны в логах Supabase.
    } finally {
      setSending(false)
    }

    setStep('code')
    setCooldown(RESEND_SECONDS)
    setTimeout(() => codeRef.current?.focus(), 60)
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = code.replace(/\D/g, '')
    if (token.length < 6) {
      toast.error('Код состоит из шести цифр')
      return
    }

    setVerifying(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'recovery',
      })
      if (error) throw error
      // После успешной проверки появляется временная сессия — она и открывает
      // доступ к странице создания нового пароля.
      router.push('/auth/reset')
    } catch (err) {
      const message = (err as Error).message || ''
      toast.error(
        /expired/i.test(message)
          ? 'Срок действия кода истёк — запросите новый'
          : 'Код неверный. Проверьте последнее письмо',
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Восстановление доступа"
      title="Вернём доступ к вашему кабинету"
      lead="Отправим на почту письмо для подтверждения. После этого можно будет задать новый пароль."
      footer={
        <p className="mrn-meta">
          Вспомнили пароль?{' '}
          <Link href="/auth/login" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
            Войти
          </Link>
        </p>
      }
    >
      {step === 'email' ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <div className="mrn-field">
            <label className="mrn-label" htmlFor="forgot-email">Электронная почта</label>
            <input
              id="forgot-email"
              className="mrn-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <button type="submit" disabled={sending} className="mrn-btn mrn-btn--primary mrn-btn--block">
            {sending ? 'Отправляем…' : <>Отправить письмо <ArrowRight size={16} /></>}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="flex items-start gap-3"
            style={{
              padding: 16,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-cream-soft)',
              border: '1px solid var(--mrn-line)',
            }}
          >
            <MailCheck size={18} aria-hidden="true" style={{ color: 'var(--color-punch)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-700)' }}>
              Если аккаунт с почтой <strong>{email.trim().toLowerCase()}</strong> существует,
              мы отправили на неё письмо. Перейдите по ссылке из письма — или введите код
              из него ниже.
            </p>
          </div>

          <form onSubmit={verify} className="flex flex-col gap-4">
            <div className="mrn-field">
              <label className="mrn-label" htmlFor="forgot-code">Код из письма</label>
              <input
                ref={codeRef}
                id="forgot-code"
                className="mrn-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{ letterSpacing: '0.4em', fontSize: 18, textAlign: 'center' }}
              />
              <p className="mrn-meta" style={{ fontSize: 12 }}>
                Если в письме только ссылка — просто откройте её, код вводить не нужно.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying || code.length < 6}
              className="mrn-btn mrn-btn--primary mrn-btn--block"
            >
              {verifying ? 'Проверяем…' : 'Подтвердить'}
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={cooldown > 0 || sending}
              className="mrn-btn mrn-btn--sm mrn-btn--ghost"
              style={{ paddingInline: 0 }}
            >
              {cooldown > 0 ? `Отправить снова через ${cooldown} с` : 'Отправить письмо ещё раз'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode('') }}
              className="mrn-btn mrn-btn--sm mrn-btn--ghost"
              style={{ paddingInline: 0 }}
            >
              Изменить почту
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
