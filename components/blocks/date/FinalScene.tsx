'use client'
import { useState } from 'react'
import { SceneShell } from '@/components/date/SceneShell'
import { EditableInline } from './EditableInline'
import { bool, readCharacter, str, summaryRows } from '@/lib/dateScenario'
import type { ParticleKind, SceneLayout } from '@/lib/templateCatalog'
import type { SceneProps } from './types'

/**
 * ФИНАЛЬНАЯ СЦЕНА
 *
 * Завершение истории: что в итоге договорились. Сводка собирается из
 * самих сцен (lib/dateScenario.ts → summaryRows), а не из отдельного
 * списка настроек: переименовали сцену — подпись в финале изменилась
 * сама, разойтись они не могут.
 *
 * Если человек всё-таки отказался (кнопка «Нет» без побега), показываем
 * отдельный текст, а не праздничный финал с пустой сводкой.
 */
export function FinalScene({ block, colors, fonts, isEditing, onChange, answers, blocks }: SceneProps) {
  const c = block.content
  const set = (k: string, v: string) => onChange({ ...c, [k]: v })
  // Всплеск один, на появлении сцены — не повторяющийся фоновый фейерверк
  const [burstKey] = useState(() => Date.now())

  const refused = answers.ask?.value === 'no'
  const title = refused
    ? str(c.refusedTitle, 'Ладно. Может, в другой раз 🙂')
    : str(c.title, 'Тогда договорились ❤️')
  const subtitle = refused ? str(c.refusedSubtitle) : str(c.subtitle)
  const signature = str(c.signature)
  const showSummary = bool(c.showSummary, true) && !refused
  const character = readCharacter(c)
  const layout = (str(c.layout, 'center') as SceneLayout)
  const particles = (str(c.particles, 'hearts') as ParticleKind)

  const rows = summaryRows(blocks, answers)
  const contacts = [
    { key: 'telegram', label: 'Telegram', value: str(c.telegram), href: (v: string) => `https://t.me/${v.replace(/^@/, '')}` },
    { key: 'whatsapp', label: 'WhatsApp', value: str(c.whatsapp), href: (v: string) => `https://wa.me/${v.replace(/\D/g, '')}` },
    { key: 'instagram', label: 'Instagram', value: str(c.instagram), href: (v: string) => `https://instagram.com/${v.replace(/^@/, '')}` },
    { key: 'phone', label: 'Позвонить', value: str(c.phone), href: (v: string) => `tel:${v.replace(/\s/g, '')}` },
  ].filter((l) => l.value.trim())

  return (
    <SceneShell
      colors={colors}
      fonts={fonts}
      layout={layout}
      character={character}
      mood={refused ? 'shy' : 'happy'}
      burst={refused || isEditing ? null : { kind: particles, key: burstKey }}
      title={
        <EditableInline
          value={title}
          onChange={(v) => set(refused ? 'refusedTitle' : 'title', v)}
          isEditing={isEditing}
          multiline
          placeholder="Финальный текст"
        />
      }
      subtitle={
        subtitle || isEditing ? (
          <EditableInline
            value={subtitle}
            onChange={(v) => set(refused ? 'refusedSubtitle' : 'subtitle', v)}
            isEditing={isEditing}
            multiline
            placeholder="Подпись под финалом (необязательно)"
          />
        ) : null
      }
    >
      {showSummary && rows.length > 0 && (
        <div className="date-summary" style={{ borderColor: `${colors.text}1F`, background: `${colors.accent}59` }}>
          {rows.map((row) => (
            <div
              key={row.key}
              className="date-summary__row"
              style={{ borderBottom: `1px solid ${colors.text}12` }}
            >
              <span className="date-summary__label">{row.label}</span>
              <span className="date-summary__value">
                {row.emoji ? `${row.emoji} ` : ''}{row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* В редакторе ответов ещё нет — показываем автору, как сводка
          будет выглядеть, вместо пустого места. */}
      {isEditing && showSummary && rows.length === 0 && (
        <p style={{ fontSize: 13, opacity: 0.5, margin: 0 }}>
          Здесь появится сводка: что выбрали, когда и где. Она соберётся
          из ваших сцен, когда приглашение откроют.
        </p>
      )}

      {(signature || isEditing) && (
        <p style={{ fontSize: 15, opacity: 0.7, margin: 0 }}>
          <EditableInline
            value={signature}
            onChange={(v) => set('signature', v)}
            isEditing={isEditing}
            placeholder="Подпись: кто зовёт"
          />
        </p>
      )}

      {contacts.length > 0 && (
        <div className="date-chips">
          {contacts.map((l) => (
            <a
              key={l.key}
              href={isEditing ? undefined : l.href(l.value)}
              target="_blank"
              rel="noopener noreferrer"
              className="date-chip"
              style={{
                borderColor: `${colors.primary}55`,
                color: colors.text,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </SceneShell>
  )
}
