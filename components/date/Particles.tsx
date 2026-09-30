'use client'
import { useMemo, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import type { ProjectColors } from '@/types'
import type { ParticleKind } from '@/lib/templateCatalog'

/**
 * ЧАСТИЦЫ — РЕАКЦИЯ, А НЕ ФОН
 *
 * Всплеск живёт полторы секунды и исчезает вместе с компонентом. Ничего
 * не крутится постоянно: непрерывное конфетти на фоне — первый признак
 * дешёвого шаблона, и оно мешает читать текст.
 *
 * Частиц немного (24 на всплеск), они не ловят события мыши и не влияют
 * на раскладку: слой абсолютный, поверх сцены, pointer-events: none.
 * При включённом «уменьшить движение» всплеск не показывается вовсе.
 */

const COUNT = 24
const LIFETIME_MS = 1800

interface ParticlesProps {
  kind: ParticleKind
  colors: ProjectColors
  /** Меняется на каждом всплеске: новое значение — новый залп. */
  burstKey: number | string
}

interface Particle {
  id: number
  x: number
  dx: number
  dy: number
  rotate: number
  scale: number
  delay: number
  color: string
}

/**
 * Разброс частиц детерминирован: одно и то же значение burstKey всегда
 * даёт один и тот же залп. Math.random() прямо в рендере вернул бы новые
 * координаты на каждой перерисовке — частицы дёргались бы с места,
 * а в строгом режиме React залп считался бы заново дважды.
 */
function seeded(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(value: number | string): number {
  if (typeof value === 'number') return Math.trunc(value)
  let h = 0
  for (let i = 0; i < value.length; i++) h = (Math.imul(h, 31) + value.charCodeAt(i)) | 0
  return h
}

/** Настройка «уменьшить движение» — внешнее состояние, а не состояние React. */
function subscribeMotionPreference(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Particles({ kind, colors, burstKey }: ParticlesProps) {
  // На сервере считаем, что движение разрешено: иначе разметка при
  // гидратации разошлась бы у всех, кто такую настройку не включал.
  const reduced = useSyncExternalStore(subscribeMotionPreference, prefersReducedMotion, () => false)

  const palette = useMemo(
    () => [colors.primary, colors.secondary, colors.accent],
    [colors.primary, colors.secondary, colors.accent],
  )

  const particles = useMemo<Particle[]>(() => {
    const rand = seeded(hashSeed(burstKey))
    return Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      x: 8 + rand() * 84,
      dx: (rand() - 0.5) * 160,
      dy: -(110 + rand() * 190),
      rotate: (rand() - 0.5) * 220,
      scale: 0.6 + rand() * 0.7,
      delay: rand() * 0.22,
      color: palette[i % palette.length],
    }))
  }, [burstKey, palette])

  if (reduced) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={`${burstKey}-${p.id}`}
          className="absolute"
          style={{ left: `${p.x}%`, bottom: '32%' }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.3, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, p.dy * 0.55, p.dy],
            x: [0, p.dx * 0.6, p.dx],
            scale: [0.3, p.scale, p.scale * 0.9],
            rotate: p.rotate,
          }}
          transition={{ duration: LIFETIME_MS / 1000, delay: p.delay, ease: [0.2, 0.6, 0.3, 1] }}
        >
          <Shape kind={kind} color={p.color} />
        </motion.div>
      ))}
    </div>
  )
}

function Shape({ kind, color }: { kind: ParticleKind; color: string }) {
  if (kind === 'hearts') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
        <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" />
      </svg>
    )
  }
  if (kind === 'sparks') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
        <path d="M12 1l2.2 7.3L21.5 10l-6.2 3.6L16.8 21 12 16.8 7.2 21l1.5-7.4L2.5 10l7.3-1.7z" />
      </svg>
    )
  }
  // confetti — прямоугольные ленточки
  return <div style={{ width: 8, height: 13, borderRadius: 2, background: color }} />
}
