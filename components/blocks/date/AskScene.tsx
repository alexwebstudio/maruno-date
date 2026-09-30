'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SceneShell } from '@/components/date/SceneShell'
import { RunawayButton } from '@/components/date/RunawayButton'
import { EditableInline } from './EditableInline'
import { bool, parseTaunts, readCharacter, str } from '@/lib/dateScenario'
import type { ParticleKind, SceneLayout } from '@/lib/templateCatalog'
import type { Mood } from '@/components/date/Character'
import type { SceneProps } from './types'

/**
 * ПЕРВАЯ СЦЕНА — ГЛАВНЫЙ ВОПРОС
 *
 * Экран, ради которого человек и открыл ссылку: вопрос и две кнопки.
 * «Да» ведёт дальше, «Нет» убегает (см. RunawayButton).
 *
 * В режиме правки механика побега выключена: иначе автор не смог бы
 * нажать на подпись кнопки, чтобы её изменить. Переход по сценарию
 * в редакторе тоже не происходит — автор смотрит именно эту сцену.
 */
export function AskScene({ block, colors, fonts, isEditing, onChange, onAnswer }: SceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [mood, setMood] = useState<Mood>('idle')
  const [burst, setBurst] = useState(0)
  const [accepted, setAccepted] = useState(false)

  const c = block.content
  const set = (k: string, v: string | boolean) => onChange({ ...c, [k]: v })

  const question = str(c.question, 'Ты хочешь пойти со мной на свидание?')
  const subtitle = str(c.subtitle)
  const recipient = str(c.recipient)
  const yesLabel = str(c.yesLabel, 'Да')
  const noLabel = str(c.noLabel, 'Нет')
  const runaway = bool(c.runaway, true)
  const taunts = parseTaunts(c.taunts)
  const character = readCharacter(c)
  const layout = (str(c.layout, 'center') as SceneLayout)
  const particles = (str(c.particles, 'hearts') as ParticleKind)

  /**
   * Согласие: сначала реакция, потом переход. Пауза короткая — ровно
   * столько, сколько нужно, чтобы увидеть радость персонажа и частицы.
   * Без неё сцена сменилась бы раньше, чем человек понял, что нажал.
   */
  const handleYes = () => {
    if (isEditing || accepted) return
    setAccepted(true)
    setMood('happy')
    setBurst((b) => b + 1)
    setTimeout(() => {
      onAnswer({ ask: { value: 'yes', label: yesLabel } })
    }, 1100)
  }

  return (
    <SceneShell
      ref={sceneRef}
      colors={colors}
      fonts={fonts}
      layout={layout}
      character={character}
      mood={mood}
      burst={burst ? { kind: particles, key: burst } : null}
      eyebrow={
        recipient || isEditing ? (
          <EditableInline
            value={recipient}
            onChange={(v) => set('recipient', v)}
            isEditing={isEditing}
            placeholder="Кому (необязательно)"
          />
        ) : null
      }
      title={
        <EditableInline
          value={question}
          onChange={(v) => set('question', v)}
          isEditing={isEditing}
          multiline
          placeholder="Главный вопрос"
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
      <div
        className="flex flex-wrap items-center justify-center gap-3 w-full"
        style={{ minHeight: 64 }}
      >
        {/*
          В режиме правки обе кнопки — это span, а не button. Поле ввода
          внутри button — невалидная вложенность: браузер отдаёт нажатие
          кнопке, и подпись не получается отредактировать.
        */}
        {isEditing ? (
          <>
            <span
              className="date-btn date-btn--lg"
              style={{ background: colors.primary, color: colors.background }}
            >
              <EditableInline
                value={yesLabel}
                onChange={(v) => set('yesLabel', v)}
                isEditing
                placeholder="Да"
              />
            </span>
            <span
              className="date-btn date-btn--lg"
              style={{ borderColor: `${colors.text}2E`, color: colors.text, background: 'transparent' }}
            >
              <EditableInline
                value={noLabel}
                onChange={(v) => set('noLabel', v)}
                isEditing
                placeholder="Нет"
              />
            </span>
          </>
        ) : (
          <>
            <motion.button
              type="button"
              className="date-btn date-btn--lg"
              style={{ background: colors.primary, color: colors.background }}
              // «Да» слегка подрастает, пока «Нет» убегает: подсказка без единого слова
              animate={{ scale: accepted ? 1.06 : 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              onClick={handleYes}
            >
              {yesLabel}
            </motion.button>
            <RunawayButton
              label={noLabel}
              taunts={taunts}
              boundsRef={sceneRef}
              enabled={runaway && !accepted}
              onClick={() => onAnswer({ ask: { value: 'no', label: noLabel } })}
              className="date-btn date-btn--lg"
              style={{ borderColor: `${colors.text}2E`, color: colors.text, background: 'transparent' }}
            />
          </>
        )}
      </div>
    </SceneShell>
  )
}
