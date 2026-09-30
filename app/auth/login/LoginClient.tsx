'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/AuthShell'

/**
 * Вход в кабинет.
 *
 * Логика авторизации не менялась — тот же signInWithPassword.
 * Переработана только подача: общая рамка AuthShell и поля дизайн-системы
 * вместо отдельной вёрстки с золотым градиентом.
 */
export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      toast.success('С возвращением')
      router.push('/dashboard')
    } catch (err) {
      const message = (err as Error).message || ''
      // Не уточняем, что именно неверно: иначе форма подсказывает,
      // какие адреса зарегистрированы в сервисе.
      setError(
        /invalid login/i.test(message)
          ? 'Неверная почта или пароль'
          : /email not confirmed/i.test(message)
            ? 'Почта ещё не подтверждена — проверьте письмо от Maruno'
            : 'Не удалось войти. Попробуйте ещё раз',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Личный кабинет"
      title="С возвращением"
      lead="Продолжите работу над приглашением — черновик сохранён там, где вы остановились."
      footer={
        <p className="mrn-meta">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="mrn-field">
          <label className="mrn-label" htmlFor="login-email">Электронная почта</label>
          <input
            id="login-email"
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
        </div>

        <div className="mrn-field">
          <div className="flex items-center justify-between gap-3">
            <label className="mrn-label" htmlFor="login-password">Пароль</label>
            <Link
              href="/auth/forgot"
              className="mrn-link"
              style={{ fontSize: 13, color: 'var(--color-punch)' }}
            >
              Забыли пароль?
            </Link>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              className="mrn-input"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ваш пароль"
              aria-invalid={!!error}
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

        <button type="submit" disabled={loading} className="mrn-btn mrn-btn--primary mrn-btn--block">
          {loading ? 'Входим…' : <>Войти <ArrowRight size={16} /></>}
        </button>
      </form>
    </AuthShell>
  )
}
