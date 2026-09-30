'use client'
import { Plus, Trash2 } from 'lucide-react'
import type { ProjectColors } from '@/types'
import type { DateOption } from '@/lib/dateScenario'

/**
 * РЕДАКТОР ВАРИАНТОВ ОТВЕТА
 *
 * Появляется только в режиме правки, прямо под списком вариантов: автор
 * меняет подпись и эмодзи там же, где видит результат. Отдельной панели
 * «настройка сценария» нет намеренно — она увела бы человека от того,
 * что он редактирует.
 *
 * Идентификатор варианта (`id`) не редактируется: на него ссылаются
 * условия показа других сцен (`showIf: activity=eat`). Новый вариант
 * получает id из подписи — так условие можно собрать по смыслу.
 */
export function OptionsEditor({
  options, colors, onChange,
}: {
  options: DateOption[]
  colors: ProjectColors
  onChange: (next: DateOption[]) => void
}) {
  const update = (index: number, patch: Partial<DateOption>) => {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  const add = () => {
    const id = `opt-${Date.now().toString(36)}`
    onChange([...options, { id, emoji: '✨', label: 'Новый вариант' }])
  }

  const remove = (index: number) => onChange(options.filter((_, i) => i !== index))

  const fieldStyle: React.CSSProperties = {
    border: `1px solid ${colors.text}22`,
    background: colors.background,
    color: colors.text,
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 14,
    minHeight: 40,
    outline: 'none',
  }

  return (
    <div
      style={{
        width: '100%',
        marginTop: 6,
        padding: 12,
        borderRadius: 14,
        border: `1px dashed ${colors.text}2E`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textAlign: 'left',
      }}
    >
      <p style={{ fontSize: 12, opacity: 0.55, margin: 0, color: colors.text }}>
        Варианты ответа — их увидит тот, кому вы отправите приглашение
      </p>

      {options.map((option, i) => (
        <div key={option.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={option.emoji}
            onChange={(e) => update(i, { emoji: e.target.value })}
            aria-label="Эмодзи варианта"
            style={{ ...fieldStyle, width: 52, textAlign: 'center' }}
          />
          <input
            value={option.label}
            onChange={(e) => update(i, { label: e.target.value })}
            aria-label="Подпись варианта"
            style={{ ...fieldStyle, flex: 1, minWidth: 0 }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Удалить вариант «${option.label}»`}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              border: `1px solid ${colors.text}1A`, background: 'transparent',
              color: colors.text, opacity: 0.6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          minHeight: 40, borderRadius: 10, cursor: 'pointer',
          border: `1px solid ${colors.primary}55`, background: 'transparent',
          color: colors.primary, fontSize: 14, fontWeight: 500,
        }}
      >
        <Plus size={15} /> Добавить вариант
      </button>
    </div>
  )
}
