'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * УБЕГАЮЩАЯ КНОПКА
 *
 * Главная механика первого экрана. Три требования, из которых выросла
 * вся реализация:
 *
 * 1. Кнопка не должна ломать раскладку и не должна порождать
 *    горизонтальную прокрутку. Поэтому она НИКОГДА не покидает поток
 *    документа: место под неё остаётся на месте, а «побег» — это только
 *    `transform: translate()`. Трансформация не влияет на размеры
 *    страницы физически, поэтому появление скролла исключено, а не
 *    «замаскировано» через overflow: hidden.
 *
 * 2. Кнопка не должна уйти за экран. Сдвиг считается от реальных границ
 *    контейнера сцены и собственного размера кнопки, с полем в 12px.
 *    Пересчитывается при изменении размера окна — поворот телефона
 *    не оставит кнопку за краем.
 *
 * 3. Механика должна работать пальцем. На тачскрине нет наведения,
 *    поэтому побег запускается на pointerdown и нажатие гасится: палец
 *    не успевает «поймать» кнопку, но и промахнуться мимо экрана она
 *    не может. На мыши срабатывает наведение — так привычнее.
 *
 * Раздражения тут ровно столько, сколько задумано: кнопка чуть уменьшается
 * после нескольких попыток и меняет подпись, но остаётся видимой и
 * доступной для пальца (минимальная цель — 44px).
 */

interface RunawayButtonProps {
  label: string
  /** Подписи, которыми кнопка дразнит при побеге. Пустой список — подпись не меняется. */
  taunts?: string[]
  /**
   * Что стоит перед подписью — например, эмодзи варианта ответа.
   * Без этого убегающий вариант выглядел бы в списке чужим:
   * у соседей эмодзи есть, а у него нет.
   */
  prefix?: React.ReactNode
  /** Границы, за которые нельзя выходить. Обычно — элемент сцены. */
  boundsRef: React.RefObject<HTMLElement | null>
  /** Побег включён. Выключенная кнопка ведёт себя как обычная. */
  enabled?: boolean
  /** Нажатие, если побег выключен. */
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

/** Поле между кнопкой и краем сцены. */
const EDGE = 12
/** Минимальное расстояние прыжка — иначе побег незаметен. */
const MIN_JUMP = 90

export function RunawayButton({
  label,
  taunts = [],
  prefix,
  boundsRef,
  enabled = true,
  onClick,
  className,
  style,
}: RunawayButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [attempts, setAttempts] = useState(0)
  // Гасит «двойной побег»: pointerdown и click подряд по одной кнопке
  const lastEscape = useRef(0)

  /*
   * Подпись вычисляется из числа попыток, а не хранится отдельным
   * состоянием. Иначе её пришлось бы синхронизировать с label эффектом —
   * и правка подписи в редакторе не доезжала бы до кнопки до перезагрузки.
   */
  const text = attempts > 0 && taunts.length
    ? taunts[(attempts - 1) % taunts.length]
    : label

  // Поворот экрана или смена размера окна могли оставить кнопку за краем —
  // возвращаем её на место, а не пытаемся пересчитать старый сдвиг.
  useEffect(() => {
    if (!enabled) return
    const onResize = () => setOffset({ x: 0, y: 0 })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [enabled])

  const escape = useCallback(() => {
    const btn = btnRef.current
    const bounds = boundsRef.current
    if (!btn || !bounds) return

    const now = Date.now()
    if (now - lastEscape.current < 180) return
    lastEscape.current = now

    const b = bounds.getBoundingClientRect()
    const r = btn.getBoundingClientRect()

    // Куда кнопка может уехать от своего места в потоке, оставаясь целиком внутри сцены
    const homeLeft = r.left - offset.x
    const homeTop = r.top - offset.y
    const minX = b.left + EDGE - homeLeft
    const maxX = b.right - EDGE - r.width - homeLeft
    const minY = b.top + EDGE - homeTop
    const maxY = b.bottom - EDGE - r.height - homeTop

    // Сцена уже настолько тесная, что двигаться некуда — не дёргаем кнопку зря
    if (maxX <= minX && maxY <= minY) return

    const pick = (min: number, max: number) => (max <= min ? min : min + Math.random() * (max - min))

    let next = { x: pick(minX, maxX), y: pick(minY, maxY) }
    // Прыжок должен быть заметным: пара попыток найти точку подальше
    for (let i = 0; i < 6; i++) {
      const dist = Math.hypot(next.x - offset.x, next.y - offset.y)
      if (dist >= MIN_JUMP) break
      next = { x: pick(minX, maxX), y: pick(minY, maxY) }
    }

    setOffset(next)
    setAttempts((a) => a + 1)
  }, [boundsRef, offset.x, offset.y])

  if (!enabled) {
    return (
      <button ref={btnRef} type="button" onClick={onClick} className={className} style={style}>
        {prefix}
        {prefix ? <span style={{ flex: 1 }}>{label}</span> : label}
      </button>
    )
  }

  // Уменьшается постепенно и не бесконечно: 44px — минимальная цель для пальца,
  // а кнопка, которую невозможно увидеть, перестаёт быть шуткой.
  const scale = attempts >= 6 ? 0.82 : attempts >= 3 ? 0.91 : 1

  return (
    <motion.button
      ref={btnRef}
      type="button"
      aria-label={`${label} — эта кнопка убегает`}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') escape() }}
      onPointerDown={(e) => { e.preventDefault(); escape() }}
      onClick={(e) => { e.preventDefault(); escape() }}
      onFocus={() => escape()}
      className={className}
      style={{ ...style, position: 'relative', zIndex: 6, touchAction: 'manipulation' }}
      animate={{ x: offset.x, y: offset.y, scale }}
      transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.6 }}
    >
      {prefix}
      {prefix ? <span style={{ flex: 1 }}>{text}</span> : text}
    </motion.button>
  )
}
