'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DateSite } from '@/components/templates/DateSite'
import { demoProject } from '@/lib/demoProject'
import type { TemplateEntry } from '@/lib/templateCatalog'

/** Ширина «десктопной» сцены. Реальный кадр масштабируется под карточку. */
const DESKTOP_W = 1280
const DESKTOP_H = 800

interface TemplatePreviewProps {
  template: TemplateEntry
  /** Пропорция карточки. Разная высота — часть редакционной сетки каталога. */
  ratio?: string
  /** mobile — вьюпорт равен карточке; desktop — кадр 1280×800, вписанный в карточку. */
  viewport?: 'mobile' | 'desktop'
  /** Не ждать появления в зоне видимости (первый экран, модальное окно). */
  eager?: boolean
  /**
   * full — живое демо: сценарий действительно проходится, кнопка «Нет»
   * убегает, сцены сменяются. Статичная картинка не показала бы главного.
   * hero — только первый экран: карточке в каталоге большего не нужно.
   */
  depth?: 'hero' | 'full'
  className?: string
}

/**
 * Живое превью шаблона.
 *
 * Рендерится настоящая первая сцена с теми же цветами, шрифтами и текстами,
 * которые получит автор после создания приглашения, — источник один,
 * lib/templateCatalog.
 *
 * Почему iframe, а не div: блоки используют единицы vw, 100vh и брейкпоинты.
 * В обычном div они считались бы от ширины реального окна, и имена вылезали бы
 * за края карточки. У iframe свой вьюпорт — видно ровно то, что увидит гость.
 *
 * Пока сцена не готова, показывается скелетон: высота карточки задана заранее
 * через aspect-ratio, поэтому макет не прыгает.
 */
export function TemplatePreview({
  template,
  ratio = '3 / 4',
  viewport = 'mobile',
  eager = false,
  depth = 'hero',
  className = '',
}: TemplatePreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const [mounted, setMounted] = useState(eager)
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [scale, setScale] = useState(1)

  const isDesktop = viewport === 'desktop'

  /*
   * Демо собирается тем же кодом, что и настоящее приглашение
   * (lib/demoProject.ts → getDefaultBlocks). Поэтому предпросмотр не может
   * разойтись с результатом: человек видит ровно тот сценарий, который получит.
   */
  const project = useMemo(() => demoProject(template), [template])

  // Сцену создаём только когда карточка подходит к экрану — иначе на странице
  // одновременно поднимались бы все превью сразу.
  useEffect(() => {
    if (mounted) return
    const el = wrapRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mounted])

  // Десктопный кадр вписываем в ширину карточки
  useEffect(() => {
    if (!isDesktop) return
    const el = wrapRef.current
    if (!el) return

    const update = () => setScale(el.clientWidth / DESKTOP_W)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [isDesktop])

  // Переносим стили страницы внутрь iframe и ждём готовности шрифтов
  useEffect(() => {
    if (!mounted) return

    const frame = frameRef.current
    const doc = frame?.contentDocument
    if (!doc) { setFailed(true); return }

    let cancelled = false

    const sync = () => {
      try {
        // Ссылки на те же файлы стилей: браузер отдаёт их из кэша,
        // инлайновые копии не дублируются в каждом превью.
        document.head
          .querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]')
          .forEach((node) => doc.head.appendChild(node.cloneNode(true)))

        // Блоки анимируют появление через framer-motion. В отдельном документе
        // iframe этот таймлайн не доигрывается и застывает на середине.
        // Превью статично по замыслу, поэтому входные анимации гасим:
        // инлайновые opacity/transform ставит только framer-motion.
        // В карточке каталога сцена статична: там показан один кадр, и
        // застывшая на середине анимация выглядела бы ошибкой вёрстки.
        // В живом демо анимации, наоборот, и есть предмет показа.
        if (depth === 'hero') {
          const reset = doc.createElement('style')
          reset.textContent =
            '[style*="opacity"]{opacity:1 !important}[style*="transform"]{transform:none !important}'
          doc.head.appendChild(reset)
        }

        // Переменные шрифтов next/font живут классами на <html>
        doc.documentElement.className = document.documentElement.className
        doc.body.style.margin = '0'
        // Приглашение показывает один экран за раз — прокрутка не нужна
        // ни в карточке, ни в живом демо.
        doc.body.style.overflow = 'hidden'

        setBody(doc.body)

        // Показываем сцену только когда шрифты внутри готовы, иначе превью
        // сначала моргает подменной гарнитурой.
        const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts
        if (fonts?.ready) {
          fonts.ready.then(() => { if (!cancelled) setReady(true) })
          // Страховка на случай, если шрифт не отдастся вовсе
          window.setTimeout(() => { if (!cancelled) setReady(true) }, 2500)
        } else {
          setReady(true)
        }
      } catch {
        setFailed(true)
      }
    }

    if (doc.readyState === 'complete') sync()
    else frame?.addEventListener('load', sync, { once: true })

    return () => {
      cancelled = true
      frame?.removeEventListener('load', sync)
    }
  }, [mounted, depth])

  const stageStyle = isDesktop
    ? {
        width: DESKTOP_W,
        height: DESKTOP_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        inset: 'auto',
        top: 0,
        left: 0,
      }
    : undefined

  return (
    <div
      ref={wrapRef}
      className={`mrn-preview ${className}`}
      style={{ aspectRatio: isDesktop ? `${DESKTOP_W} / ${DESKTOP_H}` : ratio }}
      data-ready={ready}
      data-depth={depth}
      aria-hidden={depth === 'hero' ? 'true' : undefined}
    >
      <span className="mrn-skeleton" />

      {mounted && !failed && (
        <iframe
          ref={frameRef}
          title={depth === 'full' ? `Демо шаблона «${template.name}»` : ''}
          tabIndex={depth === 'full' ? 0 : -1}
          aria-hidden={depth === 'hero' ? 'true' : undefined}
          className="mrn-preview-stage"
          style={stageStyle}
        />
      )}

      {body && createPortal(
        <DateSite
          project={project}
          isEditing={false}
          // Демо ничего не сохраняет: ответ уходит автору только
          // с опубликованного приглашения.
          live={false}
        />,
        body,
      )}

      {/* Если сцена не поднялась, карточка всё равно осмысленна */}
      {failed && (
        <div
          className="mrn-preview-fallback"
          style={{ background: template.colors.background, color: template.colors.text }}
        >
          <span style={{ fontFamily: `'${template.fonts.heading}', sans-serif`, fontSize: 19, lineHeight: 1.2 }}>
            {template.demo.question}
          </span>
          <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
            {template.name}
          </span>
        </div>
      )}
    </div>
  )
}
