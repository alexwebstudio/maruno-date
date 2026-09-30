'use client'

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Задержка внутри группы — для мягкого каскада секций. */
  delay?: number
  as?: ElementType
  className?: string
  style?: CSSProperties
  id?: string
}

/**
 * Единственная скролл-анимация проекта: мягкое появление секции.
 *
 * Раньше это делал GSAP + ScrollTrigger с отдельным контекстом на всю страницу.
 * IntersectionObserver даёт тот же результат без работы в каждом кадре,
 * срабатывает один раз и полностью отключается при prefers-reduced-motion
 * (правило в globals.css).
 */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', style, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Настройка «уменьшить движение» обрабатывается в CSS (globals.css):
    // там .mrn-reveal сразу видим, поэтому здесь ничего проверять не нужно.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      id={id}
      className={`mrn-reveal ${className}`}
      data-shown={shown}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  )
}
