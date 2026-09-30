'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  Palette, Type, Music, Layers, Upload, Check, X,
  Sparkles, Plus, Copy, Trash2, GripVertical, Eye, EyeOff, ClipboardList,
} from 'lucide-react'
import type { Project, ProjectColors, BlockData, CharacterId, SiteVariables } from '@/types'
import { CHARACTERS } from '@/lib/dateScenario'
import { SCENE_META, sceneTitle } from '@/lib/sceneMeta'
import { deriveVariables, applyVariables } from '@/lib/siteVariables'
import { ApplyStyleConfirm } from './ApplyStyleConfirm'
import { loadMusicLibrary, trackLabel, type LibraryTrack } from '@/lib/musicLibrary'
import { uploadMedia } from '@/lib/projects'
import { reportError } from '@/lib/errors'
import toast from 'react-hot-toast'
import {
  DATE_FONTS, fontFamilyValue, STYLE_PRESETS, COLOR_PRESETS, type StylePreset,
  hexToRgb, rgbToHex, normalizeHex, BUTTON_SHAPES,
  type ButtonShape,
} from '@/lib/editorPresets'

interface EditorSidebarProps {
  project: Project
  onUpdate: (updates: Partial<Project>) => void
  onBlockToggle: (id: string) => void
  onBlockDuplicate: (id: string) => void
  onBlockDelete: (id: string) => void
  onBlockReorder: (blocks: BlockData[]) => void
  onAddBlock: () => void
  canAddBlocks?: boolean
  plan?: 'start' | 'standard'
  userId?: string
  projectId?: string
}

/**
 * Имя сцены в списке. Показываем её вопрос, а не тип компонента:
 * автор ищет «Кто платит», а не «date-choice».
 */
function blockTitle(block: BlockData): string {
  return sceneTitle(block)
}

type Tab = 'blocks' | 'data' | 'style' | 'colors' | 'fonts' | 'music'

export function EditorSidebar({
  project, onUpdate, onBlockToggle, onBlockDuplicate, onBlockDelete, onBlockReorder, onAddBlock,
  canAddBlocks = true, plan = 'standard', userId, projectId,
}: EditorSidebarProps) {
  // Смена стиля переписывает палитру и шрифты целиком — спрашиваем подтверждение
  const [pendingStyle, setPendingStyle] = useState<StylePreset | null>(null)

  const [tab, setTab] = useState<Tab>('blocks')
  const sorted = [...project.blocks].sort((a, b) => a.order - b.order)

  // Глобальные переменные сайта (живут внутри блоков)
  const [vars, setVars] = useState<SiteVariables>(() => deriveVariables(project.blocks))
  // Инициализируем данные один раз при загрузке проекта. НЕ пере-деривим при каждом
  // изменении блоков — иначе введённые в «Данные» значения слетают (#6).
  const varsInit = useRef<string | null>(null)
  useEffect(() => {
    if (varsInit.current !== project.id && project.blocks.length > 0) {
      varsInit.current = project.id
      setVars(deriveVariables(project.blocks))
    }
  }, [project.id, project.blocks])
  const setVar = (k: keyof SiteVariables, v: string) => setVars((prev) => ({ ...prev, [k]: v }))
  const commitVars = (next: SiteVariables) => onUpdate({ blocks: applyVariables(project.blocks, next) })
  const [musicPreview, setMusicPreview] = useState<string | null>(null)
  const [musicUploading, setMusicUploading] = useState(false)

  // Библиотека музыки читается из хранилища, а не из захардкоженного списка.
  const [library, setLibrary] = useState<LibraryTrack[]>([])
  const [libState, setLibState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [libError, setLibError] = useState('')

  const fetchLibrary = useCallback(() => {
    setLibState('loading')
    loadMusicLibrary()
      .then((tracks) => { setLibrary(tracks); setLibState('ready') })
      .catch((e: unknown) => {
        setLibError(e instanceof Error ? e.message : 'неизвестная ошибка')
        setLibState('error')
      })
  }, [])

  // Запрашиваем список только когда человек открыл вкладку музыки —
  // остальным этот запрос не нужен.
  useEffect(() => {
    if (tab === 'music' && libState === 'idle') fetchLibrary()
  }, [tab, libState, fetchLibrary])

  /**
   * Загрузка своей музыки.
   *
   * Раньше файл превращался в blob:-ссылку через URL.createObjectURL и в таком
   * виде сохранялся в проект. Такая ссылка живёт только до перезагрузки вкладки,
   * поэтому у гостей музыка не играла никогда. Теперь файл кладётся в то же
   * хранилище, что и фотографии, и в проект попадает постоянный адрес.
   */
  const handleMusicUpload = async (file: File) => {
    if (!userId || !projectId) {
      toast.error('Не удалось определить проект — обновите страницу')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Файл больше 20 МБ. Выберите запись покороче или сожмите её.')
      return
    }
    setMusicUploading(true)
    try {
      const url = await uploadMedia(file, userId, projectId)
      onUpdate({ music: { ...project.music, url, title: file.name.replace(/\.[^.]+$/, '') } })
      toast.success('Музыка загружена')
    } catch (e) {
      reportError(e, { action: 'upload-music' }, 'Не удалось загрузить музыку')
    } finally {
      setMusicUploading(false)
    }
  }

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'blocks', icon: <Layers size={15} />, label: 'Сцены' },
    { key: 'data', icon: <ClipboardList size={15} />, label: 'Данные' },
    { key: 'style', icon: <Sparkles size={15} />, label: 'Стиль' },
    { key: 'colors', icon: <Palette size={15} />, label: 'Цвета' },
    { key: 'fonts', icon: <Type size={15} />, label: 'Шрифты' },
    { key: 'music', icon: <Music size={15} />, label: 'Музыка' },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab bar */}
      <div className="flex border-b border-paper-3 shrink-0">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9.5px] font-medium transition-colors ${
              tab === tb.key ? 'text-[#F5306B] border-b-2 border-[#F5306B] bg-[#F5306B]/5' : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
        <AnimatePresence mode="wait">

          {/* BLOCKS */}
          {tab === 'blocks' && (
            <motion.div key="blocks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3">
              <button
                onClick={onAddBlock}
                className="w-full mb-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                style={canAddBlocks
                  ? { background: 'linear-gradient(135deg,#F5306B,#1A1016)', color: '#fff' }
                  : { background: '#EFEAE0', color: '#77777F' }}
              >
                {canAddBlocks ? <><Plus size={16} /> Добавить сцену</> : <>🔒 Добавить сцену · Стандарт</>}
              </button>

              <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-2 px-1">
                Перетащите за ручку, чтобы изменить порядок сцен
              </p>

              <Reorder.Group axis="y" values={sorted} onReorder={onBlockReorder} className="space-y-1.5">
                {sorted.map((block) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    onToggle={() => onBlockToggle(block.id)}
                    onDuplicate={() => onBlockDuplicate(block.id)}
                    onDelete={() => onBlockDelete(block.id)}
                  />
                ))}
              </Reorder.Group>

              {sorted.length === 0 && (
                <div className="text-center py-10 text-ink-400">
                  <Layers size={26} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Пока нет ни одной сцены</p>
                  <p className="text-xs mt-1">Нажмите «Добавить сцену»</p>
                </div>
              )}
            </motion.div>
          )}

          {/* DATA — глобальные переменные сайта */}
          {tab === 'data' && (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-3">
              <p className="text-[11px] text-ink-400 leading-relaxed">
                Эти значения относятся ко всему приглашению и подставляются во все сцены сразу.
                Что выбрать — активность, дату, место — решает тот, кому вы отправите ссылку,
                поэтому здесь этих полей нет.
              </p>

              {/* Персонаж ведёт историю целиком, поэтому он общий, а не «настройка сцены» */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-ink-400 mb-1.5">Персонаж</label>
                <div className="flex flex-wrap gap-1.5">
                  {CHARACTERS.map((ch) => {
                    const active = vars.character === ch.id
                    return (
                      <button
                        key={ch.id}
                        onClick={() => {
                          const next = { ...vars, character: ch.id as CharacterId }
                          setVars(next)
                          commitVars(next)
                        }}
                        className="transition-colors"
                        style={{
                          minHeight: 38, padding: '0 12px', borderRadius: 999, fontSize: 12.5,
                          border: `1px solid ${active ? '#F5306B' : 'var(--mrn-line-strong)'}`,
                          background: active ? '#F5306B' : 'transparent',
                          color: active ? '#fff' : 'var(--color-ink-600)',
                        }}
                      >
                        {ch.emoji !== '—' ? `${ch.emoji} ` : ''}{ch.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {([
                ['sender', 'Кто зовёт (подпись в финале)', 'text'],
                ['recipient', 'Кому (необязательно)', 'text'],
                ['question', 'Главный вопрос', 'text'],
                ['finalTitle', 'Финальный текст', 'text'],
                ['telegram', 'Telegram', 'text'],
                ['whatsapp', 'WhatsApp', 'text'],
                ['instagram', 'Instagram', 'text'],
                ['contactPhone', 'Телефон', 'text'],
              ] as [keyof SiteVariables, string, string][]).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-[10px] uppercase tracking-widest text-ink-400 mb-1">{label}</label>
                  <input
                    type={type}
                    value={String(vars[key] ?? '')}
                    onChange={(e) => setVar(key, e.target.value)}
                    onBlur={() => commitVars(vars)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }}
                    className="w-full px-3 py-2 rounded-lg bg-paper-2 text-sm text-[#1A1016] outline-none focus:ring-2 focus:ring-[#F5306B]/30 transition"
                  />
                </div>
              ))}
              <button onClick={() => { commitVars(vars); import('react-hot-toast').then((m) => m.default.success('Данные применены ко всем сценам')) }}
                className="w-full mt-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#F5306B,#1A1016)' }}>
                <Check size={15} /> Применить ко всем сценам
              </button>

              {/* Защита PIN-кодом (#4) */}
              <div className="pt-3 mt-1 border-t border-paper-3">
                <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1 flex items-center gap-1.5">🔒 Защита PIN-кодом</p>
                <p className="text-[11px] text-ink-400 mb-2 leading-snug">Если задать код — приглашение не откроется без него. Пусто — доступ свободный.</p>
                <input
                  value={project.music.accessPin || ''}
                  placeholder="Например, 2026"
                  maxLength={12}
                  onChange={(e) => onUpdate({ music: { ...project.music, accessPin: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg bg-paper-2 text-sm text-[#1A1016] tracking-[0.25em] text-center outline-none focus:ring-2 focus:ring-[#F5306B]/30"
                />
                {project.music.accessPin ? (
                  <button onClick={() => onUpdate({ music: { ...project.music, accessPin: '' } })} className="mt-1.5 text-[11px] text-ink-400 hover:text-red-500 underline">Убрать код</button>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* STYLE PRESETS */}
          {tab === 'style' && (
            <motion.div key="style" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-1 px-1">Готовые стили</p>
              <p className="text-[11px] text-ink-400 mb-2 px-1 leading-snug">Задаёт палитру и шрифты сразу</p>
              {STYLE_PRESETS.map((s) => {
                const active = project.colors.primary.toLowerCase() === s.colors.primary.toLowerCase()
                  && project.fonts.heading === s.fonts.heading
                return (
                  <button
                    key={s.id}
                    onClick={() => setPendingStyle(s)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      active ? 'border-[#F5306B] ring-1 ring-[#F5306B]/30' : 'border-paper-3 hover:border-[#F5306B]/40'
                    }`}
                    style={{ background: s.colors.background }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: fontFamilyValue(s.fonts.heading), fontSize: 20, color: s.colors.text, lineHeight: 1 }}>{s.name}</span>
                      {active && <Check size={14} className="text-[#F5306B]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[s.colors.primary, s.colors.secondary, s.colors.accent, s.colors.text].map((c, i) => (
                          <span key={i} className="w-4 h-4 rounded-full" style={{ background: c, border: '1.5px solid rgba(255,255,255,.7)', boxShadow: '0 1px 2px rgba(0,0,0,.12)' }} />
                        ))}
                      </div>
                      <span className="text-[11px] opacity-60" style={{ color: s.colors.text }}>{s.desc}</span>
                    </div>
                  </button>
                )
              })}

              {/* Форма элементов сайта */}
              <div className="pt-3 mt-1 border-t border-paper-3">
                <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-2 px-1">Форма кнопок</p>
                <div className="flex gap-1.5 mb-4">
                  {BUTTON_SHAPES.map((o) => {
                    const active = (project.fonts.buttonStyle ?? 'rounded') === o.v
                    return (
                      <button key={o.v}
                        onClick={() => onUpdate({ fonts: { ...project.fonts, buttonStyle: o.v as ButtonShape } })}
                        className={`flex-1 py-2 text-[11px] font-medium transition-all border ${active ? 'bg-[#1A1016] text-white border-[#1A1016]' : 'bg-white text-ink-400 border-paper-3 hover:border-[#F5306B]/50'}`}
                        style={{ borderRadius: o.v === 'pill' ? 9999 : o.v === 'sharp' ? 2 : 12 }}>
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
          {tab === 'colors' && (
            <motion.div key="colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-2 px-1">Готовые палитры</p>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isActive = project.colors.primary.toLowerCase() === preset.colors.primary.toLowerCase()
                    return (
                      <button
                        key={preset.name}
                        onClick={() => onUpdate({ colors: preset.colors })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${isActive ? 'ring-2 ring-[#F5306B]' : 'hover:border-[#F5306B]/50'}`}
                        style={{ background: preset.colors.background, borderColor: preset.colors.primary + '30' }}
                      >
                        <div className="flex gap-1 mb-1.5">
                          {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.text].map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-full" style={{ background: c, border: '1.5px solid white', boxShadow: '0 1px 2px rgba(0,0,0,.1)' }} />
                          ))}
                          {isActive && <Check size={12} className="ml-auto text-[#F5306B]" />}
                        </div>
                        <p className="text-[11px] font-medium truncate" style={{ color: preset.colors.text }}>{preset.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-2 px-1">Точная настройка (HEX / RGB)</p>
                <div className="space-y-2.5">
                  {([
                    { key: 'primary', label: 'Акцент' },
                    { key: 'secondary', label: 'Вторичный' },
                    { key: 'accent', label: 'Подложка' },
                    { key: 'background', label: 'Фон' },
                    { key: 'text', label: 'Текст' },
                  ] as { key: keyof ProjectColors; label: string }[]).map(({ key, label }) => (
                    <ColorControl
                      key={key}
                      label={label}
                      value={project.colors[key]}
                      onChange={(hex) => onUpdate({ colors: { ...project.colors, [key]: hex } })}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* FONTS */}
          {tab === 'fonts' && (
            <motion.div key="fonts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-2">
              <div className="px-1 mb-2.5">
                <p className="text-[10px] uppercase tracking-widest text-ink-400">
                  {DATE_FONTS.length} шрифтовых пар
                </p>
                {/*
                  Явно объясняем, что выбранное здесь — глобальный шрифт сайта.
                  Иначе непонятно, почему у одного блока шрифт другой:
                  у блока может стоять своё значение (кнопка настроек блока).
                */}
                <p className="text-[11px] text-ink-400 leading-snug mt-1">
                  Это шрифт всего сайта. У отдельного блока можно поставить свой —
                  в его настройках, кнопкой с шестерёнкой.
                </p>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-ink-600)' }}>
                  Сейчас: <b>{project.fonts.heading}</b> и <b>{project.fonts.body}</b>
                </p>
              </div>
              {DATE_FONTS.map((f) => {
                const active = project.fonts.heading === f.heading
                return (
                  <button
                    key={f.label}
                    onClick={() => onUpdate({ fonts: { ...project.fonts, heading: f.heading, body: f.body } })}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      active ? 'border-[#F5306B] bg-[#F5306B]/5 ring-1 ring-[#F5306B]/30' : 'border-paper-3 hover:border-[#F5306B]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-ink-400 flex items-center gap-1.5">
                        {f.label}
                        <span className={`px-1.5 py-px rounded text-[9px] font-semibold tracking-wide ${
                          f.langs === 'RU+KZ' ? 'bg-emerald-50 text-emerald-600' : 'bg-paper-2 text-ink-400'
                        }`}>{f.langs}</span>
                      </span>
                      {active && <Check size={12} className="text-[#F5306B]" />}
                    </div>
                    <p className="text-[#1A1016] leading-tight truncate" style={{ fontFamily: fontFamilyValue(f.heading), fontSize: f.kind === 'cursive' ? 26 : f.kind === 'display' ? 19 : 22, fontWeight: f.kind === 'display' ? 600 : 400 }}>
                      Динаре 30 лет
                    </p>
                  </button>
                )
              })}
            </motion.div>
          )}

          {/* MUSIC */}
          {tab === 'music' && (
            <motion.div key="music" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-ink-400 px-1">Фоновая музыка</p>
              {project.music.url ? (
                <div className="p-3 rounded-xl bg-[#F5306B]/10 border border-[#F5306B]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#1A1016] truncate max-w-[80%]">{project.music.title || 'Музыка'}</span>
                    <button onClick={() => onUpdate({ music: { url: null, autoplay: false, title: '' } })} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <X size={13} className="text-red-400" />
                    </button>
                  </div>
                  <audio controls src={project.music.url} className="w-full" style={{ height: 32 }} />
                </div>
              ) : (
                <label className="block border-2 border-dashed border-[#F5306B]/30 rounded-xl p-6 text-center cursor-pointer hover:border-[#F5306B] hover:bg-[#F5306B]/5 transition-all">
                  <Upload size={22} className="text-[#F5306B] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1A1016]">
                    {musicUploading ? 'Загружаем…' : 'Загрузить музыку'}
                  </p>
                  <p className="text-xs text-ink-400 mt-1">MP3, AAC до 20 МБ</p>
                  <input type="file" accept="audio/*" className="hidden" disabled={musicUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (file) handleMusicUpload(file)
                    }}
                  />
                </label>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl bg-paper-2">
                <div>
                  <p className="text-sm font-medium text-[#1A1016]">Автовоспроизведение</p>
                  <p className="text-xs text-ink-400">После первого нажатия</p>
                </div>
                <button onClick={() => onUpdate({ music: { ...project.music, autoplay: !project.music.autoplay } })} className="toggle-fix" data-state={project.music.autoplay ? 'on' : 'off'} />
              </div>
              <p className="text-xs text-ink-400 px-1">💡 Музыка воспроизводится на опубликованном сайте гостей</p>

              {/* Библиотека музыки — то, что реально лежит в хранилище */}
              <div className="pt-2 border-t border-paper-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-ink-400">Библиотека музыки</p>
                  {libState === 'ready' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-punch)1F', color: 'var(--color-punch)' }}>
                      {library.length} {library.length === 1 ? 'трек' : library.length < 5 ? 'трека' : 'треков'}
                    </span>
                  )}
                </div>

                {libState === 'loading' && (
                  <p className="text-[11px] text-ink-400 px-1">Загружаем список…</p>
                )}

                {libState === 'error' && (
                  <div className="px-1">
                    <p className="text-[11px] leading-snug" style={{ color: 'var(--color-punch)' }}>
                      Не удалось прочитать библиотеку: {libError}
                    </p>
                    <button onClick={fetchLibrary} className="mt-1.5 text-[11px] underline" style={{ color: 'var(--color-punch)' }}>
                      Попробовать снова
                    </button>
                  </div>
                )}

                {libState === 'ready' && library.length === 0 && (
                  <p className="text-[11px] text-ink-400 px-1 leading-snug">
                    Библиотека пока пуста. Треки берутся из папки <code>music/</code> в хранилище
                    проекта — как только там появятся файлы, они окажутся здесь.
                    Свой файл можно загрузить кнопкой выше.
                  </p>
                )}

                {libState === 'ready' && library.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1" data-lenis-prevent>
                    {library.map((tr) => {
                      const active = project.music.url === tr.url
                      const previewing = musicPreview === tr.id
                      return (
                        <div key={tr.id} className={`flex items-center gap-2 p-2 rounded-lg ${active ? 'bg-[var(--color-punch)]/10' : 'hover:bg-paper-2'}`}>
                          <button
                            onClick={() => setMusicPreview((v) => (v === tr.id ? null : tr.id))}
                            className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
                            style={{ width: 32, height: 32, background: 'var(--color-punch)' }}
                            aria-label={previewing ? 'Остановить' : 'Прослушать'}
                          >
                            {previewing ? '❚❚' : '▶'}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] text-[#1A1016] truncate">{tr.title}</p>
                            {tr.artist && <p className="text-[10px] text-ink-400 truncate">{tr.artist}</p>}
                          </div>
                          <button
                            onClick={() => onUpdate({ music: { ...project.music, url: active ? null : tr.url, title: active ? '' : trackLabel(tr) } })}
                            className="text-[11px] px-2 rounded-md flex-shrink-0"
                            style={{ minHeight: 32, background: active ? 'var(--color-punch)' : '#EFEAE0', color: active ? '#fff' : '#1A1016' }}
                          >
                            {active ? 'Убрать' : 'Выбрать'}
                          </button>
                          {previewing && <audio src={tr.url} autoPlay onEnded={() => setMusicPreview(null)} className="hidden" />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <ApplyStyleConfirm
        preset={pendingStyle}
        onClose={() => setPendingStyle(null)}
        onConfirm={() => {
          if (pendingStyle) {
            onUpdate({ colors: pendingStyle.colors, fonts: { ...project.fonts, ...pendingStyle.fonts } })
          }
          setPendingStyle(null)
        }}
      />
    </div>
  )
}

// Одна строка блока с drag-ручкой и действиями
function BlockRow({ block, onToggle, onDuplicate, onDelete }: {
  block: BlockData
  onToggle: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const controls = useDragControls()
  const meta = SCENE_META[block.type]
  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 p-2.5 rounded-xl border bg-white select-none"
      style={{ borderColor: block.enabled ? 'rgba(228, 69, 31,0.25)' : '#f0f0f0', background: block.enabled ? '#FCF6F5' : '#fafafa' }}
      whileDrag={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 5 }}
    >
      <span
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-400 touch-none flex-shrink-0"
        title="Перетащить"
      >
        <GripVertical size={15} />
      </span>
      <span className="text-sm flex-shrink-0">{meta?.icon ?? '📦'}</span>
      <span className={`text-[13px] font-medium flex-1 min-w-0 truncate ${block.enabled ? 'text-[#1A1016]' : 'text-ink-400'}`}>
        {blockTitle(block)}
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-paper-2 transition-colors" title={block.enabled ? 'Скрыть' : 'Показать'}>
          {block.enabled ? <Eye size={13} className="text-ink-400" /> : <EyeOff size={13} className="text-ink-300" />}
        </button>
        <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-paper-2 transition-colors" title="Дублировать">
          <Copy size={13} className="text-ink-400" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Удалить">
          <Trash2 size={13} className="text-red-400" />
        </button>
      </div>
    </Reorder.Item>
  )
}

// HEX + RGB + пипетка для одного цвета
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])
  const rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 }

  const commitHex = (raw: string) => {
    const norm = normalizeHex(raw)
    if (norm) onChange(norm)
    else setDraft(value)
  }
  const setChannel = (ch: 'r' | 'g' | 'b', v: string) => {
    const n = Math.max(0, Math.min(255, parseInt(v || '0', 10) || 0))
    const next = { ...rgb, [ch]: n }
    onChange(rgbToHex(next.r, next.g, next.b))
  }

  return (
    <div className="p-2.5 rounded-xl border border-paper-3">
      <div className="flex items-center gap-2 mb-2">
        <label className="relative flex-shrink-0" style={{ width: 30, height: 30 }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 opacity-0 cursor-pointer" />
          <span className="block w-full h-full rounded-lg border border-paper-3" style={{ background: value }} />
        </label>
        <span className="text-[13px] text-ink-600 flex-1">{label}</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          className="w-[74px] px-2 py-1 rounded-lg bg-paper-2 text-[12px] font-mono text-ink-600 outline-none focus:ring-2 focus:ring-[#F5306B]/30 uppercase"
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {(['r', 'g', 'b'] as const).map((ch) => (
          <div key={ch} className="flex items-center gap-1 bg-paper-2 rounded-lg px-1.5">
            <span className="text-[10px] text-ink-400 uppercase">{ch}</span>
            <input
              type="number" min={0} max={255} value={rgb[ch]}
              onChange={(e) => setChannel(ch, e.target.value)}
              className="w-full py-1 bg-transparent text-[12px] text-ink-600 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
