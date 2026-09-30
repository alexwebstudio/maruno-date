'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import { logError } from '@/lib/errors'

/**
 * Граница ошибок для публичной части и кабинета.
 *
 * Без неё сбой в любом клиентском компоненте показывал пустой белый экран,
 * и пользователь не понимал, сломался сервис или пропали его данные.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError(error, { action: 'render', meta: { digest: error.digest ?? null } })
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-paper)' }}
    >
      <div className="mrn-container mrn-container--narrow" style={{ textAlign: 'center', paddingBlock: 64 }}>
        <p className="mrn-eyebrow">Что-то пошло не так</p>
        <h1 className="mrn-h1" style={{ marginTop: 16 }}>Страница не открылась</h1>
        <p className="mrn-lead" style={{ marginTop: 16, marginInline: 'auto', maxWidth: '44ch' }}>
          Сбой на нашей стороне. Ваши сайты и черновики в порядке — они хранятся
          на сервере и не зависят от этой страницы.
        </p>

        <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: 30 }}>
          <button onClick={reset} className="mrn-btn mrn-btn--primary">
            <RotateCcw size={16} aria-hidden="true" /> Попробовать снова
          </button>
          <Link href="/dashboard" className="mrn-btn mrn-btn--secondary">
            В личный кабинет
          </Link>
        </div>

        {error.digest && (
          <p className="mrn-meta" style={{ marginTop: 24, fontSize: 12 }}>
            Код ошибки: {error.digest} — назовите его, если будете писать в поддержку
          </p>
        )}
      </div>
    </main>
  )
}
