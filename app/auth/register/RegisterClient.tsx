'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/AuthShell'
import { checkPassword } from '@/lib/password'

/**
 * Регистрация.
 *
 * Логика не менялась — тот же signUp. Переработана подача и проверка пароля:
 * раньше требовалось 6 символов без других условий, теперь используется общая
 * проверка из lib/password, та же, что на восстановлении и смене пароля.
 */
export default function RegisterClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const strength = checkPassword(password)
  const canSubmit = email.trim().length > 0 && strength.ok && !loading

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
      if (authError) throw authError
      toast.success('Аккаунт создан')
      router.push('/dashboard')
    } catch (err) {
      const message = (err as Error).message || ''
      setError(
        /already registered|already exists/i.test(message)
          ? 'Такая почта уже зарегистрирована — попробуйте войти'
          : /rate limit/i.test(message)
            ? 'Слишком много попыток. Подождите пару минут'
            : 'Не удалось создать аккаунт. Попробуйте ещё раз',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Создание аккаунта"
      title="Соберите приглашение за вечер"
      lead="Аккаунт нужен, чтобы сохранять черновик и вернуться к нему с любого устройства."
      footer={
        <p className="mrn-meta">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
            Войти
          </Link>
        </p>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="mrn-field">
          <label className="mrn-label" htmlFor="register-email">Электронная почта</label>
          <input
            id="register-email"
            className="mrn-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-invalid={!!error}
          />
          <p className="mrn-meta" style={{ fontSize: 12 }}>
            На эту почту приходит восстановление доступа и ответы гостей.
          </p>
        </div>

        <div className="mrn-field">
          <label className="mrn-label" htmlFor="register-password">Пароль</label>
          <div style={{ position: 'relative' }}>
            <input
              id="register-password"
              className="mrn-input"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              aria-describedby="register-password-hint"
              style={{ paddingRight: 46 }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Скрыть пароль' : 'Показать пароль'}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 0, background: 'none', cursor: 'pointer', color: 'var(--color-ink-400)',
              }}
            >
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {password && (
            <div id="register-password-hint">
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

        {error && (
          <p
            role="alert"
            style={{
              fontSize: 13.5, lineHeight: 1.5, color: 'var(--color-punch)',
              background: 'var(--color-cream-soft)', border: '1px solid rgba(228, 69, 31, 0.2)',
              borderRadius: 'var(--radius-sm)', padding: '11px 13px',
            }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={!canSubmit} className="mrn-btn mrn-btn--primary mrn-btn--block">
          {loading ? 'Создаём аккаунт…' : <>Создать аккаунт <ArrowRight size={16} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
