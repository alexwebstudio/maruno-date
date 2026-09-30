'use client'
import { useEffect, useState } from 'react'
import { DateSite } from '@/components/templates/DateSite'
import type { Project } from '@/types'

/**
 * ОПУБЛИКОВАННОЕ ПРИГЛАШЕНИЕ
 *
 * Тот же DateSite, что работает в редакторе и предпросмотре, — отдельного
 * «публичного рендерера» нет намеренно: расхождение между тем, что автор
 * видел, и тем, что получил адресат, было бы худшей из возможных ошибок
 * этого продукта.
 *
 * Отличие ровно одно: live={true}. Это значит, что пройденный сценарий
 * в конце уходит автору в раздел «Ответы».
 *
 * PIN-код опционален и по умолчанию пуст: он нужен тем, кто отправляет
 * ссылку в общий чат и не хочет, чтобы приглашение открыл кто попало.
 */
export function DateInvitationClient({ project }: { project: Project }) {
  const pin = (project.music?.accessPin || '').trim()
  const [unlocked, setUnlocked] = useState(!pin)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    if (!pin) { setUnlocked(true); return }
    try {
      if (sessionStorage.getItem(`maruno.unlock.${project.slug}`) === pin) setUnlocked(true)
    } catch {}
  }, [pin, project.slug])

  const tryUnlock = () => {
    if (pinInput.trim() === pin) {
      setUnlocked(true)
      try { sessionStorage.setItem(`maruno.unlock.${project.slug}`, pin) } catch {}
    } else {
      setPinError(true)
      setTimeout(() => setPinError(false), 800)
    }
  }

  if (!unlocked) {
    return (
      <div
        className="fixed inset-0 z-[400] flex items-center justify-center px-6"
        style={{ background: `linear-gradient(160deg, ${project.colors.background}, ${project.colors.accent})` }}
      >
        <div className="w-full max-w-xs text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl"
            style={{ background: project.colors.primary, color: project.colors.background }}
          >
            🔒
          </div>
          <h1
            className="text-2xl font-light mb-2"
            style={{ color: project.colors.text, fontFamily: `'${project.fonts.heading}', sans-serif` }}
          >
            Приглашение защищено
          </h1>
          <p className="text-sm opacity-60 mb-6" style={{ color: project.colors.text }}>
            Введите PIN-код из сообщения
          </p>
          <input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') tryUnlock() }}
            inputMode="numeric"
            maxLength={12}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.4em] py-3 rounded-xl outline-none mb-3"
            style={{
              background: project.colors.background,
              border: `2px solid ${pinError ? '#e5484d' : project.colors.primary + '55'}`,
              color: project.colors.text,
            }}
          />
          <button
            onClick={tryUnlock}
            className="w-full py-3 rounded-xl font-medium transition-transform active:scale-95"
            style={{ background: project.colors.primary, color: project.colors.background }}
          >
            Открыть приглашение
          </button>
          {pinError && <p className="text-xs mt-3" style={{ color: '#e5484d' }}>Неверный код, попробуйте ещё раз</p>}
        </div>
      </div>
    )
  }

  return <DateSite project={project} isEditing={false} live />
}
