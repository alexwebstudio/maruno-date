'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TemplateCard } from '@/components/landing/TemplateCard'
import { TemplateDemoModal } from '@/components/templates/TemplateDemoModal'
import { SiteFonts } from '@/components/providers/SiteFonts'
import { ACTIVE_TEMPLATES, CATALOG_FONT_FAMILIES, type TemplateEntry } from '@/lib/templateCatalog'

/** Крупные карточки: четыре на страницу помещаются в две пары без тесноты. */
const PAGE_SIZE = 4

/**
 * КАТАЛОГ ШАБЛОНОВ /templates
 *
 * Две карточки в ряд на десктопе, одна — на телефоне, реальная пагинация
 * по четыре штуки. Переключение страниц — это состояние компонента, а не
 * переход: без перезагрузки, без скачка вёрстки (у превью фиксированная
 * пропорция, поэтому обе страницы одинаковой высоты), с плавным
 * проявлением. Добавятся шаблоны — появятся страницы 3, 4, 5 сами.
 */
export function TemplateCatalog({ templateHref }: { templateHref: (id: string) => string }) {
  const [page, setPage] = useState(0)
  const [demo, setDemo] = useState<TemplateEntry | null>(null)

  const pageCount = Math.max(1, Math.ceil(ACTIVE_TEMPLATES.length / PAGE_SIZE))
  const current = useMemo(
    () => ACTIVE_TEMPLATES.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [page],
  )

  const go = (next: number) => setPage(Math.min(Math.max(next, 0), pageCount - 1))

  return (
    <section className="mrn-section" style={{ background: 'var(--color-paper)' }}>
      <SiteFonts families={CATALOG_FONT_FAMILIES} />

      <div className="mrn-container">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7"
          >
            {current.map((tpl, i) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                href={templateHref(tpl.id)}
                lead
                ratio="4 / 3"
                onDemo={setDemo}
                eager={i < 2}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {pageCount > 1 && (
          <nav className="mrn-pager" aria-label="Страницы каталога">
            <button
              type="button"
              className="mrn-pager__arrow"
              onClick={() => go(page - 1)}
              disabled={page === 0}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="mrn-pager__pages">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`mrn-pager__page${i === page ? ' is-active' : ''}`}
                  aria-current={i === page ? 'page' : undefined}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="mrn-pager__arrow"
              onClick={() => go(page + 1)}
              disabled={page === pageCount - 1}
              aria-label="Следующая страница"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </div>

      <TemplateDemoModal
        template={demo}
        onClose={() => setDemo(null)}
        href={demo ? templateHref(demo.id) : undefined}
      />
    </section>
  )
}
