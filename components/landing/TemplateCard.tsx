'use client'

import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'
import { TemplatePreview } from '@/components/templates/TemplatePreview'
import type { TemplateEntry } from '@/lib/templateCatalog'

interface TemplateCardProps {
  template: TemplateEntry
  href: string
  /** Крупная карточка: показывает полное описание и состав сценария. */
  lead?: boolean
  ratio?: string
  /** Открыть демо шаблона. Если не передан — кнопка не показывается. */
  onDemo?: (template: TemplateEntry) => void
  eager?: boolean
}

/** Точки палитры — по ним виден характер шаблона до открытия. */
function Palette({ template }: { template: TemplateEntry }) {
  const { background, accent, primary, text } = template.colors
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {[background, accent, primary, text].map((c, i) => (
        <span key={i} className="mrn-swatch" style={{ background: c }} />
      ))}
    </span>
  )
}

/**
 * КАРТОЧКА СЦЕНАРИЯ
 *
 * Превью занимает всю карточку, а подпись лежит поверх него на тёмной
 * подложке. Так карточка перестаёт быть «белым прямоугольником с картинкой
 * сверху» — видно, что внутри настоящий экран приглашения, а не иллюстрация.
 *
 * На десктопе при наведении подпись поднимается и открывает описание,
 * превью чуть приближается. На тач-устройствах hover не существует, поэтому
 * описание там показано сразу — интерфейс не прячет смысл за жестом,
 * которого нет.
 */
export function TemplateCard({ template, href, lead = false, ratio, onDemo, eager }: TemplateCardProps) {
  return (
    <article className={`mrn-tpl-card ${lead ? 'mrn-tpl-card--lead' : ''}`}>
      <TemplatePreview
        template={template}
        ratio={ratio ?? (lead ? '4 / 3' : '3 / 4')}
        className="mrn-tpl-card__preview"
        eager={eager}
      />

      {/* Полупрозрачный слой: появляется при наведении и приглушает кадр,
          чтобы поднявшийся текст читался поверх любого сценария */}
      <span className="mrn-tpl-card__veil" aria-hidden="true" />

      {/* Подпись поверх превью. Градиент здесь работает не как украшение,
          а как читаемость: без затемнения белый текст пропадает на светлых
          сценариях вроде «Одной свечи». */}
      <div className="mrn-tpl-card__meta">
        <div className="flex items-start justify-between gap-3">
          <h3 className="mrn-tpl-card__name">{template.name}</h3>
          <span className="mrn-tpl-card__badge">{template.formality}</span>
        </div>

        <p className="mrn-tpl-card__tagline">{template.tagline}</p>

        {/* Раскрывается по наведению на десктопе, на тач-устройствах видно сразу */}
        <div className="mrn-tpl-card__more">
          {lead && <p className="mrn-tpl-card__desc">{template.description}</p>}

          <div className="mrn-tpl-card__row">
            <Palette template={template} />
            <span className="mrn-tpl-card__fonts">
              {template.fonts.heading} · {template.fonts.body}
            </span>
          </div>

          <div className="mrn-tpl-card__actions">
            {onDemo && (
              <button
                type="button"
                onClick={() => onDemo(template)}
                className="mrn-tpl-card__demo mrn-above"
              >
                <Eye size={15} aria-hidden="true" /> Демо
              </button>
            )}
            {/* Растянутая ссылка делает кликабельной всю карточку */}
            <Link href={href} className="mrn-stretch mrn-tpl-card__pick">
              Выбрать <ArrowRight size={15} aria-hidden="true" />
              <span className="mrn-sr">— шаблон «{template.name}»</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
