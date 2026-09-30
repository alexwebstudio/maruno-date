'use client'
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { BlockData, CharacterId } from '@/types'
import { CHARACTERS, bool, parseOptions, readCharacter, str } from '@/lib/dateScenario'
import { SCENE_META, sceneTitle } from '@/lib/sceneMeta'

/**
 * НАСТРОЙКИ СЦЕНЫ
 *
 * Всё, что нельзя отредактировать прямо на экране: условие показа,
 * поведение убегающей кнопки, подпись в итоговой сводке, контакты
 * на финале.
 *
 * Тексты сюда не вынесены намеренно — заголовки, подзаголовки, подписи
 * кнопок и варианты ответов правятся на самой сцене, там, где автор их
 * видит. Панель нужна для того, что на экране не показывается.
 */
export function SceneSettings({
  open, scene, scenes, onClose, onChange,
}: {
  open: boolean
  scene: BlockData | null
  /** Все сцены — нужны, чтобы собрать условие «показывать, если в сцене X выбрали Y». */
  scenes: BlockData[]
  onClose: () => void
  onChange: (content: BlockData['content']) => void
}) {
  const options = useMemo(() => parseOptions(scene?.content.options), [scene])

  /**
   * Сцены выбора, которые идут РАНЬШЕ текущей. Только на них можно
   * сослаться в условии: ответа на сцену, которая ещё не показана,
   * в момент проверки не существует.
   */
  const sources = useMemo(() => {
    if (!scene) return []
    const order = scene.order
    return scenes
      .filter((s) => s.type === 'date-choice' && s.order < order && str(s.content.key).trim())
      .sort((a, b) => a.order - b.order)
  }, [scene, scenes])

  if (!scene) return null

  const c = scene.content
  const set = (patch: Record<string, string | boolean>) => onChange({ ...c, ...patch })
  const meta = SCENE_META[scene.type]

  const showIf = str(c.showIf).trim()
  const [condKey = '', condValue = ''] = showIf ? showIf.split('=') : []

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 320 }}
            className="relative w-full md:max-w-md bg-white md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '86dvh' }}
          >
            <div className="flex items-center justify-between border-b border-paper-3" style={{ padding: '14px 16px' }}>
              <div className="min-w-0">
                <h2 className="mrn-h3" style={{ fontSize: 16 }}>
                  {meta?.icon} {sceneTitle(scene)}
                </h2>
                <p className="mrn-meta" style={{ marginTop: 2 }}>{meta?.label}</p>
              </div>
              <button onClick={onClose} aria-label="Закрыть настройки сцены" className="mrn-icon-btn flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <div
              className="overflow-y-auto overscroll-contain"
              style={{ padding: 16, maxHeight: 'calc(86dvh - 76px)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
              data-lenis-prevent
            >
              <Field label="Персонаж" hint="Один на всё приглашение — меняется сразу во всех сценах">
                <div className="flex flex-wrap gap-1.5">
                  {CHARACTERS.map((ch) => (
                    <Chip
                      key={ch.id}
                      active={readCharacter(c) === ch.id}
                      onClick={() => set({ character: ch.id as CharacterId })}
                    >
                      {ch.emoji !== '—' && `${ch.emoji} `}{ch.label}
                    </Chip>
                  ))}
                </div>
              </Field>

              {/* Первую сцену показывать по условию нельзя: истории не с чего начаться */}
              {scene.type !== 'date-ask' && (
                <Field
                  label="Когда показывать сцену"
                  hint="Условная сцена появится, только если раньше выбрали нужный вариант"
                >
                  {sources.length === 0 ? (
                    <p className="mrn-meta">
                      Раньше этой сцены нет ни одного выбора, поэтому условие ставить не на что.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Select
                        value={condKey}
                        onChange={(v) => set({ showIf: v ? `${v}=${firstOptionId(scenes, v)}` : '' })}
                        options={[
                          { value: '', label: 'Всегда' },
                          ...sources.map((s) => ({ value: str(s.content.key), label: sceneTitle(s) })),
                        ]}
                      />
                      {condKey && (
                        <Select
                          value={condValue}
                          onChange={(v) => set({ showIf: `${condKey}=${v}` })}
                          options={optionsOf(scenes, condKey).map((o) => ({
                            value: o.id,
                            label: `если выбрали «${o.label}»`,
                          }))}
                        />
                      )}
                    </div>
                  )}
                </Field>
              )}

              {scene.type === 'date-ask' && (
                <>
                  <Field label="Кнопка «Нет» убегает" hint="Выключите, если приглашение должно быть серьёзным">
                    <Toggle value={bool(c.runaway, true)} onChange={(v) => set({ runaway: v })} />
                  </Field>
                  <Field label="Что кнопка говорит, убегая" hint="По одной фразе в строке. Пусто — подпись не меняется">
                    <TextList
                      value={parseList(c.taunts)}
                      onChange={(list) => set({ taunts: JSON.stringify(list) })}
                      placeholder={'Точно?\nПодумай ещё\nНе догонишь'}
                    />
                  </Field>
                </>
              )}

              {scene.type === 'date-choice' && (
                <>
                  <Field label="Подпись в итоговой сводке" hint="Как этот ответ назовут на финальном экране">
                    <Input
                      value={str(c.summaryLabel)}
                      onChange={(v) => set({ summaryLabel: v })}
                      placeholder="Например: Чем займёмся"
                    />
                  </Field>
                  <Field label="Можно вписать свой вариант">
                    <Toggle value={bool(c.allowCustom, false)} onChange={(v) => set({ allowCustom: v })} />
                  </Field>
                  <Field
                    label="Вариант, который уворачивается"
                    hint="Шутка на один экран. Обычно это «Ты» в вопросе про оплату"
                  >
                    <Select
                      value={str(c.runawayOption)}
                      onChange={(v) => set({ runawayOption: v })}
                      options={[
                        { value: '', label: 'Никакой' },
                        ...options.map((o) => ({ value: o.id, label: o.label })),
                      ]}
                    />
                  </Field>
                </>
              )}

              {scene.type === 'date-when' && (
                <Field label="Быстрый выбор времени" hint="По одному значению в строке. Пусто — только поле времени">
                  <TextList
                    value={parseList(c.quickTimes)}
                    onChange={(list) => set({ quickTimes: JSON.stringify(list) })}
                    placeholder={'18:00\n19:00\n20:00'}
                  />
                </Field>
              )}

              {scene.type === 'date-final' && (
                <>
                  <Field label="Показывать сводку ответов">
                    <Toggle value={bool(c.showSummary, true)} onChange={(v) => set({ showSummary: v })} />
                  </Field>
                  <Field label="Если человек отказался" hint="Текст вместо праздничного финала">
                    <Input
                      value={str(c.refusedTitle, 'Ладно. Может, в другой раз 🙂')}
                      onChange={(v) => set({ refusedTitle: v })}
                      placeholder="Ладно. Может, в другой раз"
                    />
                  </Field>
                  <Field label="Как с вами связаться" hint="Появятся кнопками под финалом. Пустые поля не показываются">
                    <div className="flex flex-col gap-2">
                      <Input value={str(c.telegram)} onChange={(v) => set({ telegram: v })} placeholder="Telegram: @username" />
                      <Input value={str(c.whatsapp)} onChange={(v) => set({ whatsapp: v })} placeholder="WhatsApp: +7 777 000 00 00" />
                      <Input value={str(c.instagram)} onChange={(v) => set({ instagram: v })} placeholder="Instagram: username" />
                      <Input value={str(c.phone)} onChange={(v) => set({ phone: v })} placeholder="Телефон: +7 777 000 00 00" />
                    </div>
                  </Field>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function parseList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string')
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function optionsOf(scenes: BlockData[], key: string) {
  const source = scenes.find((s) => str(s.content.key) === key)
  return parseOptions(source?.content.options)
}

function firstOptionId(scenes: BlockData[], key: string): string {
  return optionsOf(scenes, key)[0]?.id ?? ''
}

/* ── мелкие элементы формы ── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: hint ? 2 : 8 }}>{label}</p>
      {hint && <p className="mrn-meta" style={{ marginBottom: 8 }}>{hint}</p>}
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 38, padding: '0 13px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
        border: `1px solid ${active ? 'var(--color-punch)' : 'var(--mrn-line-strong)'}`,
        background: active ? 'var(--color-punch)' : 'transparent',
        color: active ? '#fff' : 'var(--color-ink-600)',
      }}
    >
      {children}
    </button>
  )
}

const controlStyle: React.CSSProperties = {
  width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 12,
  border: '1px solid var(--mrn-line-strong)', background: 'var(--color-paper)',
  fontSize: 14, outline: 'none',
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={controlStyle} />
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={controlStyle}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 52, height: 30, borderRadius: 999, cursor: 'pointer', position: 'relative',
        border: '1px solid var(--mrn-line-strong)',
        background: value ? 'var(--color-punch)' : 'var(--color-paper-2)',
        transition: 'background .2s ease',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 3, left: value ? 25 : 3,
          width: 22, height: 22, borderRadius: 999, background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s ease',
        }}
      />
    </button>
  )
}

function TextList({ value, onChange, placeholder }: {
  value: string[]
  onChange: (list: string[]) => void
  placeholder?: string
}) {
  return (
    <textarea
      value={value.join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))}
      placeholder={placeholder}
      rows={4}
      style={{ ...controlStyle, resize: 'vertical', lineHeight: 1.5 }}
    />
  )
}
