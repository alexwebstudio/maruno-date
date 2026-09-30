'use client'
import { useId } from 'react'
import { motion, type Transition } from 'framer-motion'
import type { CharacterId, ProjectColors } from '@/types'

/**
 * МАСКОТ ПРИГЛАШЕНИЯ
 *
 * Персонаж нарисован вектором прямо здесь, а не подгружается картинкой:
 * так он берёт цвета приглашения, остаётся резким на любом экране и не
 * добавляет ни одного сетевого запроса к первому экрану.
 *
 * Объём даёт не «3D-эмодзи», а мягкое затенение: световой блик сверху,
 * приглушённый ободок снизу и контактная тень под персонажем. Формы
 * остаются плоскими и чистыми — это стилизованный маскот, а не рендер.
 *
 * Набор персонажей — часть конфигурации (CHARACTERS в lib/dateScenario.ts).
 * Добавить нового — значит дописать сюда один компонент и одну строку
 * в списке. Градиенты уникальны на экземпляр (useId), поэтому в каталоге,
 * где маскотов много, они не перетирают друг друга.
 */

export type Mood = 'idle' | 'happy' | 'curious' | 'shy'

interface CharacterProps {
  character: CharacterId
  mood?: Mood
  colors: ProjectColors
  size?: number
  className?: string
}

const float: Transition = { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }

export function Character({ character, mood = 'idle', colors, size = 132, className }: CharacterProps) {
  const uid = useId().replace(/:/g, '')
  if (character === 'none') return null

  const animate =
    mood === 'happy'
      ? { y: [0, -14, 0, -7, 0], rotate: [0, -3, 2, 0] }
      : mood === 'curious'
        ? { y: [0, -5, 0], rotate: [0, 2.5, 0] }
        : { y: [0, -6, 0] }

  const transition: Transition = mood === 'happy' ? { duration: 0.9, ease: 'easeOut' } : float

  const fur = colors.accent
  const line = colors.text
  const blush = colors.primary

  return (
    <motion.div
      className={className}
      style={{
        ['--date-character-size' as string]: `${size}px`,
        width: 'var(--date-character-size)',
        height: 'var(--date-character-size)',
        willChange: 'transform',
      } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.86, y: 10 }}
      animate={{ opacity: 1, scale: 1, ...animate }}
      transition={{ opacity: { duration: 0.45 }, scale: { duration: 0.5, ease: 'backOut' }, ...transition }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 128" width="100%" height="100%" fill="none">
        <defs>
          {/* Блик сверху-слева — главный источник объёма */}
          <radialGradient id={`${uid}-sheen`} cx="38%" cy="30%" r="72%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* Приглушённый ободок снизу — мягкая тень на самой голове */}
          <radialGradient id={`${uid}-rim`} cx="50%" cy="88%" r="60%">
            <stop offset="0" stopColor={line} stopOpacity="0.16" />
            <stop offset="1" stopColor={line} stopOpacity="0" />
          </radialGradient>
          {/* Контактная тень под персонажем */}
          <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={line} stopOpacity="0.26" />
            <stop offset="1" stopColor={line} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx={60} cy={119} rx={30} ry={6} fill={`url(#${uid}-floor)`} />

        <Body character={character} mood={mood} fur={fur} line={line} blush={blush} uid={uid} />
      </svg>
    </motion.div>
  )
}

interface PartProps {
  fur: string
  line: string
  blush: string
  mood: Mood
  uid: string
}

function Body({ character, ...rest }: { character: CharacterId } & PartProps) {
  switch (character) {
    case 'cat': return <Cat {...rest} />
    case 'bear': return <Bear {...rest} />
    case 'fox': return <Fox {...rest} />
    case 'panda': return <Panda {...rest} />
    case 'dog': return <Dog {...rest} />
    default: return <Bunny {...rest} />
  }
}

/** Затенение поверх головы: сначала блик, потом нижний ободок. */
function Shade({ uid }: { uid: string }) {
  return (
    <>
      <ellipse cx={60} cy={68} rx={33} ry={30} fill={`url(#${uid}-sheen)`} pointerEvents="none" />
      <ellipse cx={60} cy={68} rx={33} ry={30} fill={`url(#${uid}-rim)`} pointerEvents="none" />
    </>
  )
}

function Eyes({ line, mood, y = 64, dx = 11 }: { line: string; mood: Mood; y?: number; dx?: number }) {
  if (mood === 'happy') {
    return (
      <g stroke={line} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d={`M ${60 - dx - 5} ${y + 2} q 5 -6 10 0`} />
        <path d={`M ${60 + dx - 5} ${y + 2} q 5 -6 10 0`} />
      </g>
    )
  }
  return (
    <g fill={line}>
      <ellipse cx={60 - dx} cy={y} rx={3.1} ry={mood === 'shy' ? 2.2 : 3.7} />
      <ellipse cx={60 + dx} cy={y} rx={3.1} ry={mood === 'shy' ? 2.2 : 3.7} />
      {/* Световой блик в глазу — оживляет взгляд */}
      <circle cx={60 - dx + 1.1} cy={y - 1.2} r={0.9} fill="#fff" />
      <circle cx={60 + dx + 1.1} cy={y - 1.2} r={0.9} fill="#fff" />
    </g>
  )
}

function Mouth({ line, mood, y = 74 }: { line: string; mood: Mood; y?: number }) {
  const d =
    mood === 'happy' ? `M 52 ${y} q 8 8 16 0`
    : mood === 'shy' ? `M 55 ${y} q 5 3 10 0`
    : `M 55 ${y} q 5 4 10 0`
  return <path d={d} stroke={line} strokeWidth={2.4} strokeLinecap="round" fill="none" />
}

function Blush({ blush, mood, y = 71 }: { blush: string; mood: Mood; y?: number }) {
  const opacity = mood === 'shy' ? 0.55 : mood === 'happy' ? 0.42 : 0.24
  return (
    <g fill={blush} opacity={opacity}>
      <ellipse cx={40} cy={y} rx={6.8} ry={4.2} />
      <ellipse cx={80} cy={y} rx={6.8} ry={4.2} />
    </g>
  )
}

function Bunny({ fur, line, blush, mood, uid }: PartProps) {
  const earLift = mood === 'happy' ? -4 : 0
  return (
    <g>
      <motion.g animate={{ y: earLift }} transition={{ duration: 0.4 }}>
        <ellipse cx={48} cy={30} rx={8} ry={22} fill={fur} stroke={line} strokeWidth={2.2} />
        <ellipse cx={72} cy={30} rx={8} ry={22} fill={fur} stroke={line} strokeWidth={2.2} />
        <ellipse cx={48} cy={31} rx={3.4} ry={14} fill={blush} opacity={0.3} />
        <ellipse cx={72} cy={31} rx={3.4} ry={14} fill={blush} opacity={0.3} />
      </motion.g>
      <ellipse cx={60} cy={68} rx={30} ry={28} fill={fur} stroke={line} strokeWidth={2.4} />
      <Shade uid={uid} />
      <Eyes line={line} mood={mood} />
      <path d="M 57 69 h 6 l -3 3.5 z" fill={blush} />
      <Mouth line={line} mood={mood} y={75} />
      <Blush blush={blush} mood={mood} y={72} />
    </g>
  )
}

function Cat({ fur, line, blush, mood, uid }: PartProps) {
  return (
    <g>
      <path d="M 36 46 L 34 22 L 55 37 Z" fill={fur} stroke={line} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M 84 46 L 86 22 L 65 37 Z" fill={fur} stroke={line} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M 39 41 L 38 29 L 49 37 Z" fill={blush} opacity={0.3} />
      <path d="M 81 41 L 82 29 L 71 37 Z" fill={blush} opacity={0.3} />
      <ellipse cx={60} cy={67} rx={31} ry={28} fill={fur} stroke={line} strokeWidth={2.4} />
      <Shade uid={uid} />
      <Eyes line={line} mood={mood} y={64} dx={12} />
      <path d="M 57 71 h 6 l -3 3 z" fill={blush} />
      <Mouth line={line} mood={mood} y={77} />
      <g stroke={line} strokeWidth={1.6} strokeLinecap="round" opacity={0.6}>
        <path d="M 28 68 h 13" /><path d="M 28 74 h 13" />
        <path d="M 79 68 h 13" /><path d="M 79 74 h 13" />
      </g>
      <Blush blush={blush} mood={mood} y={73} />
    </g>
  )
}

function Bear({ fur, line, blush, mood, uid }: PartProps) {
  return (
    <g>
      <circle cx={38} cy={40} r={12} fill={fur} stroke={line} strokeWidth={2.2} />
      <circle cx={82} cy={40} r={12} fill={fur} stroke={line} strokeWidth={2.2} />
      <circle cx={38} cy={40} r={5.5} fill={blush} opacity={0.32} />
      <circle cx={82} cy={40} r={5.5} fill={blush} opacity={0.32} />
      <ellipse cx={60} cy={68} rx={32} ry={28} fill={fur} stroke={line} strokeWidth={2.4} />
      <Shade uid={uid} />
      <Eyes line={line} mood={mood} y={63} dx={12} />
      <ellipse cx={60} cy={77} rx={13} ry={9.5} fill={blush} opacity={0.2} />
      <ellipse cx={60} cy={72} rx={4.5} ry={3.4} fill={line} />
      <Mouth line={line} mood={mood} y={80} />
      <Blush blush={blush} mood={mood} y={69} />
    </g>
  )
}

function Fox({ fur, line, blush, mood, uid }: PartProps) {
  return (
    <g>
      {/* Острые уши */}
      <path d="M 34 44 L 30 18 L 52 34 Z" fill={fur} stroke={line} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M 86 44 L 90 18 L 68 34 Z" fill={fur} stroke={line} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M 37 38 L 35 25 L 46 34 Z" fill={line} opacity={0.55} />
      <path d="M 83 38 L 85 25 L 74 34 Z" fill={line} opacity={0.55} />
      <ellipse cx={60} cy={66} rx={31} ry={27} fill={fur} stroke={line} strokeWidth={2.4} />
      {/* Белая мордочка-клин */}
      <path d="M 60 92 C 46 92 40 78 42 70 L 78 70 C 80 78 74 92 60 92 Z" fill="#FFF6F0" stroke={line} strokeWidth={1.4} opacity={0.95} />
      <Shade uid={uid} />
      <Eyes line={line} mood={mood} y={62} dx={12} />
      <ellipse cx={60} cy={74} rx={3.6} ry={2.8} fill={line} />
      <Mouth line={line} mood={mood} y={80} />
      <Blush blush={blush} mood={mood} y={70} />
    </g>
  )
}

function Panda({ line, blush, mood, uid }: PartProps) {
  // Панда всегда бело-чёрная — её узнаваемость важнее палитры приглашения
  const black = '#232028'
  return (
    <g>
      <circle cx={36} cy={38} r={11} fill={black} />
      <circle cx={84} cy={38} r={11} fill={black} />
      <ellipse cx={60} cy={68} rx={32} ry={29} fill="#FBF7F5" stroke={line} strokeWidth={2.2} />
      <Shade uid={uid} />
      {/* Чёрные пятна вокруг глаз */}
      <ellipse cx={48} cy={64} rx={8} ry={10} fill={black} transform="rotate(-16 48 64)" />
      <ellipse cx={72} cy={64} rx={8} ry={10} fill={black} transform="rotate(16 72 64)" />
      {mood === 'happy' ? (
        <g stroke="#fff" strokeWidth={2.4} strokeLinecap="round" fill="none">
          <path d="M 43 64 q 5 -5 10 0" /><path d="M 67 64 q 5 -5 10 0" />
        </g>
      ) : (
        <g fill="#fff">
          <circle cx={49} cy={64} r={2.6} /><circle cx={71} cy={64} r={2.6} />
        </g>
      )}
      <ellipse cx={60} cy={74} rx={3.4} ry={2.6} fill={black} />
      <Mouth line={black} mood={mood} y={80} />
      <Blush blush={blush} mood={mood} y={74} />
    </g>
  )
}

function Dog({ fur, line, blush, mood, uid }: PartProps) {
  const earLift = mood === 'happy' ? -3 : 0
  return (
    <g>
      {/* Висячие уши */}
      <motion.g animate={{ y: earLift }} transition={{ duration: 0.4 }}>
        <path d="M 34 46 C 22 44 20 66 30 74 C 38 74 40 56 40 50 Z" fill={line} opacity={0.72} />
        <path d="M 86 46 C 98 44 100 66 90 74 C 82 74 80 56 80 50 Z" fill={line} opacity={0.72} />
      </motion.g>
      <ellipse cx={60} cy={66} rx={30} ry={28} fill={fur} stroke={line} strokeWidth={2.4} />
      {/* Светлое пятно на морде */}
      <ellipse cx={60} cy={76} rx={16} ry={13} fill="#FFF6F0" opacity={0.9} />
      <Shade uid={uid} />
      <Eyes line={line} mood={mood} y={62} dx={11} />
      <ellipse cx={60} cy={72} rx={4.4} ry={3.4} fill={line} />
      <path d="M 60 75 V 80" stroke={line} strokeWidth={2} strokeLinecap="round" />
      <Mouth line={line} mood={mood} y={82} />
      <Blush blush={blush} mood={mood} y={70} />
    </g>
  )
}
