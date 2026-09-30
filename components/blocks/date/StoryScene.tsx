'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, Loader2, ArrowRight } from 'lucide-react'
import { EditableInline } from './EditableInline'
import { fontFamilyValue } from '@/lib/editorPresets'
import { str } from '@/lib/dateScenario'
import { uploadMedia } from '@/lib/projects'
import type { SceneProps } from './types'

/**
 * СЦЕНА «НАША ИСТОРИЯ»
 *
 * Фотография пользователя на весь экран, текст поверх неё. Отличается от
 * остальных сцен тем, что фон — это загруженное фото, а не палитра.
 *
 * Читаемость обеспечивает затемняющий градиент снизу (scrim), а не
 * «подложка под текстом»: фото остаётся фото. Кадр берётся object-fit:
 * cover, поэтому не искажается и корректно ведёт себя на любом экране.
 * Пока фото нет — мягкая заглушка из палитры и приглашение его добавить.
 */
export function StoryScene({ block, colors, fonts, isEditing, onChange, onAnswer, userId, projectId }: SceneProps) {
  const c = block.content
  const set = (k: string, v: string) => onChange({ ...c, [k]: v })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const photo = str(c.photo)
  const title = str(c.title, 'Наша история')
  const text = str(c.text)
  const cta = str(c.cta, 'Дальше')
  const headingFf = fontFamilyValue(fonts.heading)
  const bodyFf = fontFamilyValue(fonts.body)

  const handleFile = async (file: File) => {
    if (!userId || !projectId) return
    if (file.size > 12 * 1024 * 1024) { alert('Фото больше 12 МБ — выберите меньше'); return }
    setUploading(true)
    try {
      const url = await uploadMedia(file, userId, projectId)
      set('photo', url)
    } catch {
      alert('Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="date-story"
      style={{ background: photo ? colors.text : `linear-gradient(150deg, ${colors.primary}22, ${colors.accent})` }}
    >
      {photo && (
        <div
          className="date-story__photo"
          style={{ backgroundImage: `url("${photo}")` }}
          aria-hidden="true"
        />
      )}
      <div className="date-story__scrim" aria-hidden="true" />

      <div className="date-story__body">
        <motion.h2
          className="date-story__title"
          style={{ fontFamily: headingFf, color: photo ? '#fff' : colors.text }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <EditableInline value={title} onChange={(v) => set('title', v)} isEditing={isEditing} placeholder="Заголовок" />
        </motion.h2>

        {(text || isEditing) && (
          <motion.p
            className="date-story__text"
            style={{ fontFamily: bodyFf, color: photo ? 'rgba(255,255,255,.9)' : colors.text }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <EditableInline value={text} onChange={(v) => set('text', v)} isEditing={isEditing} multiline placeholder="Пара строк вашей истории (необязательно)" />
          </motion.p>
        )}

        {isEditing ? (
          <div className="date-story__edit">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <button
              type="button"
              className="date-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ background: colors.primary, color: colors.background }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {photo ? 'Заменить фото' : 'Загрузить фото'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="date-btn date-btn--lg date-story__cta"
            onClick={() => onAnswer({})}
            style={{ background: photo ? '#fff' : colors.primary, color: photo ? colors.text : colors.background }}
          >
            {cta} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
