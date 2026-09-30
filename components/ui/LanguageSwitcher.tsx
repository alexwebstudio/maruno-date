'use client'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { language, setLanguage } = useAppStore()

  const pickKz = () => {
    toast('Казахская версия платформы находится в разработке и станет доступна в одном из ближайших обновлений.', {
      icon: '🇰🇿', duration: 5000, style: { maxWidth: 420, textAlign: 'center' },
    })
  }

  const base = 'h-9 px-2 rounded-[10px] text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors'
  const active = dark ? 'text-paper' : 'text-ink'
  const idle = dark ? 'text-paper/50 hover:text-paper/80' : 'text-ink-400 hover:text-ink'

  return (
    <div className="flex items-center" role="group" aria-label="Язык интерфейса">
      <button
        type="button"
        onClick={() => setLanguage('ru')}
        aria-pressed={language === 'ru'}
        className={`${base} ${language === 'ru' ? active : idle}`}
      >
        RU
      </button>
      <span aria-hidden="true" className={dark ? 'text-paper/25' : 'text-ink/20'}>/</span>
      <button
        type="button"
        onClick={pickKz}
        title="Скоро"
        aria-pressed={false}
        className={`${base} ${idle}`}
      >
        KZ
      </button>
    </div>
  )
}
