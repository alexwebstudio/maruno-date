'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { SceneShell } from '@/components/date/SceneShell'
import { RunawayButton } from '@/components/date/RunawayButton'
import { EditableInline } from './EditableInline'
import { OptionsEditor } from './OptionsEditor'
import { bool, parseOptions, readCharacter, str, type DateOption } from '@/lib/dateScenario'
import type { SceneLayout } from '@/lib/templateCatalog'
import type { Mood } from '@/components/date/Character'
import type { SceneProps } from './types'

/**
 * СЦЕНА ВЫБОРА — УНИВЕРСАЛЬНАЯ
 *
 * Одна сцена обслуживает все вопросы со списком ответов: «Что делаем»,
 * «А что едим», «Кто платит», «Куда пойдём». Три разных компонента тут
 * были бы тремя копиями одного кода: отличаются они только данными —
 * вопросом, списком вариантов и условием показа.
 *
 * Поэтому варианты не зашиты в компонент: они приходят из content.options
 * и правятся автором в редакторе. Условный показ («еду спрашиваем, только
 * если выбрали поесть») — это поле content.showIf, которое читает
 * lib/dateScenario.ts.
 */
export function ChoiceScene({ block, colors, fonts, isEditing, onChange, onAnswer }: SceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [mood, setMood] = useState<Mood>('idle')
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const c = block.content
  const set = (k: string, v: string | boolean) => onChange({ ...c, [k]: v })

  const question = str(c.question, 'Что ты хочешь?')
  const subtitle = str(c.subtitle)
  const options = parseOptions(c.options)
  const allowCustom = bool(c.allowCustom, false)
  const customLabel = str(c.customLabel, 'Свой вариант')
  const customPlaceholder = str(c.customPlaceholder, 'Напиши свой вариант')
  const runawayOption = str(c.runawayOption)
  const character = readCharacter(c)
  const layout = (str(c.layout, 'center') as SceneLayout)
  const key = str(c.key, 'choice')
  const grid = layout === 'stage'
  // Режим свободного ответа: одно текстовое поле вместо кнопок-вариантов.
  // Так сцена «где встретимся» спрашивает адрес, а не повторяет категории.
  const mode = str(c.mode)
  const isInput = mode === 'input'
  const inputPlaceholder = str(c.inputPlaceholder, 'Название места или адрес')
  const [inputValue, setInputValue] = useState('')
  const submitInput = () => {
    const v = inputValue.trim()
    if (v) pick({ id: 'answer', emoji: '📍', label: v })
  }

  /** Выбор: подсветка, короткая реакция персонажа, затем следующая сцена. */
  const pick = (option: DateOption) => {
    if (isEditing || chosen) return
    setChosen(option.id)
    setMood('happy')
    setTimeout(() => {
      onAnswer({ [key]: { value: option.id, label: option.label, emoji: option.emoji } })
    }, 620)
  }

  const submitCustom = () => {
    const value = customValue.trim()
    if (!value) return
    pick({ id: 'custom', emoji: '✍️', label: value })
  }

  const optionStyle = (id: string) => {
    const active = chosen === id
    return {
      borderColor: active ? colors.primary : `${colors.text}22`,
      background: active ? `${colors.primary}1A` : `${colors.background}`,
      color: colors.text,
    }
  }

  return (
    <SceneShell
      ref={sceneRef}
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
      {isInput ? (
        <div className="date-choices" style={{ maxWidth: 420, marginInline: 'auto' }}>
          <input
            className="date-field"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitInput() }}
            placeholder={inputPlaceholder}
            disabled={isEditing}
            style={{ borderColor: `${colors.text}22`, color: colors.text, background: colors.background, textAlign: 'center' }}
          />
          <button
            type="button"
            className="date-btn date-btn--lg"
            onClick={submitInput}
            disabled={isEditing}
            style={{ width: '100%', background: colors.primary, color: colors.background }}
          >
            Готово
          </button>
          {isEditing && (
            <p style={{ fontSize: 12.5, opacity: 0.55, textAlign: 'center', margin: 0 }}>
              Здесь человек впишет место встречи. Вопрос выше редактируется.
            </p>
          )}
        </div>
      ) : (
      <div className={grid ? 'date-choices date-choices--grid' : 'date-choices'}>
        {options.map((option) => {
          // Одна из кнопок может уворачиваться — это настройка сцены
          // («Кто платит?» → «Ты»), а не поведение всех вариантов подряд.
          if (!isEditing && runawayOption && option.id === runawayOption) {
            return (
              <RunawayButton
                key={option.id}
                label={option.label}
                prefix={option.emoji ? <span className="date-option__emoji">{option.emoji}</span> : null}
                taunts={[]}
                boundsRef={sceneRef}
                enabled={!chosen}
                onClick={() => pick(option)}
                className="date-option"
                style={optionStyle(option.id)}
              />
            )
          }

          return (
            <motion.button
              key={option.id}
              type="button"
              className="date-option"
              style={optionStyle(option.id)}
              onClick={() => pick(option)}
              animate={chosen === option.id ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={{ duration: 0.32 }}
            >
              {option.emoji && <span className="date-option__emoji">{option.emoji}</span>}
              <span style={{ flex: 1 }}>{option.label}</span>
              {chosen === option.id && <Check size={18} style={{ color: colors.primary }} />}
            </motion.button>
          )
        })}

        {/*
          В режиме правки это span, а не button: поле ввода внутри кнопки —
          невалидная вложенность, и подпись не получилось бы отредактировать.
        */}
        {allowCustom && !customOpen && (
          isEditing ? (
            <span className="date-option" style={optionStyle('__custom')}>
              <span className="date-option__emoji">✍️</span>
              <span style={{ flex: 1 }}>
                <EditableInline
                  value={customLabel}
                  onChange={(v) => set('customLabel', v)}
                  isEditing
                  placeholder="Свой вариант"
                />
              </span>
            </span>
          ) : (
            <button
              type="button"
              className="date-option"
              style={optionStyle('__custom')}
              onClick={() => setCustomOpen(true)}
            >
              <span className="date-option__emoji">✍️</span>
              <span style={{ flex: 1 }}>{customLabel}</span>
            </button>
          )
        )}

        {allowCustom && customOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', gap: 8, width: '100%' }}
          >
            <input
              className="date-field"
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCustom() }}
              placeholder={customPlaceholder}
              style={{ borderColor: `${colors.text}22`, color: colors.text, background: colors.background }}
            />
            <button
              type="button"
              className="date-btn"
              style={{ background: colors.primary, color: colors.background, paddingInline: 20 }}
              onClick={submitCustom}
            >
              <Check size={18} />
            </button>
          </motion.div>
        )}
      </div>
      )}

      {/* Правка списка вариантов живёт прямо в сцене: автор видит результат
          там же, где его меняет, и не ищет настройку в боковой панели. */}
      {isEditing && !isInput && (
        <OptionsEditor
          options={options}
          colors={colors}
          onChange={(next) => onChange({ ...c, options: JSON.stringify(next) })}
        />
      )}
    </SceneShell>
  )
}
