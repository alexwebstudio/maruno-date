import type { BlockData, ProjectColors, ProjectFonts, ProjectMusic, SiteVariables, TemplateId } from '@/types'
import { DEFAULT_TEMPLATE_ID, getTemplate, OPTIONS_JSON, type TemplateEntry } from './templateCatalog'
import { getDateType } from './dateScenario'

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яёa-z]+/gi, (match) => transliterate(match))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
}

function transliterate(str: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  return str.split('').map(c => map[c.toLowerCase()] || c).join('')
}

/**
 * Оформление шаблона по умолчанию.
 * Значения берутся из единого каталога (lib/templateCatalog.ts), а не дублируются здесь.
 */
export function getTemplateDefaults(templateId: TemplateId): {
  colors: ProjectColors
  fonts: ProjectFonts
} {
  const tpl = getTemplate(templateId)
  return { colors: tpl.colors, fonts: tpl.fonts }
}

/**
 * СТАРТОВЫЙ СЦЕНАРИЙ ПРИГЛАШЕНИЯ
 *
 * Последовательность сцен — это обычный массив блоков проекта. Никакого
 * отдельного «движка сценариев» под этим нет: порядок задаёт поле order,
 * условный показ — поле showIf, варианты ответов — поле options.
 * Всё это автор правит в редакторе, ничего не зашито в компоненты.
 *
 * Тексты и варианты приходят из выбранного шаблона, поэтому созданное
 * приглашение выглядит так же, как превью в каталоге.
 */
export function getDefaultBlocks(
  vars: Partial<SiteVariables> = {},
  template?: TemplateEntry,
): BlockData[] {
  const tpl = template ?? getTemplate(DEFAULT_TEMPLATE_ID)
  const d = tpl.demo

  const character = vars.character || tpl.character
  const sender = vars.sender || d.sender
  const dateType = vars.dateType || 'other'
  const finalTitle = vars.finalTitle || d.finalTitle
  const layout = tpl.layout
  // Вариант «Ты» уворачивается только у дерзких по характеру шаблонов:
  // на нежном или спокойном приглашении шутка неуместна.
  const teasePayer = tpl.formality === 'дерзко'

  const scene = (
    key: string,
    question: string,
    summaryLabel: string,
    options: string,
    extra: Record<string, string | boolean> = {},
  ): BlockData => ({
    id: `choice-${key}`,
    type: 'date-choice',
    enabled: true,
    order: 0,
    content: {
      key, question, subtitle: '', summaryLabel, options,
      allowCustom: false, customLabel: 'Свой вариант',
      showIf: '', runawayOption: '', character, layout, ...extra,
    },
  })

  const ask: BlockData = {
    id: 'ask',
    type: 'date-ask',
    enabled: true,
    order: 0,
    content: {
      // Вопрос берётся из типа свидания, если автор не задал свой;
      // демо-вопрос шаблона остаётся запасным вариантом.
      question: vars.question || (dateType !== 'other' ? getDateType(dateType).question : d.question),
      subtitle: d.subtitle,
      recipient: vars.recipient || '',
      dateType,
      yesLabel: d.yesLabel,
      noLabel: d.noLabel,
      runaway: true,
      taunts: JSON.stringify(d.taunts),
      character, layout, particles: tpl.particles,
    },
  }

  const payer = scene('payer', 'Кто сегодня платит? 😏', 'Кто платит', OPTIONS_JSON.payers, {
    runawayOption: teasePayer ? 'you' : '',
  })

  const when: BlockData = {
    id: 'when',
    type: 'date-when',
    enabled: true,
    order: 0,
    content: {
      question: 'Когда тебе удобно?',
      subtitle: 'Выбери день и время — я подстроюсь',
      dateLabel: 'День', timeLabel: 'Время',
      summaryDateLabel: 'Дата', summaryTimeLabel: 'Время',
      quickTimes: JSON.stringify(['18:00', '19:00', '20:00', '21:00']),
      confirmLabel: 'Готово', character, layout,
    },
  }

  // Финальная сцена «где встречаемся» — свободный адрес, а не повтор
  // категорий. Тип свидания уже сузил место на уточняющей сцене выше.
  const place = scene('place', 'И где встретимся?', 'Место встречи', '[]', {
    mode: 'input',
    inputPlaceholder: 'Название места или адрес',
    allowCustom: true,
  })

  const final: BlockData = {
    id: 'final',
    type: 'date-final',
    enabled: true,
    order: 0,
    content: {
      title: finalTitle,
      subtitle: d.finalSubtitle,
      signature: sender,
      showSummary: true,
      particles: tpl.particles, character, layout,
      telegram: vars.telegram || '', whatsapp: vars.whatsapp || '',
      instagram: vars.instagram || '', phone: vars.contactPhone || '',
    },
  }

  // ── Уточняющие сцены под конкретный тип свидания ──
  let middle: BlockData[]
  switch (dateType) {
    case 'dinner':
      middle = [scene('venue', 'Где предпочитаешь поужинать?', 'Где ужинаем', OPTIONS_JSON.dinnerVenues, { allowCustom: true, customLabel: 'Своё место' })]
      break
    case 'walk':
      middle = [scene('spot', 'Куда сходим?', 'Где гуляем', OPTIONS_JSON.walkSpots, { allowCustom: true, customLabel: 'Своё место' })]
      break
    case 'cinema':
      middle = [scene('movie', 'Что будем смотреть?', 'Смотрим', OPTIONS_JSON.cinemaPicks, { allowCustom: true, customLabel: 'Свой вариант' })]
      break
    case 'active':
      middle = [scene('activity', 'Чем займёмся?', 'Активность', OPTIONS_JSON.activePicks, { allowCustom: true, customLabel: 'Свой вариант' })]
      break
    case 'surprise':
      // Сюрприз — минимум вопросов: всё решает отправитель. Только настроение.
      middle = [scene('vibe', 'В каком ты сегодня настроении?', 'Настроение', OPTIONS_JSON.surpriseVibes)]
      break
    default:
      // «Пока не решил»: гибкий сценарий с условной сценой про еду.
      middle = [
        scene('activity', 'Что ты хочешь?', 'Чем займёмся', OPTIONS_JSON.activities),
        scene('food', 'А что будем есть?', 'Что едим', OPTIONS_JSON.food, {
          showIf: 'activity=eat', allowCustom: true,
        }),
      ]
  }

  // Сюрприз: без «кто платит» и без адреса — место остаётся тайной до встречи.
  const blocks: BlockData[] =
    dateType === 'surprise'
      ? [ask, ...middle, when, { ...final, content: { ...final.content, subtitle: 'Место и время пришлю за час до встречи. Просто будь готов ✨' } }]
      : [ask, ...middle, payer, when, place, final]

  return blocks.map((b, i) => ({ ...b, order: i }))
}

export function getBlankBlocks(
  vars: Partial<SiteVariables> = {},
  template?: TemplateEntry,
): BlockData[] {
  const full = getDefaultBlocks(vars, template)
  const keep = new Set(['ask', 'final'])
  return full
    .filter((b) => keep.has(b.id))
    .map((b, i) => ({ ...b, order: i }))
}

export function getDefaultMusic(): ProjectMusic {
  return {
    url: null,
    autoplay: false,
    title: '',
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
