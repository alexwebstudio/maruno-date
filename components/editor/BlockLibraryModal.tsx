'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, GitBranch } from 'lucide-react'
import type { ProjectColors, ProjectFonts } from '@/types'
import { BLOCK_CATALOG, CATEGORIES, type BlockCategory, type CatalogItem } from '@/lib/blockLibrary'
import { parseOptions, str } from '@/lib/dateScenario'

/**
 * БИБЛИОТЕКА СЦЕН
 *
 * Витрина заготовок: автор выбирает сцену и она встаёт в конец сценария.
 * Карточка показывает вопрос и первые варианты ответа — то есть ровно то,
 * что человек получит, а не абстрактное имя компонента.
 *
 * Раздела «Premium» здесь нет: все сцены добавляются одинаково.
 */
export function BlockLibraryModal({
  open, colors, fonts, onClose, onAdd,
}: {
  open: boolean
  colors: ProjectColors
  fonts: ProjectFonts
  onClose: () => void
  onAdd: (item: CatalogItem) => void
}) {
  const [category, setCategory] = useState<BlockCategory | 'all'>('all')

  const items = category === 'all'
    ? BLOCK_CATALOG
    : BLOCK_CATALOG.filter((i) => i.category === category)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 34, stiffness: 320 }}
            className="relative w-full md:max-w-2xl bg-white md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '86dvh' }}
          >
            <div
              className="flex items-center justify-between border-b border-paper-3"
              style={{ padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))' }}
            >
              <div>
                <h2 className="mrn-h3" style={{ fontSize: 17 }}>Добавить сцену</h2>
                <p className="mrn-meta" style={{ marginTop: 2 }}>
                  Сцена встанет в конец сценария — порядок можно поменять
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Закрыть библиотеку сцен"
                className="mrn-icon-btn flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-paper-3" style={{ padding: '10px 16px' }}>
              {([{ id: 'all', label: 'Все', icon: '✳️' }, ...CATEGORIES] as const).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as BlockCategory | 'all')}
                  className="flex-shrink-0 transition-colors"
                  style={{
                    minHeight: 36, padding: '0 13px', borderRadius: 999, fontSize: 13,
                    whiteSpace: 'nowrap', cursor: 'pointer',
                    border: `1px solid ${category === c.id ? 'var(--color-punch)' : 'var(--mrn-line-strong)'}`,
                    background: category === c.id ? 'var(--color-punch)' : 'transparent',
                    color: category === c.id ? '#fff' : 'var(--color-ink-600)',
                  }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <div
              className="overflow-y-auto overscroll-contain grid grid-cols-1 sm:grid-cols-2 gap-3"
              style={{ padding: 16, maxHeight: 'calc(86dvh - 150px)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
              data-lenis-prevent
            >
              {items.map((item) => (
                <SceneCard key={item.id} item={item} colors={colors} fonts={fonts} onAdd={() => { onAdd(item); onClose() }} />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function SceneCard({
  item, colors, fonts, onAdd,
}: {
  item: CatalogItem
  colors: ProjectColors
  fonts: ProjectFonts
  onAdd: () => void
}) {
  const options = parseOptions(item.content.options)
  const question = str(item.content.question) || str(item.content.title)
  const conditional = Boolean(str(item.content.showIf).trim())

  return (
    <button
      onClick={onAdd}
      className="text-left transition-all"
      style={{
        border: '1px solid var(--mrn-line)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--color-paper)',
        cursor: 'pointer',
      }}
    >
      {/* Мини-превью в палитре приглашения: видно, как сцена будет выглядеть */}
      <div
        style={{
          padding: '18px 16px',
          background: colors.background,
          color: colors.text,
          borderBottom: '1px solid var(--mrn-line)',
        }}
      >
        <p
          style={{
            fontFamily: `'${fonts.heading}', sans-serif`,
            fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.25,
          }}
        >
          {question}
        </p>
        {options.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {options.slice(0, 3).map((o) => (
              <span
                key={o.id}
                style={{
                  fontSize: 11.5, padding: '4px 9px', borderRadius: 999,
                  border: `1px solid ${colors.text}22`, opacity: 0.8,
                }}
              >
                {o.emoji} {o.label}
              </span>
            ))}
            {options.length > 3 && (
              <span style={{ fontSize: 11.5, opacity: 0.5, alignSelf: 'center' }}>
                +{options.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
          <Plus size={15} style={{ color: 'var(--color-punch)', flexShrink: 0 }} />
        </div>
        <p className="mrn-meta" style={{ marginTop: 4 }}>{item.desc}</p>
        {conditional && (
          <span
            className="inline-flex items-center gap-1"
            style={{ marginTop: 8, fontSize: 11.5, color: 'var(--color-ink-400)' }}
          >
            <GitBranch size={12} /> условная сцена
          </span>
        )}
      </div>
    </button>
  )
}
