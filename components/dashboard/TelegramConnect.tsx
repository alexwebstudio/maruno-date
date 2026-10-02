'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Send, Check, Loader2, X } from 'lucide-react'
import {
  startTelegramLink, getTelegramStatus, disconnectTelegram, type TelegramStatus,
} from '@/app/actions/telegram'

/**
 * Реальное подключение Telegram к аккаунту (ТЗ п.3–5, 10).
 *
 * «Подключить» → создаётся одноразовый токен на бэкенде → открывается бот по
 * deep link → пользователь жмёт Start → webhook привязывает Telegram к этому
 * аккаунту. Пока человек в Telegram, компонент опрашивает статус и, как только
 * привязка появилась в базе, показывает подключённый Telegram и кнопку
 * «Отключить». Никакого «подключено» без реальной связи.
 */
export function TelegramConnect() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    const st = await getTelegramStatus()
    setStatus(st)
    return st
  }, [])

  useEffect(() => {
    // Загрузка статуса при открытии настроек. setState — в async-колбэке,
    // а не синхронно; для правила это допустимый разовый fetch-on-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => setLoading(false))
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [refresh])

  const connect = async () => {
    setWorking(true)
    const res = await startTelegramLink()
    setWorking(false)
    if (!res.ok || !res.url) {
      toast.error(res.message || 'Не удалось начать подключение')
      return
    }
    // Открываем бота. Пользователь жмёт Start в Telegram.
    window.open(res.url, '_blank', 'noopener')
    setWaiting(true)

    // Опрашиваем статус ~2 минуты, пока webhook не привяжет аккаунт.
    let tries = 0
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      tries += 1
      const st = await refresh()
      if (st.connected) {
        if (pollRef.current) clearInterval(pollRef.current)
        setWaiting(false)
        toast.success('Telegram подключён ✈️')
      } else if (tries >= 40) {
        if (pollRef.current) clearInterval(pollRef.current)
        setWaiting(false)
      }
    }, 3000)
  }

  const disconnect = async () => {
    setWorking(true)
    const res = await disconnectTelegram()
    setWorking(false)
    if (res.ok) {
      setStatus({ connected: false })
      toast.success('Telegram отключён')
    } else {
      toast.error(res.message || 'Не удалось отключить')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8B7680', fontSize: 13 }}>
        <Loader2 size={15} className="animate-spin" /> Загрузка…
      </div>
    )
  }

  if (status?.connected) {
    const display = status.username
      ? `@${status.username}`
      : [status.firstName, status.lastName].filter(Boolean).join(' ') || 'Telegram'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14, background: '#ECF7EE', border: '1px solid #BFE3C8' }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, background: '#2E9E4A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1016' }}>Telegram подключён</p>
            <p style={{ fontSize: 13, color: '#3B6B47', marginTop: 2 }}>{display}</p>
            {status.firstName && status.username && (
              <p style={{ fontSize: 12.5, color: '#6A5D4C', marginTop: 1 }}>
                {[status.firstName, status.lastName].filter(Boolean).join(' ')}
              </p>
            )}
            {status.chatId && (
              <p style={{ fontSize: 11.5, color: '#9A8B76', marginTop: 3, fontFamily: 'var(--font-numeric)' }}>
                Chat ID: {status.chatId}
              </p>
            )}
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: '#6A5D4C', lineHeight: 1.6 }}>
          Новые заявки с ваших приглашений приходят в этот Telegram.
        </p>
        <button
          onClick={disconnect}
          disabled={working}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: '#fff', color: '#B4342B', border: '1px solid rgba(180,52,43,.3)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
        >
          {working ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Отключить Telegram
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: 14, background: '#F0F6FB', border: '1px solid #D6E6F2' }}>
        <Send size={17} color="#2A7BB8" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12.5, color: '#3A5A72', lineHeight: 1.6 }}>
          Нажмите «Подключить» — откроется бот Maruno. В нём нажмите <b>Start</b>, и Telegram
          привяжется к этому аккаунту. Заявки с ваших приглашений начнут приходить сюда.
        </p>
      </div>
      <button
        onClick={connect}
        disabled={working || waiting}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, background: '#229ED9', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', opacity: working || waiting ? 0.75 : 1 }}
      >
        {working ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {waiting ? 'Ждём Start в Telegram…' : 'Подключить Telegram'}
      </button>
      {waiting && (
        <p style={{ fontSize: 12.5, color: '#6A5D4C' }}>
          Нажали Start в Telegram? Статус обновится здесь автоматически.
        </p>
      )}
    </div>
  )
}
