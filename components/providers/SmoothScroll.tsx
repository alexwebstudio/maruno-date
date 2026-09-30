'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Плавный скролл на мобильных и десктопе, синхронизированный с ScrollTrigger.
 *
 * Раньше Lenis выключался на всём /dashboard — заодно и в «Моих сайтах»,
 * хотя это обычная страница со списком, и там плавная прокрутка нужна
 * ровно так же, как на лендинге.
 *
 * Выключаем только редактор: он состоит из вложенных скролл-контейнеров
 * (холст, боковая панель, листы настроек), а Lenis перехватывает колесо
 * глобально и ломает их. Отдельные внутренние области на остальных
 * страницах защищены атрибутом data-lenis-prevent.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isEditor = pathname?.startsWith('/dashboard/edit')

  useEffect(() => {
    // В редакторе — только нативный скролл вложенных панелей.
    if (isEditor) return

    // Уважаем системную настройку «уменьшить движение»
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      /*
       * На телефоне инерцию считает сам браузер, и он делает это лучше:
       * при smoothTouch прокрутка «плывёт» и отстаёт от пальца.
       * Поэтому тач отдаём системе, а смузим только колесо мыши.
       */
      syncTouch: false,
      touchMultiplier: 1.2,
      // Не смузим элементы, помеченные data-lenis-prevent (внутренние скроллы)
      prevent: (node) => node.hasAttribute?.('data-lenis-prevent'),
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      // После ухода со страницы позиции триггеров пересчитываются заново
      ScrollTrigger.refresh()
    }
  }, [isEditor])

  return <>{children}</>
}
