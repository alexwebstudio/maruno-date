'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SceneShell } from '@/components/date/SceneShell'
import { EditableInline } from './EditableInline'
import { humanDate, parseTaunts, readCharacter, str } from '@/lib/dateScenario'
import type { SceneLayout } from '@/lib/templateCatalog'
import type { Mood } from '@/components/date/Character'
import type { SceneProps } from './types'

/**
 * СЦЕНА «КОГДА»
 *
 * Дата и время. Здесь намеренно нет своего календаря: нативные поля
 * <input type="date"> и <input type="time"> на телефоне открывают
 * системный выбор, к которому человек уже привык, работают с любым
 * способом ввода и не требуют ни строчки кода на поддержку.
 *
 * Быстрые чипы со временем — не замена полю, а ускорение: попасть
 * пальцем в «19:00» быстрее, чем крутить барабан.
 */
export function WhenScene({ block, colors, fonts, isEditing, onChange, onAnswer }: SceneProps) {
  const c = block.content
  const set = (k: string, v: string) => onChange({ ...c, [k]: v })

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [mood, setMood] = useState<Mood>('idle')
  const [sent, setSent] = useState(false)

  const question = str(c.question, 'Когда ты свободен?')
  const subtitle = str(c.subtitle)
  const dateLabel = str(c.dateLabel, 'День')
  const timeLabel = str(c.timeLabel, 'Время')
  const confirmLabel = str(c.confirmLabel, 'Готово')
  const character = readCharacter(c)
  const layout = (str(c.layout, 'center') as SceneLayout)
  const quickTimes = parseTaunts(c.quickTimes)

  // Прошедшую дату предлагать бессмысленно — свидание в прошлом не назначают
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const ready = Boolean(date && time)

  const confirm = () => {
    if (isEditing || !ready || sent) return
    setSent(true)
    setMood('happy')
    setTimeout(() => {
      onAnswer({
        date: { value: date, label: humanDate(date) },
        time: { value: time, label: time },
      })
    }, 520)
  }

  const fieldStyle: React.CSSProperties = {
    borderColor: `${colors.text}22`,
    background: colors.background,
    color: colors.text,
    colorScheme: isDark(colors.background) ? 'dark' : 'light',
  }

  return (
    <SceneShell
      colors={colors}
      fonts={fonts}
      layout={layout}
      character={character}
      mood={mood}
      title={
        <EditableInline
          value={question}
          onChange={(v) => set('question', v)}
          isEditing={isEditing}
          multiline
          placeholder="Вопрос сцены"
        />
      }
      subtitle={
        subtitle || isEditing ? (
          <EditableInline
            value={subtitle}
            onChange={(v) => set('subtitle', v)}
            isEditing={isEditing}
            multiline
            placeholder="Подзаголовок (необязательно)"
          />
        ) : null
      }
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ width: '100%', textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 12.5, opacity: 0.6, marginBottom: 6 }}>
            <EditableInline value={dateLabel} onChange={(v) => set('dateLabel', v)} isEditing={isEditing} placeholder="День" />
          </span>
          <input
            type="date"
            className="date-field"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            disabled={isEditing}
            style={fieldStyle}
          />
        </label>

        <div style={{ width: '100%', textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 12.5, opacity: 0.6, marginBottom: 6 }}>
            <EditableInline value={timeLabel} onChange={(v) => set('timeLabel', v)} isEditing={isEditing} placeholder="Время" />
          </span>

          {quickTimes.length > 0 && (
            <div className="date-chips" style={{ justifyContent: 'flex-start', marginBottom: 8 }}>
              {quickTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="date-chip"
                  onClick={() => { if (!isEditing) setTime(t) }}
                  style={{
                    borderColor: time === t ? colors.primary : `${colors.text}22`,
                    background: time === t ? `${colors.primary}1A` : 'transparent',
                    color: colors.text,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <input
            type="time"
            className="date-field"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={isEditing}
            style={fieldStyle}
          />
        </div>

        {/* В режиме правки — span: поле ввода внутри кнопки невалидно
            и не даёт отредактировать подпись. */}
        {isEditing ? (
          <span
            className="date-btn date-btn--lg"
            style={{ width: '100%', background: colors.primary, color: colors.background }}
          >
            <EditableInline
              value={confirmLabel}
              onChange={(v) => set('confirmLabel', v)}
              isEditing
              placeholder="Готово"
            />
          </span>
        ) : (
          <motion.button
            type="button"
            className="date-btn date-btn--lg"
            onClick={confirm}
            disabled={!ready}
            animate={{ opacity: ready ? 1 : 0.45 }}
            style={{
              width: '100%',
              background: colors.primary,
              color: colors.background,
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            {confirmLabel}
          </motion.button>
        )}
      </div>
    </SceneShell>
  )
}

/**
 * Тёмная ли подложка. Нужно ровно для одного: подсказать браузеру
 * color-scheme, иначе нативный выбор даты открывается белым окном
 * поверх тёмного приглашения.
 */
function isDark(hex: string): boolean {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return false
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v, 16))
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128
}
