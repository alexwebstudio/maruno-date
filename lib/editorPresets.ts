import type { ProjectColors, ProjectFonts } from '@/types'

export type FontFamilyKind = 'serif' | 'sans' | 'display' | 'cursive'
export type FontLang = 'RU' | 'KZ' | 'RU+KZ'

export interface DateFont {
  heading: string
  body: string
  label: string
  kind: FontFamilyKind
  langs: FontLang // поддержка языков: RU (русский) / RU+KZ (русский + казахский)
}

/**
 * Шрифтовые пары приглашений на свидание.
 *
 * Набор свой, под эту нишу: сверху спокойные гротески, которыми вопрос
 * читается как сообщение, ниже — антиквы для вечерних приглашений и
 * рукописные для совсем личных. Гарнитур с афишным характером здесь нет:
 * «Пойдёшь со мной?», набранное как вывеска ночного клуба, звучит
 * не про свидание.
 *
 * Только семейства с кириллицей — латиница-онли для RU/KZ бесполезна.
 * langs: 'RU+KZ' — есть расширенная кириллица с казахскими буквами (ә ғ қ ң ө ұ ү һ і);
 *        'RU'    — базовая кириллица (казахские спецбуквы могут отсутствовать).
 */
export const DATE_FONTS: DateFont[] = [
  { heading: 'Onest',              body: 'Onest',      label: 'Onest',        kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Manrope',            body: 'Inter',      label: 'Manrope',      kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Inter',              body: 'Inter',      label: 'Inter',        kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Unbounded',          body: 'Golos Text', label: 'Unbounded',    kind: 'display', langs: 'RU+KZ' },
  { heading: 'Golos Text',         body: 'Golos Text', label: 'Golos',        kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Montserrat',         body: 'Inter',      label: 'Montserrat',   kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Raleway',            body: 'Inter',      label: 'Raleway',      kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Comfortaa',          body: 'Nunito',     label: 'Comfortaa',    kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Nunito',             body: 'Nunito',     label: 'Nunito',       kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Rubik',              body: 'Rubik',      label: 'Rubik',        kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Oswald',             body: 'Fira Sans',  label: 'Oswald',       kind: 'sans',    langs: 'RU+KZ' },
  { heading: 'Marmelad',           body: 'Nunito',     label: 'Marmelad',     kind: 'sans',    langs: 'RU' },
  { heading: 'Prata',              body: 'Manrope',    label: 'Prata',        kind: 'serif',   langs: 'RU+KZ' },
  { heading: 'Playfair Display',   body: 'Fira Sans',  label: 'Playfair',     kind: 'serif',   langs: 'RU+KZ' },
  { heading: 'Cormorant Garamond', body: 'Montserrat', label: 'Cormorant',    kind: 'serif',   langs: 'RU+KZ' },
  { heading: 'Lora',               body: 'Inter',      label: 'Lora',         kind: 'serif',   langs: 'RU+KZ' },
  { heading: 'Spectral',           body: 'Manrope',    label: 'Spectral',     kind: 'serif',   langs: 'RU' },
  { heading: 'Podkova',            body: 'Fira Sans',  label: 'Podkova',      kind: 'serif',   langs: 'RU+KZ' },
  { heading: 'Yeseva One',         body: 'Montserrat', label: 'Yeseva One',   kind: 'display', langs: 'RU+KZ' },
  { heading: 'Caveat',             body: 'Nunito',     label: 'Caveat',       kind: 'cursive', langs: 'RU+KZ' },
  { heading: 'Bad Script',         body: 'Golos Text', label: 'Bad Script',   kind: 'cursive', langs: 'RU' },
  { heading: 'Pacifico',           body: 'Nunito',     label: 'Pacifico',     kind: 'cursive', langs: 'RU' },
]

export function fontFamilyValue(font: string): string {
  const meta = DATE_FONTS.find((f) => f.heading === font) ?? DATE_FONTS.find((f) => f.body === font)
  if (meta) {
    if (meta.kind === 'cursive') return `'${font}', cursive`
    if (meta.kind === 'serif') return `'${font}', serif`
    return `'${font}', sans-serif`
  }
  // Незнакомое семейство: гротеск — самый безопасный запасной вариант,
  // антиква подменялась бы Times и ломала вид блока.
  return `'${font}', sans-serif`
}

// ── Форма элементов сайта (кнопки / изображения) ──
export type ButtonShape = 'rounded' | 'pill' | 'sharp'
export type ImageShape = 'rounded' | 'square' | 'pill' | 'circle'

export const BUTTON_SHAPES: { v: ButtonShape; label: string }[] = [
  { v: 'rounded', label: 'Скруглённые' },
  { v: 'pill', label: 'Капсула' },
  { v: 'sharp', label: 'Прямые' },
]
export const IMAGE_SHAPES: { v: ImageShape; label: string }[] = [
  { v: 'rounded', label: 'Скруглённые' },
  { v: 'square', label: 'Квадратные' },
  { v: 'pill', label: 'Капсула' },
  { v: 'circle', label: 'Круглые' },
]
export function buttonRadius(s?: ButtonShape): string {
  return s === 'pill' ? '9999px' : s === 'sharp' ? '0px' : '14px'
}
export function imageRadius(s?: ImageShape): string {
  return s === 'square' ? '0px' : s === 'pill' ? '2.25rem' : s === 'circle' ? '9999px' : '1rem'
}

// Готовые цельные стили — задают палитру + типографику одним нажатием.
export interface StylePreset {
  id: string
  name: string
  desc: string
  colors: ProjectColors
  fonts: ProjectFonts
}

/**
 * Готовые цельные стили — палитра и типографика одним нажатием.
 *
 * Ни один из них не «мужской» и не «женский»: оформление выбирает автор
 * под настроение приглашения, а не под пол адресата. Розовый здесь один
 * и приглушённый — приглашение на свидание не обязано выглядеть как
 * открытка ко Дню святого Валентина.
 */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'warm',
    name: 'Тепло',
    desc: 'Терракота на кремовом, мягко и спокойно',
    colors: { primary: '#D2674A', secondary: '#8A5142', accent: '#F7E5DB', background: '#FDF8F4', text: '#2A1E19' },
    fonts: { heading: 'Onest', body: 'Onest', buttonStyle: 'pill' },
  },
  {
    id: 'midnight',
    name: 'После заката',
    desc: 'Тёмный фон, золото и индиго',
    colors: { primary: '#E2B564', secondary: '#6F63D6', accent: '#1B1A2B', background: '#100F19', text: '#F1ECE2' },
    fonts: { heading: 'Prata', body: 'Manrope', buttonStyle: 'sharp' },
  },
  {
    id: 'coral',
    name: 'Коралл',
    desc: 'Коралл и мята, живо и без пафоса',
    colors: { primary: '#FF6A3D', secondary: '#12A594', accent: '#FFE7D9', background: '#FFFCF8', text: '#221F1D' },
    fonts: { heading: 'Comfortaa', body: 'Nunito', buttonStyle: 'pill' },
  },
  {
    id: 'plain',
    name: 'Минимал',
    desc: 'Белое поле, воздух и единственный акцент',
    colors: { primary: '#E4572E', secondary: '#6B6B6B', accent: '#F0EDE8', background: '#FFFFFF', text: '#1A1A1A' },
    fonts: { heading: 'Manrope', body: 'Inter', buttonStyle: 'sharp' },
  },
  {
    id: 'rose',
    name: 'Пыльная роза',
    desc: 'Приглушённый розовый вместо открыточного',
    colors: { primary: '#C2607B', secondary: '#8E4159', accent: '#F7E4EA', background: '#FFFAFB', text: '#2A1A20' },
    fonts: { heading: 'Cormorant Garamond', body: 'Montserrat', buttonStyle: 'rounded' },
  },
  {
    id: 'forest',
    name: 'Хвоя',
    desc: 'Глубокая зелень и песок, сдержанно',
    colors: { primary: '#3F7D5C', secondary: '#2A5540', accent: '#E3EFE5', background: '#FAFBF7', text: '#182018' },
    fonts: { heading: 'Playfair Display', body: 'Fira Sans', buttonStyle: 'rounded' },
  },
  {
    id: 'ink',
    name: 'Графит',
    desc: 'Почти чёрный фон и один холодный акцент',
    colors: { primary: '#7FD1C1', secondary: '#4E86C4', accent: '#1B1F25', background: '#121519', text: '#ECF1F3' },
    fonts: { heading: 'Manrope', body: 'Inter', buttonStyle: 'sharp' },
  },
  {
    id: 'sunset',
    name: 'Закат',
    desc: 'Янтарь и слива, вечерний, но светлый',
    colors: { primary: '#E08A3C', secondary: '#7A4A8C', accent: '#FBE9D2', background: '#FFFBF5', text: '#2B1F16' },
    fonts: { heading: 'Yeseva One', body: 'Montserrat', buttonStyle: 'rounded' },
  },
]

// Готовые палитры (быстрый выбор цвета).
export const COLOR_PRESETS: { name: string; colors: ProjectColors }[] = [
  { name: 'Терракота', colors: { primary: '#D2674A', secondary: '#8A5142', accent: '#F7E5DB', background: '#FDF8F4', text: '#2A1E19' } },
  { name: 'Коралл',    colors: { primary: '#FF6A3D', secondary: '#12A594', accent: '#FFE7D9', background: '#FFFCF8', text: '#221F1D' } },
  { name: 'Роза',      colors: { primary: '#C2607B', secondary: '#8E4159', accent: '#F7E4EA', background: '#FFFAFB', text: '#2A1A20' } },
  { name: 'Хвоя',      colors: { primary: '#3F7D5C', secondary: '#2A5540', accent: '#E3EFE5', background: '#FAFBF7', text: '#182018' } },
  { name: 'Песок',     colors: { primary: '#C79A2E', secondary: '#96721A', accent: '#F8ECCD', background: '#FEFAF0', text: '#2A2112' } },
  { name: 'Лаванда',   colors: { primary: '#7A6BD1', secondary: '#544799', accent: '#EAE6FA', background: '#FBFAFF', text: '#1F1B30' } },
  { name: 'После заката', colors: { primary: '#E2B564', secondary: '#6F63D6', accent: '#1B1A2B', background: '#100F19', text: '#F1ECE2' } },
  { name: 'Графит',    colors: { primary: '#7FD1C1', secondary: '#4E86C4', accent: '#1B1F25', background: '#121519', text: '#ECF1F3' } },
]

// ── HEX / RGB утилиты для цветового пикера ──
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, '')
  if (/^[a-f\d]{3}$/i.test(v)) v = v.split('').map((c) => c + c).join('')
  if (/^[a-f\d]{6}$/i.test(v)) return `#${v.toUpperCase()}`
  return null
}
