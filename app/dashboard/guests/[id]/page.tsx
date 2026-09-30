'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw, Trash2, Users, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'
import { getProjectById } from '@/lib/projects'
import {
  getGuestResponses, summarize, deleteGuestResponse, formatAnsweredAt, toCsv,
  DELIVERY_LABELS, setRsvpDelivery, DEFAULT_RSVP_DELIVERY,
  type GuestResponse, type RsvpDelivery,
} from '@/lib/guests'
import type { Project } from '@/types'

/**
 * ОТВЕТЫ НА ОДНО ПРИГЛАШЕНИЕ
 *
 * Открывается из карточки приглашения в кабинете. Общего списка «все
 * ответы пользователя» нет: ответы принадлежат конкретному приглашению.
 *
 * Это не CRM: сводка, список, выгрузка и удаление случайной записи —
 * всё, что нужно человеку, который отправил одну ссылку.
 */
export default function GuestsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const projectId = String(params?.id ?? '')

  const [project, setProject] = useState<Project | null>(null)
  const [list, setList] = useState<GuestResponse[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorText, setErrorText] = useState('')
  const [delivery, setDelivery] = useState<RsvpDelivery>(DEFAULT_RSVP_DELIVERY)
  const [savingDelivery, setSavingDelivery] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setState('loading')
    try {
      const [p, responses] = await Promise.all([
        getProjectById(projectId),
        getGuestResponses(projectId),
      ])
      setProject(p)
      setDelivery((p?.rsvp_delivery as RsvpDelivery) ?? DEFAULT_RSVP_DELIVERY)
      setList(responses)
      setState('ready')
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : 'Не удалось загрузить ответы')
      setState('error')
    }
  }, [projectId])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/auth/login'); return }
    load()
  }, [authLoading, user, load, router])

  const stats = summarize(list)

  const changeDelivery = async (next: RsvpDelivery) => {
    const prev = delivery
    setDelivery(next)          // отвечаем сразу, чтобы переключатель не «залипал»
    setSavingDelivery(true)
    try {
      await setRsvpDelivery(projectId, next)
      toast.success('Способ получения ответов сохранён')
    } catch (e) {
      setDelivery(prev)        // не получилось — возвращаем как было
      toast.error(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setSavingDelivery(false)
    }
  }

  const removeResponse = async (r: GuestResponse) => {
    if (!confirm(`Удалить ответ «${r.name}»? Это действие нельзя отменить.`)) return
    try {
      await deleteGuestResponse(r.id)
      setList((v) => v.filter((x) => x.id !== r.id))
      toast.success('Ответ удалён')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось удалить ответ')
    }
  }

  const download = () => {
    // Внутри Excel кириллица без BOM превращается в кракозябры
    const blob = new Blob(['\uFEFF' + toCsv(list)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guests-${project?.slug ?? projectId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading || state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <span className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-paper-3)', borderTopColor: 'var(--color-punch)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <div className="mrn-container" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-ink-400)' }}>
          <ArrowLeft size={15} /> Мои сайты
        </Link>

        <header style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p className="mrn-eyebrow">Ответы</p>
            <h1 className="mrn-h2" style={{ marginTop: 10 }}>{project?.title ?? 'Приглашение'}</h1>
          </div>

          <div className="mrn-actions">
            <button onClick={load} className="mrn-btn mrn-btn--sm mrn-btn--ghost">
              <RefreshCw size={15} /> Обновить
            </button>
            <button onClick={download} disabled={!list.length} className="mrn-btn mrn-btn--sm mrn-btn--secondary">
              <Download size={15} /> Скачать ответы
            </button>
          </div>
        </header>

        {state === 'error' && (
          <div className="mrn-raised" style={{ marginTop: 24, padding: 20, borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--color-punch)', fontSize: 14.5 }}>Не удалось загрузить ответы: {errorText}</p>
            <button onClick={load} className="mrn-btn mrn-btn--sm mrn-btn--secondary" style={{ marginTop: 14 }}>
              Попробовать снова
            </button>
          </div>
        )}

        {state === 'ready' && (
          <>
            {/* Сводка: три числа, ради которых сюда и заходят */}
            <div
              style={{
                marginTop: 26,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--gap-grid)',
              }}
            >
              <StatCard label="ответов" value={stats.responses} icon={<Users size={15} />} />
              <StatCard label="согласий" value={stats.attending} accent="var(--color-punch)" icon={<Check size={15} />} />
              <StatCard label="отказов" value={stats.declined} icon={<X size={15} />} />
            </div>

            {/* Способ получения ответов — рядом со списком, а не в общих
                настройках аккаунта: настройка принадлежит этому приглашению */}
            <section className="mrn-raised" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
              <h2 className="mrn-h3" style={{ fontSize: 17 }}>Куда приходят ответы</h2>
              <p className="mrn-meta" style={{ marginTop: 6 }}>
                Настройка действует только для этого приглашения.
              </p>

              <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                {(Object.keys(DELIVERY_LABELS) as RsvpDelivery[]).map((key) => {
                  const active = delivery === key
                  return (
                    <button
                      key={key}
                      onClick={() => changeDelivery(key)}
                      disabled={savingDelivery}
                      style={{
                        textAlign: 'left', cursor: 'pointer',
                        padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${active ? 'var(--color-punch)' : 'var(--mrn-line)'}`,
                        background: active ? 'rgba(228,69,31,.06)' : 'transparent',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: 16, height: 16, borderRadius: 999, flexShrink: 0,
                            border: `1px solid ${active ? 'var(--color-punch)' : 'var(--mrn-line-strong)'}`,
                            background: active
                              ? 'radial-gradient(circle, var(--color-punch) 0 45%, transparent 46%)'
                              : 'transparent',
                          }}
                        />
                        <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--color-ink)' }}>
                          {DELIVERY_LABELS[key].title}
                        </span>
                      </span>
                      <span style={{ display: 'block', marginTop: 6, marginLeft: 26, fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-ink-400)' }}>
                        {DELIVERY_LABELS[key].hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Список ответов */}
            <section style={{ marginTop: 'var(--space-8)' }}>
              <h2 className="mrn-h3" style={{ fontSize: 17, marginBottom: 14 }}>Ответы</h2>

              {list.length === 0 ? (
                <div className="mrn-raised" style={{ padding: 'var(--space-8) var(--space-5)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <p style={{ fontSize: 15, color: 'var(--color-ink-600)' }}>Пока никто не ответил.</p>
                  <p className="mrn-meta" style={{ marginTop: 8 }}>
                    {project?.published
                      ? 'Отправьте ссылку — ответ появится здесь, как только приглашение пройдут до конца.'
                      : 'Опубликуйте приглашение и отправьте ссылку — ответ появится здесь.'}
                  </p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                  {list.map((r) => (
                    <li
                      key={r.id}
                      className="mrn-raised"
                      style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span
                          style={{
                            flexShrink: 0, marginTop: 2,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 26, height: 26, borderRadius: 999,
                            background: r.attending === 'yes' ? 'var(--color-punch)' : 'var(--color-paper-3)',
                            color: r.attending === 'yes' ? '#fff' : 'var(--color-ink-600)',
                          }}
                          aria-hidden="true"
                        >
                          {r.attending === 'yes' ? <Check size={14} /> : <X size={14} />}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>{r.name}</p>
                          <p className="mrn-meta" style={{ marginTop: 3 }}>
                            {r.attending === 'yes' ? 'Согласие' : 'Отказ'}
                            {' · '}
                            {formatAnsweredAt(r.created_at)}
                          </p>

                          {r.comment && (
                            <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-600)' }}>
                              {r.comment}
                            </p>
                          )}

                          {/* Что именно выбрали в сценарии */}
                          {Object.keys(r.extra).length > 0 && (
                            <dl style={{ marginTop: 10, display: 'grid', gap: 4 }}>
                              {Object.entries(r.extra).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                                  <dt style={{ color: 'var(--color-ink-400)' }}>{k}:</dt>
                                  <dd style={{ color: 'var(--color-ink-600)', margin: 0 }}>{v}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>

                        <button
                          onClick={() => removeResponse(r)}
                          aria-label={`Удалить ответ ${r.name}`}
                          className="mrn-icon-btn"
                          style={{ flexShrink: 0 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent, icon }: {
  label: string
  value: number
  accent?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="mrn-raised" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--color-ink-400)' }}>
        {icon}
        <span className="mrn-meta">{label}</span>
      </span>
      <p
        className="mrn-figure"
        style={{ marginTop: 10, fontSize: 34, color: accent ?? 'var(--color-ink)' }}
      >
        {value}
      </p>
    </div>
  )
}
