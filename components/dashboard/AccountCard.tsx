'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ShieldCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { checkPassword } from '@/lib/password'
import { usePlan } from '@/lib/subscription'
import { formatMoment } from '@/lib/projectStatus'

/**
 * Раздел «Аккаунт» в настройках кабинета.
 *
 * До этого патча управлять самим аккаунтом было негде: ни имени, ни смены
 * пароля, ни выхода со всех устройств, ни удаления.
 *
 * Критические действия требуют подтверждения: смена пароля — ввода текущего,
 * удаление — ввода собственной почты. Одно случайное нажатие ничего не ломает.
 */
export function AccountCard({ user }: { user: User }) {
  const supabase = createClient()
  const router = useRouter()
  const { meta } = usePlan()

  const meta_ = (user.user_metadata || {}) as { name?: string; full_name?: string }
  const [name, setName] = useState(meta_.name || meta_.full_name || '')
  const [savingName, setSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const strength = checkPassword(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === repeatPassword
  const canChangePassword = currentPassword.length > 0 && strength.ok && passwordsMatch && !changingPassword

  const saveName = async () => {
    setSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } })
      if (error) throw error
      toast.success('Имя сохранено')
    } catch {
      toast.error('Не удалось сохранить имя')
    } finally {
      setSavingName(false)
    }
  }

  const changePassword = async () => {
    if (!canChangePassword || !user.email) return
    setChangingPassword(true)
    try {
      // Повторное подтверждение личности: без текущего пароля сменить его нельзя,
      // иначе чужой человек за незаблокированным компьютером сменил бы доступ.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (authError) {
        toast.error('Текущий пароль неверный')
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setRepeatPassword('')
      toast.success('Пароль изменён')
    } catch {
      toast.error('Не удалось изменить пароль')
    } finally {
      setChangingPassword(false)
    }
  }

  const signOutEverywhere = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
      toast.success('Выполнен выход на всех устройствах')
      router.push('/auth/login')
    } catch {
      toast.error('Не удалось выйти со всех устройств')
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirm.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
      toast.error('Введите свою почту, чтобы подтвердить удаление')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Не удалось удалить аккаунт')

      await supabase.auth.signOut()
      toast.success('Аккаунт удалён')
      router.push('/')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const field = { display: 'flex', flexDirection: 'column' as const, gap: 7 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Профиль */}
      <div style={field}>
        <label className="mrn-label" htmlFor="account-name">Ваше имя</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="account-name"
            className="mrn-input"
            style={{ flex: '1 1 200px' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            maxLength={60}
          />
          <button onClick={saveName} disabled={savingName} className="mrn-btn mrn-btn--secondary">
            {savingName ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div style={field}>
        <span className="mrn-label">Электронная почта</span>
        <p style={{ fontSize: 15 }}>{user.email}</p>
        <p className="mrn-meta" style={{ fontSize: 12.5 }}>
          Почта — это логин и адрес, куда приходит восстановление доступа.
          Смена почты появится в следующем обновлении.
        </p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <span className="mrn-label">Тариф</span>
          <p style={{ fontSize: 15, marginTop: 4 }}>{meta.label}</p>
        </div>
        <div>
          <span className="mrn-label">Аккаунт создан</span>
          <p style={{ fontSize: 15, marginTop: 4 }}>{formatMoment(user.created_at) ?? '—'}</p>
        </div>
      </div>

      <hr className="mrn-rule" />

      {/* Смена пароля */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} aria-hidden="true" style={{ color: 'var(--color-punch)' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Смена пароля</p>
        </div>

        <div style={field}>
          <label className="mrn-label" htmlFor="current-password">Текущий пароль</label>
          <input
            id="current-password"
            className="mrn-input"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div style={field}>
          <label className="mrn-label" htmlFor="account-new-password">Новый пароль</label>
          <input
            id="account-new-password"
            className="mrn-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {newPassword && !strength.ok && (
            <p className="mrn-meta" style={{ fontSize: 12.5 }}>{strength.problems.join(' · ')}</p>
          )}
        </div>

        <div style={field}>
          <label className="mrn-label" htmlFor="account-repeat-password">Повторите новый пароль</label>
          <input
            id="account-repeat-password"
            className="mrn-input"
            type="password"
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            aria-invalid={repeatPassword.length > 0 && !passwordsMatch}
          />
          {repeatPassword.length > 0 && !passwordsMatch && (
            <p style={{ fontSize: 13, color: 'var(--color-punch)' }}>Пароли не совпадают</p>
          )}
        </div>

        <button
          onClick={changePassword}
          disabled={!canChangePassword}
          className="mrn-btn mrn-btn--secondary"
          style={{ alignSelf: 'flex-start' }}
        >
          {changingPassword ? 'Меняем…' : 'Изменить пароль'}
        </button>
      </div>

      <hr className="mrn-rule" />

      {/* Сессии */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>Сессии</p>
          <p className="mrn-meta" style={{ fontSize: 12.5, marginTop: 3 }}>
            Если вы заходили с чужого устройства — завершите все сеансы.
          </p>
        </div>
        <button onClick={signOutEverywhere} className="mrn-btn mrn-btn--sm mrn-btn--secondary">
          <LogOut size={15} aria-hidden="true" /> Выйти со всех устройств
        </button>
      </div>

      <hr className="mrn-rule" />

      {/* Удаление аккаунта */}
      <div
        style={{
          padding: 'clamp(16px, 3vw, 20px)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-cream-soft)',
          border: '1px solid rgba(228, 69, 31, 0.2)',
        }}
      >
        <div className="flex items-center gap-2">
          <Trash2 size={17} aria-hidden="true" style={{ color: 'var(--color-punch)' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-punch)' }}>Удаление аккаунта</p>
        </div>
        <p className="mrn-meta" style={{ marginTop: 8, fontSize: 13 }}>
          Вместе с аккаунтом удаляются все ваши приглашения и полученные ответы.
          Восстановить их будет нельзя.
        </p>

        {!deleteOpen ? (
          <button
            onClick={() => setDeleteOpen(true)}
            className="mrn-btn mrn-btn--sm mrn-btn--secondary"
            style={{ marginTop: 14, color: 'var(--color-punch)', borderColor: 'rgba(228, 69, 31, 0.35)' }}
          >
            Удалить аккаунт
          </button>
        ) : (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="mrn-label" htmlFor="delete-confirm">
              Введите <strong>{user.email}</strong> для подтверждения
            </label>
            <input
              id="delete-confirm"
              className="mrn-input"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user.email || ''}
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="mrn-btn mrn-btn--sm"
                style={{ background: 'var(--color-punch)', color: 'var(--color-paper)' }}
              >
                {deleting ? 'Удаляем…' : 'Удалить навсегда'}
              </button>
              <button
                onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}
                className="mrn-btn mrn-btn--sm mrn-btn--ghost"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
