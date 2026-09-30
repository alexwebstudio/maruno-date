'use client'
import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { CharacterId, ProjectColors, ProjectFonts } from '@/types'
import type { ParticleKind, SceneLayout } from '@/lib/templateCatalog'
import { fontFamilyValue } from '@/lib/editorPresets'
import { Character, type Mood } from './Character'
import { Particles } from './Particles'

/**
 * ОБЩАЯ ОБОЛОЧКА СЦЕНЫ
 *
 * Все экраны приглашения устроены одинаково: фон, персонаж, вопрос,
 * содержимое. Поэтому оболочка одна, а сцены отвечают только за то,
 * что человек на них делает. Это же даёт бесплатную согласованность:
 * отступы, размеры шрифта и безопасные зоны заданы в одном месте.
 *
 * Высота — 100svh (не vh): на телефоне адресная строка не должна
 * срезать нижнюю кнопку. Внутренние отступы уважают safe-area, поэтому
 * на устройствах с вырезом и жестовой полосой ничего не прилипает к краю.
 *
 * Раскладка приходит из шаблона: center / card / stage. Это не три копии
 * вёрстки, а три набора значений над одной структурой.
 */

interface SceneShellProps {
  colors: ProjectColors
  fonts: ProjectFonts
  layout: SceneLayout
  character: CharacterId
  mood?: Mood
  /** Заголовок сцены. ReactNode — чтобы в редакторе сюда встал EditableText. */
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  /** Всплеск частиц. Меняется значение — происходит залп. */
  burst?: { kind: ParticleKind; key: number } | null
  /** Верхняя строка: кому адресовано приглашение. */
  eyebrow?: ReactNode
}

export const SceneShell = forwardRef<HTMLDivElement, SceneShellProps>(function SceneShell(
  { colors, fonts, layout, character, mood = 'idle', title, subtitle, children, burst, eyebrow },
  ref,
) {
  const headingFf = fontFamilyValue(fonts.heading)
  const bodyFf = fontFamilyValue(fonts.body)
  const card = layout === 'card'
  const stage = layout === 'stage'

  return (
    <div
      ref={ref}
      className="date-scene"
      style={{
        background: colors.background,
        color: colors.text,
        fontFamily: bodyFf,
      }}
    >
      {/* Фон: два мягких пятна света из палитры. Не градиент во весь экран
          и не узор — читаемость текста важнее декора. */}
      <div
        className="date-scene__glow"
        style={{
          background:
            `radial-gradient(58% 46% at 18% 12%, ${colors.primary}2E 0%, transparent 70%),` +
            `radial-gradient(52% 42% at 86% 88%, ${colors.secondary}26 0%, transparent 72%)`,
        }}
      />

      {burst && <Particles kind={burst.kind} colors={colors} burstKey={burst.key} />}

      <div className={`date-scene__inner${card ? ' is-card' : ''}`}
        style={card ? { background: `${colors.accent}D9`, borderColor: `${colors.primary}33` } : undefined}
      >
        {character !== 'none' && (
          <Character
            character={character}
            mood={mood}
            colors={colors}
            size={stage ? 168 : card ? 112 : 132}
            className="date-scene__character"
          />
        )}

        <header className="date-scene__header">
          {eyebrow && (
            <p className="date-scene__eyebrow" style={{ color: colors.primary }}>
              {eyebrow}
            </p>
          )}
          <motion.h1
            className="date-scene__title"
            style={{ fontFamily: headingFf, color: colors.text }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.div
              className="date-scene__subtitle"
              style={{ color: colors.text }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.62, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
            >
              {subtitle}
            </motion.div>
          )}
        </header>

        <motion.div
          className="date-scene__body"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
})
