/**
 * Шрифты ПРИГЛАШЕНИЙ (не интерфейса).
 *
 * Раньше вся библиотека из ~26 семейств грузилась одной строкой в layout.tsx —
 * то есть на каждой странице, включая лендинг, тарифы и авторизацию, где она не нужна.
 * Теперь библиотека подключается только там, где действительно рендерится
 * типографика пользовательского сайта: редактор, опубликованный сайт, мастер создания.
 *
 * Интерфейсные шрифты (Unbounded / Golos Text / JetBrains Mono) грузятся
 * отдельно через next/font в app/layout.tsx.
 */

/** Спецификация начертаний для каждого семейства (как её понимает Google Fonts CSS2). */
const FONT_SPEC: Record<string, string> = {
  // ── переменные семейства (запрашиваем нужный диапазон весов) ──
  'Unbounded': 'wght@300;400;500;600;700;800',
  'Comfortaa': 'wght@300;400;500;600;700',
  'Oswald': 'wght@300;400;500;600;700',
  'Montserrat': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  'Manrope': 'wght@300;400;500;600;700',
  'Golos Text': 'wght@400;500;600;700;800',
  'Onest': 'wght@300;400;500;600;700',
  'Rubik': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  'Exo 2': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  'Nunito': 'ital,wght@0,300;0,400;0,600;0,700;1,400',
  'Inter': 'wght@300;400;500;600;700',
  'Fira Sans': 'ital,wght@0,300;0,400;0,500;0,700;1,400',
  'Podkova': 'wght@400;500;600;700',
  'Playfair Display': 'ital,wght@0,400;0,500;0,600;0,700;1,400',
  'Cormorant Garamond': 'ital,wght@0,300;0,400;0,500;0,600;1,400',
  'Caveat': 'wght@400;500;600;700',
  'Raleway': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  'Lora': 'ital,wght@0,400;0,500;0,600;0,700;1,400',
  'Spectral': 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  // ── семейства с единственным начертанием: ось веса запрашивать нельзя ──
  'Yeseva One': '',
  'Marmelad': '',
  'Prata': '',
  'Bad Script': '',
  'Pacifico': '',
}

/** Полный список семейств, доступных пользователю в редакторе. */
export const SITE_FONT_FAMILIES = Object.keys(FONT_SPEC)

/**
 * Собирает ссылку на Google Fonts только для перечисленных семейств.
 * Неизвестные имена отбрасываются — иначе Google вернёт 400 и упадёт вся строка.
 */
export function buildSiteFontsHref(families: string[]): string {
  const parts = Array.from(new Set(families))
    .filter((f) => f in FONT_SPEC)
    .sort()
    .map((f) => {
      const spec = FONT_SPEC[f]
      const name = f.replace(/ /g, '+')
      return `family=${name}${spec ? `:${spec}` : ''}`
    })

  if (parts.length === 0) return ''
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`
}

/** Вся библиотека — для редактора и опубликованных сайтов. */
export const SITE_FONTS_HREF = buildSiteFontsHref(SITE_FONT_FAMILIES)
