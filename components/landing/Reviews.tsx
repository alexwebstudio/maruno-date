'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Star, X, Lock, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/hooks/useAuth'
import { uploadMedia } from '@/lib/projects'
import { submitReview, getApprovedReviews, type ReviewRow } from '@/app/actions/reviews'
import { Reveal } from './Reveal'

/*
 * Заготовленных отзывов здесь нет намеренно.
 *
 * У направления Date ещё не было ни одного пользователя, поэтому любые
 * «примеры отзывов» были бы выдуманными от имени несуществующих людей.
 * Пока база пуста, раздел честно предлагает стать первым — это хуже
 * выглядит и лучше работает, чем пять придуманных пятёрок.
 */

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div
      style={{ display: 'flex', gap: 3 }}
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={onChange ? 'Оценка' : `Оценка: ${value} из 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={onChange ? () => onChange(i) : undefined}
          tabIndex={onChange ? 0 : -1}
          aria-label={onChange ? `${i} из 5` : undefined}
          aria-checked={onChange ? i === value : undefined}
          role={onChange ? 'radio' : undefined}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: onChange ? 'pointer' : 'default', lineHeight: 0,
          }}
        >
          <Star
            size={onChange ? 26 : 14}
            color="var(--color-punch)"
            fill={i <= value ? 'var(--color-punch)' : 'transparent'}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}

export default function Reviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return
    const room = 4 - images.length
    const list = Array.from(files).slice(0, room)
    if (!list.length) { toast('Можно прикрепить до 4 изображений', { icon: 'ℹ️' }); return }
    setUploading(true)
    try {
      for (const f of list) {
        if (!f.type.startsWith('image/')) continue
        const url = await uploadMedia(f, user.id, 'reviews')
        setImages((prev) => [...prev, url].slice(0, 4))
      }
    } catch {
      toast.error('Не удалось загрузить изображение')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  useEffect(() => {
    getApprovedReviews(12).then((rows) => {
      if (rows.length > 0) setReviews(rows)
    })
  }, [])

  // предзаполняем имя из аккаунта
  useEffect(() => {
    if (user && !name) {
      const meta = (user.user_metadata || {}) as { name?: string; full_name?: string }
      setName(meta.name || meta.full_name || user.email?.split('@')[0] || '')
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = () => {
    if (!user) {
      toast('Войдите, чтобы оставить отзыв', { icon: '🔒' })
      return
    }
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSending(true)
    const res = await submitReview({ name, rating, text, images })
    setSending(false)
    if (res.ok) {
      toast.success(res.message)
      setOpen(false)
      const fresh: ReviewRow = {
        id: 'new-' + Date.now(), name: name.trim(), rating, text: text.trim(),
        images, created_at: new Date().toISOString(),
      }
      setReviews((prev) => [fresh, ...prev])
      setText(''); setRating(5); setImages([])
    } else {
      toast.error(res.message)
    }
  }

  return (
    <section id="reviews" className="mrn-section mrn-tone-paper">
      <div className="mrn-container">
        <Reveal style={{ marginBottom: 40 }}>
          <p className="mrn-eyebrow">Отзывы</p>
          <h2 className="mrn-h2" style={{ marginTop: 14, maxWidth: '20ch' }}>
            Что говорят те, кто уже отправил ссылку
          </h2>
          <p className="mrn-lead" style={{ marginTop: 14, maxWidth: '52ch' }}>
            Отзывы оставляют сами пользователи — здесь только настоящие.
          </p>
        </Reveal>

        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.id}
              className="mrn-card mrn-raised flex flex-col"
              style={{ margin: 0, padding: 'clamp(22px, 3vw, 28px)' }}
            >
              <Stars value={r.rating} />
              <blockquote style={{ margin: '16px 0 0', flex: 1 }}>
                <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--color-ink-700)' }}>{r.text}</p>
              </blockquote>

              {r.images && r.images.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
                  {r.images.slice(0, 4).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Фото к отзыву ${r.name}, ${i + 1}`}
                      style={{ display: 'block', width: 56, height: 56, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--mrn-line)' }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              )}

              <figcaption
                className="flex items-center gap-3"
                style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--mrn-line)' }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 34, height: 34, borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600,
                    color: 'var(--color-punch)', background: 'rgba(228,69,31,.10)',
                  }}
                >
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
              </figcaption>
            </figure>
          ))}
        </Reveal>

        {/* Пока отзывов нет — честная пустота вместо выдуманных пятёрок */}
        {reviews.length === 0 && (
          <Reveal
            className="mrn-card mrn-raised"
            style={{ textAlign: 'center', padding: 'clamp(28px, 5vw, 44px)' }}
          >
            <p style={{ fontSize: 16, color: 'var(--color-ink-700)', margin: 0 }}>
              Отзывов пока нет — направление только запустилось.
            </p>
            <p className="mrn-meta" style={{ marginTop: 8 }}>
              Если вы уже отправляли приглашение, напишите, как прошло. Это будет первый отзыв здесь.
            </p>
          </Reveal>
        )}

        <Reveal style={{ textAlign: 'center', marginTop: 36 }}>
          {user ? (
            <button onClick={openModal} className="mrn-btn mrn-btn--secondary">
              Оставить отзыв
            </button>
          ) : (
            <Link href="/auth/login" className="mrn-btn mrn-btn--secondary">
              <Lock size={15} /> Войдите, чтобы оставить отзыв
            </Link>
          )}
          <p className="mrn-meta" style={{ marginTop: 12 }}>
            Отзыв публикуется сразу. Мат и оскорбления автоматически не пропускаются.
          </p>
        </Reveal>
      </div>

      {/* Модалка отзыва */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ваш отзыв"
          data-lenis-prevent
          style={{
            position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(20,20,22,.55)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mrn-card"
            style={{ width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--mrn-shadow-lift)' }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: '18px 22px', borderBottom: '1px solid var(--mrn-line)' }}
            >
              <h3 className="mrn-h3">Ваш отзыв</h3>
              <button onClick={() => setOpen(false)} className="mrn-icon-btn" aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="mrn-field">
                <label className="mrn-label" htmlFor="review-name">Ваше имя</label>
                <input
                  id="review-name"
                  className="mrn-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как вас зовут"
                  maxLength={60}
                />
              </div>

              <div className="mrn-field">
                <span className="mrn-label">Оценка</span>
                <Stars value={rating} onChange={setRating} />
              </div>

              <div className="mrn-field">
                <label className="mrn-label" htmlFor="review-text">Отзыв</label>
                <textarea
                  id="review-text"
                  className="mrn-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Как прошло и что оказалось удобным"
                  rows={4}
                  maxLength={800}
                />
                <p className="mrn-meta" style={{ fontSize: 12 }}>
                  Отзыв появится на сайте сразу. Нецензурная лексика и оскорбления не пропускаются автоматически.
                </p>
              </div>

              <div className="mrn-field">
                <span className="mrn-label">Фото (необязательно)</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {images.map((url, i) => (
                    <div
                      key={i}
                      style={{ position: 'relative', width: 64, height: 64, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--mrn-line)' }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        aria-label="Удалить фото"
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(20,20,22,.6)', border: 'none', borderRadius: 'var(--radius-xs)', padding: 3, cursor: 'pointer', lineHeight: 0 }}
                      >
                        <X size={12} color="#fff" />
                      </button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      style={{
                        width: 64, height: 64, borderRadius: 'var(--radius-sm)',
                        border: '1px dashed var(--mrn-line-strong)', background: 'var(--color-paper-2)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 2, cursor: 'pointer', color: 'var(--color-ink-400)',
                      }}
                    >
                      {uploading ? <span style={{ fontSize: 11 }}>…</span> : <><ImagePlus size={16} /><span style={{ fontSize: 10 }}>Фото</span></>}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                <p className="mrn-meta" style={{ fontSize: 12 }}>Скриншоты или фото — до 4 изображений.</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={sending || uploading}
                className="mrn-btn mrn-btn--primary mrn-btn--block"
              >
                {sending ? 'Отправляем…' : 'Опубликовать отзыв'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
