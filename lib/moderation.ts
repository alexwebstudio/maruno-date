// ============================================================
// Maruno — модерация отзывов (патч 1.01)
// Отсекает: мат в любом виде, оскорбления по расе / полу /
// ориентации, и «пустой негатив» без причины.
// Список — корневой (root-match), легко расширяется снизу.
// ============================================================

export type ModerationReason =
  | 'ok'
  | 'profanity'   // мат / оскорбления
  | 'slur'        // расовые / гендерные оскорбления
  | 'too_short'   // слишком короткий отзыв
  | 'empty_hate'  // «плохой сервис» без аргументов
  | 'links'       // спам-ссылки

export interface ModerationResult {
  ok: boolean
  reason: ModerationReason
  message: string
}

// — Нормализация: убираем leet-замену и разрядку («п р и в е т», «х@й») —
function normalize(input: string): string {
  const leet: Record<string, string> = {
    '0': 'о', '@': 'а', '4': 'ч', '3': 'е', '1': 'и', '6': 'б',
    a: 'а', o: 'о', e: 'е', p: 'р', c: 'с', x: 'х', y: 'у', k: 'к',
    b: 'в', m: 'м', h: 'н', t: 'т',
  }
  return input
    .toLowerCase()
    .replace(/[^а-яёa-z\s]/gi, (ch) => leet[ch] ?? '')
    .replace(/(.)\1{2,}/g, '$1$1')     // «оооочень» → «оочень»
    .replace(/\s+/g, ' ')
    .trim()
}

// — Убираем пробелы между буквами, чтобы поймать «х у й» —
function collapse(text: string): string {
  return text.replace(/\s/g, '')
}

// ── Корни мата / оскорблений (RU) ──
const PROFANITY_ROOTS = [
  'хуй', 'хуе', 'хуё', 'хуя', 'пизд', 'ебан', 'ебат', 'ебал', 'ебуч', 'еби',
  'бляд', 'блят', 'сука', 'суки', 'сучк', 'мудак', 'мудил', 'долбоёб', 'долбоеб',
  'гандон', 'гондон', 'пидор', 'пидар', 'пидр', 'залуп', 'дроч', 'манда',
  'выеб', 'заеб', 'наеб', 'уеб', 'въеб', 'отъеб', 'подъеб', 'проеб',
  'говно', 'гавно', 'дерьм', 'ссан', 'ссыкл', 'чмо', 'уёбищ', 'уебищ',
  'шлюх', 'блядь', 'ебло', 'ебля', 'жопа', 'засран', 'мразь', 'мраз',
]

// ── Оскорбления по расе / полу / ориентации ──
const SLUR_ROOTS = [
  'нигер', 'нигг', 'жид', 'хач', 'чурк', 'хохол', 'москал', 'нерусь',
  'чурбан', 'узкоглаз', 'пиндос', 'даун', 'дебил', 'имбецил', 'уродк',
  'петух', 'опущ', 'транс­', 'феминаци',
]

// ── «Пустой негатив»: короткие фразы без аргументов ──
const EMPTY_HATE = [
  'плохой сервис', 'плохой сайт', 'фигня', 'фигово', 'ерунда', 'отстой',
  'не работает всё', 'полное дно', 'кал', 'бесполезно', 'разводка',
  'кидалово', 'обман', 'не рекомендую',
]

function containsRoot(text: string, roots: string[]): boolean {
  return roots.some((root) => text.includes(root))
}

const MIN_LENGTH = 12

export function moderateReview(rawText: string): ModerationResult {
  const text = (rawText || '').trim()

  if (text.length < MIN_LENGTH) {
    return {
      ok: false,
      reason: 'too_short',
      message: 'Расскажите чуть подробнее — минимум пара предложений о вашем опыте.',
    }
  }

  const norm = normalize(text)
  const collapsed = collapse(norm)

  if (containsRoot(norm, SLUR_ROOTS) || containsRoot(collapsed, SLUR_ROOTS)) {
    return {
      ok: false,
      reason: 'slur',
      message: 'Отзыв содержит оскорбления. Пожалуйста, оставьте уважительный отзыв.',
    }
  }

  if (containsRoot(norm, PROFANITY_ROOTS) || containsRoot(collapsed, PROFANITY_ROOTS)) {
    return {
      ok: false,
      reason: 'profanity',
      message: 'Пожалуйста, без нецензурной лексики.',
    }
  }

  // Спам-ссылки
  if (/(https?:\/\/|www\.|\.ru\b|\.com\b|t\.me\/|@[a-z0-9_]{4,})/i.test(text)) {
    return {
      ok: false,
      reason: 'links',
      message: 'Ссылки и контакты в отзывах публиковать нельзя.',
    }
  }

  // «Пустой негатив» — короткий отзыв, состоящий только из ругани сервиса
  const isShortish = text.length < 40
  if (isShortish && EMPTY_HATE.some((p) => norm.includes(p))) {
    return {
      ok: false,
      reason: 'empty_hate',
      message: 'Если что-то не понравилось — напишите, что именно, чтобы мы могли исправить.',
    }
  }

  return { ok: true, reason: 'ok', message: '' }
}
