'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/AuthShell'
import { checkPassword } from '@/lib/password'

type Access = 'checking' | 'granted' | 'denied'

/**
 * Создание нового пароля.
 *
 * Страница открывается только при активной сессии восстановления: её даёт
 * либо переход по ссылке из письма, либо подтверждённый код на /auth/forgot.
 * Без такой сессии форма не показывается — иначе адрес был бы способом
 * менять пароль без подтверждения владения почтой.
 */
export default function ResetPasswordClient() {
  const [access, setAccess] = useState<Access>('checking')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    // Supabase сам разбирает параметры из ссылки в письме и поднимает сессию.
    // Ждём её появления, а затем решаем, показывать ли форму.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setAccess('granted')
    })

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setAccess(data.session ? 'granted' : 'denied')
    })

    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [supabase])

  const strength = checkPassword(password)
  const mismatch = repeat.length > 0 && password !== repeat
  const canSubmit = strength.ok && !mismatch && repeat.length > 0 && !saving

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Использованный токен восстановления больше не действует: выходим из
      // временной сессии, чтобы вход выполнялся уже новым паролем.
      await supabase.auth.signOut()
      setDone(true)
    } catch (err) {
      const message = (err as Error).message || ''
      toast.error(
        /expired|invalid/i.test(message)
          ? 'Срок действия ссылки истёк — запросите восстановление заново'
          : 'Не удалось сохранить пароль. Попробуйте ещё раз',
      )
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <AuthShell eyebrow="Готово" title="Пароль изменён">
        <div className="flex flex-col gap-4">
          <p className="mrn-lead" style={{ fontSize: 15 }}>
            Новый пароль сохранён. Войдите с ним — прежний больше не действует.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mrn-btn mrn-btn--primary mrn-btn--block"
          >
            Перейти ко входу
          </button>
        </div>
      </AuthShell>
    )
  }

  if (access === 'checking') {
    return (
      <AuthShell eyebrow="Восстановление доступа" title="Проверяем ссылку">
        <p className="mrn-lead" style={{ fontSize: 15 }}>Секунду…</p>
      </AuthShell>
    )
  }

  if (access === 'denied') {
    return (
      <AuthShell eyebrow="Восстановление доступа" title="Ссылка недействительна">
        <div className="flex flex-col gap-4">
          <p className="mrn-lead" style={{ fontSize: 15 }}>
            Ссылка устарела или уже использована. Запросите восстановление ещё раз —
            письмо придёт в течение минуты.
          </p>
          <Link href="/auth/forgot" className="mrn-btn mrn-btn--primary mrn-btn--block">
            Запросить новое письмо
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Восстановление доступа"
      title="Придумайте новый пароль"
      lead="После сохранения прежний пароль перестанет действовать."
      footer={
        <p className="mrn-meta">
          Передумали?{' '}
          <Link href="/auth/login" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
            Вернуться ко входу
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="mrn-field">
          <label className="mrn-label" htmlFor="new-password">Новый пароль</label>
          <div style={{ position: 'relative' }}>
            <input
              id="new-password"
              className="mrn-input"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-req"
              style={{ paddingRight: 46 }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 0, background: 'none', cursor: 'pointer', color: 'var(--color-ink-400)',
              }}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {/* Индикатор надёжности: полосы + понятный текст */}
          {password && (
            <div id="password-req" style={{ marginTop: 4 }}>
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      height: 3, flex: 1, borderRadius: 999,
                      background: i < strength.score ? 'var(--color-punch)' : 'var(--color-paper-3)',
                    }}
                  />
                ))}
              </div>
              <p className="mrn-meta" style={{ fontSize: 12, marginTop: 6 }}>
                {strength.ok
                  ? `Надёжность: ${strength.label.toLowerCase()}`
                  : strength.problems.join(' · ')}
              </p>
            </div>
          )}
        </div>

        <div className="mrn-field">
          <label className="mrn-label" htmlFor="repeat-password">Повторите пароль</label>
          <input
            id="repeat-password"
            className="mrn-input"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            aria-invalid={mismatch}
          />
          {mismatch && (
            <p style={{ fontSize: 13, color: 'var(--color-punch)' }}>Пароли не совпадают</p>
          )}
          {!mismatch && repeat.length > 0 && strength.ok && (
            <p className="mrn-meta flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--color-mint)' }}>
              <Check size={14} aria-hidden="true" /> Пароли совпадают
            </p>
          )}
        </div>

        <button type="submit" disabled={!canSubmit} className="mrn-btn mrn-btn--primary mrn-btn--block">
          {saving ? 'Сохраняем…' : 'Сохранить новый пароль'}
        </button>
      </form>
    </AuthShell>
  )
}
