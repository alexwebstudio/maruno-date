import type { CharacterId, ProjectColors, ProjectFonts, TemplateId, SiteVariables, BlockType } from '@/types'
import { stringifyOptions, type DateOption } from './dateScenario'

/**
 * ЕДИНЫЙ КАТАЛОГ ШАБЛОНОВ — источник правды и для превью, и для создания
 * приглашения.
 *
 * Ключевое правило прежнее: всё, что показано в карточке, человек получает
 * после нажатия «Выбрать». Сценарий, палитра, шрифты и персонаж отсюда же
 * попадают в getDefaultBlocks(), поэтому превью не может разойтись
 * с результатом.
 *
 * `id` совпадают со значениями колонки `projects.template` и не
 * переименовываются — иначе сломались бы уже созданные приглашения.
 *
 * Шаблоны отличаются не только цветом: у каждого своя раскладка сцены,
 * свой персонаж, свой характер частиц и свой стартовый текст вопросов.
 * Сам сценарий (вопрос → выбор → дата → финал) у них общий — так и
 * задумано: добавить четвёртый шаблон можно, не трогая ни одной сцены.
 */

/** Насколько прямолинейно звучит приглашение — помогает выбирать, а не листать. */
export type Formality = 'нежно' | 'дерзко' | 'спокойно'

/** Направление события. Это приложение целиком про свидания. */
export type EventType = 'date'

/** Стилистическая категория внутри направления. */
export type TemplateStyle =
  | 'уютный' | 'вечерний' | 'игривый' | 'городской'
  | 'кино' | 'сюрприз' | 'минимализм' | 'активный'

/** Тариф, на котором шаблон доступен. */
export type TemplatePlan = 'free' | 'standard'

/** draft — виден только в разработке, published — в каталоге. */
export type TemplateStatus = 'draft' | 'published'

/**
 * Раскладка сцены. Отвечает за то, как экран собран:
 *   center — персонаж сверху, вопрос по центру, варианты столбцом;
 *   card   — содержимое лежит карточкой поверх фона;
 *   stage  — персонаж крупно, вопрос под ним, варианты сеткой.
 */
export type SceneLayout = 'center' | 'card' | 'stage'

/** Характер частиц в момент согласия и на финале. */
export type ParticleKind = 'hearts' | 'sparks' | 'confetti'

export interface TemplateEntry {
  id: TemplateId
  /** Адрес шаблона в каталоге и в ссылках на демо. */
  slug: string
  eventType: EventType
  style: TemplateStyle
  /** Название для человека: характер приглашения, а не «Шаблон 3». */
  name: string
  /** Одна строка о том, кому он подойдёт. */
  tagline: string
  /** Короткое описание: какое настроение, чем отличается. */
  description: string
  formality: Formality
  /** Короткие метки — по ним видно характер до открытия. */
  tags: string[]
  /** Какие сцены входят в приглашение при создании. */
  includes: string[]
  /** Типы сцен, которые шаблон ставит при создании. */
  supportedBlocks: BlockType[]
  /** Маскот по умолчанию. Меняется в редакторе. */
  character: CharacterId
  layout: SceneLayout
  particles: ParticleKind
  /**
   * Тип свидания, который шаблон предлагает по умолчанию. Он предвыбран
   * в мастере создания — «Сеанс на двоих» сразу стоит на «кино».
   * Автор может сменить его: тип задаёт сценарий, а не шаблон.
   */
  defaultDateType: string
  plan: TemplatePlan
  status: TemplateStatus
  /** Порядок показа в каталоге. Меньше — выше. */
  sortOrder: number
  /** Дата последнего изменения оформления шаблона. */
  updatedAt: string
  /** Выключенный шаблон не показывается и не выбирается. */
  active: boolean
  colors: ProjectColors
  fonts: ProjectFonts
  /** Стартовое содержимое сценария. Оно же показано в превью каталога. */
  demo: {
    /** Кто зовёт. */
    sender: string
    /** Главный вопрос первого экрана. */
    question: string
    /** Подзаголовок первого экрана. */
    subtitle: string
    yesLabel: string
    noLabel: string
    /** Что кнопка «Нет» говорит, убегая. */
    taunts: string[]
    /** Вопрос второй сцены. */
    activityQuestion: string
    finalTitle: string
    finalSubtitle: string
  }
}

/** Чем обычно занимаются на свидании. Стартовый набор, автор его правит. */
export const DEFAULT_ACTIVITIES: DateOption[] = [
  { id: 'eat', emoji: '🍔', label: 'Поесть' },
  { id: 'cinema', emoji: '🎬', label: 'В кино' },
  { id: 'walk', emoji: '🚶', label: 'Погулять' },
  { id: 'active', emoji: '🎯', label: 'Активно провести время' },
  { id: 'other', emoji: '✨', label: 'Что-нибудь другое' },
]

export const DEFAULT_FOOD: DateOption[] = [
  { id: 'pizza', emoji: '🍕', label: 'Пицца' },
  { id: 'sushi', emoji: '🍣', label: 'Суши' },
  { id: 'burger', emoji: '🍔', label: 'Бургеры' },
  { id: 'coffee', emoji: '☕', label: 'Кофе и десерт' },
  { id: 'other', emoji: '✨', label: 'Другое' },
]

export const DEFAULT_PAYERS: DateOption[] = [
  { id: 'me', emoji: '💸', label: 'Я угощаю' },
  { id: 'you', emoji: '😏', label: 'Ты' },
  { id: 'fifty', emoji: '🤝', label: '50 / 50' },
  { id: 'surprise', emoji: '🎁', label: 'Пусть будет сюрприз' },
]

/* Уточняющие наборы под конкретный тип свидания. Именно они убирают
   нелогичные повторы: у ужина спрашивают, где ужинать, а не «кино/парк». */
export const DINNER_VENUES: DateOption[] = [
  { id: 'restaurant', emoji: '🍽', label: 'Ресторан' },
  { id: 'cafe', emoji: '☕', label: 'Уютное кафе' },
  { id: 'bar', emoji: '🍷', label: 'Бар' },
  { id: 'home', emoji: '🏠', label: 'Дома, я приготовлю' },
  { id: 'other', emoji: '✨', label: 'Удиви меня' },
]

export const WALK_SPOTS: DateOption[] = [
  { id: 'embankment', emoji: '🌊', label: 'Набережная' },
  { id: 'park', emoji: '🌳', label: 'Парк' },
  { id: 'center', emoji: '🏙', label: 'Центр города' },
  { id: 'rooftop', emoji: '🌆', label: 'Крыша с видом' },
  { id: 'other', emoji: '✨', label: 'Куда ноги приведут' },
]

export const CINEMA_PICKS: DateOption[] = [
  { id: 'comedy', emoji: '😄', label: 'Комедию' },
  { id: 'horror', emoji: '👻', label: 'Ужастик (чтобы было к кому прижаться)' },
  { id: 'new', emoji: '🍿', label: 'Что-нибудь новое' },
  { id: 'yours', emoji: '🎬', label: 'На твой выбор' },
]

export const ACTIVE_PICKS: DateOption[] = [
  { id: 'bowling', emoji: '🎳', label: 'Боулинг' },
  { id: 'skating', emoji: '⛸', label: 'Каток' },
  { id: 'quest', emoji: '🗝', label: 'Квест-рум' },
  { id: 'karting', emoji: '🏎', label: 'Картинг' },
  { id: 'other', emoji: '✨', label: 'Другое' },
]

export const SURPRISE_VIBES: DateOption[] = [
  { id: 'calm', emoji: '🌙', label: 'Спокойно и уютно' },
  { id: 'bright', emoji: '✨', label: 'Ярко и неожиданно' },
  { id: 'any', emoji: '🎲', label: 'Полностью доверяю тебе' },
]

export const DEFAULT_PLACES: DateOption[] = [
  { id: 'restaurant', emoji: '🍽', label: 'Ресторан' },
  { id: 'cinema', emoji: '🎬', label: 'Кино' },
  { id: 'park', emoji: '🌳', label: 'Парк' },
  { id: 'cafe', emoji: '☕', label: 'Кафе' },
  { id: 'other', emoji: '📍', label: 'Другое' },
]

export const OPTIONS_JSON = {
  activities: stringifyOptions(DEFAULT_ACTIVITIES),
  food: stringifyOptions(DEFAULT_FOOD),
  payers: stringifyOptions(DEFAULT_PAYERS),
  places: stringifyOptions(DEFAULT_PLACES),
  dinnerVenues: stringifyOptions(DINNER_VENUES),
  walkSpots: stringifyOptions(WALK_SPOTS),
  cinemaPicks: stringifyOptions(CINEMA_PICKS),
  activePicks: stringifyOptions(ACTIVE_PICKS),
  surpriseVibes: stringifyOptions(SURPRISE_VIBES),
}

/**
 * Мягкая подложка под карточку шаблона в каталоге.
 * Не клипарт и не стоковое фото: только свет и цвет из палитры шаблона.
 */
export function toneBackdrop(colors: ProjectColors, seed = 0): string {
  const { accent, primary, secondary, background } = colors
  const a = 24 + ((seed * 13) % 30)
  const b = 20 + ((seed * 7) % 30)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
<defs>
<linearGradient id="base" x1="0.1" y1="0" x2="0.9" y2="1">
<stop offset="0" stop-color="${background}"/><stop offset="1" stop-color="${accent}"/>
</linearGradient>
<radialGradient id="glowA" cx="${a}%" cy="${b}%" r="66%">
<stop offset="0" stop-color="${primary}" stop-opacity="0.30"/>
<stop offset="1" stop-color="${primary}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="glowB" cx="${100 - a}%" cy="${90 - b}%" r="58%">
<stop offset="0" stop-color="${secondary}" stop-opacity="0.24"/>
<stop offset="1" stop-color="${secondary}" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="1200" height="1600" fill="url(#base)"/>
<rect width="1200" height="1600" fill="url(#glowA)"/>
<rect width="1200" height="1600" fill="url(#glowB)"/>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const TEMPLATE_CATALOG: TemplateEntry[] = [
  {
    id: 'soft-invite',
    slug: 'tiho-i-tyoplo',
    eventType: 'date',
    style: 'уютный',
    name: 'Тихо и тепло',
    tagline: 'Спокойное приглашение без лишнего пафоса',
    description:
      'Светлый экран, много воздуха, тёплая терракота вместо привычного розового. ' +
      'Персонаж появляется мягко, кнопка «Нет» уходит в сторону, а не мечется.',
    formality: 'нежно',
    tags: ['светлый', 'спокойный', 'тёплый'],
    includes: ['Вопрос', 'Чем займёмся', 'Что едим', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'bunny',
    layout: 'center',
    particles: 'hearts',
    defaultDateType: 'other',
    plan: 'free',
    status: 'published',
    sortOrder: 1,
    updatedAt: '2026-09-11',
    active: true,
    colors: { primary: '#D2674A', secondary: '#8A5142', accent: '#F7E5DB', background: '#FDF8F4', text: '#2A1E19' },
    fonts: { heading: 'Onest', body: 'Onest', buttonStyle: 'pill', imageStyle: 'rounded' },
    demo: {
      sender: 'Алишер',
      question: 'Ты хочешь пойти со мной на свидание?',
      subtitle: 'Вопрос всего один. Отвечать честно необязательно 🙂',
      yesLabel: 'Да',
      noLabel: 'Нет',
      taunts: ['Точно?', 'Подумай ещё', 'Не получится 😏', 'Не догонишь', 'Ну пожалуйста'],
      activityQuestion: 'Что ты хочешь?',
      finalTitle: 'Тогда договорились ❤️',
      finalSubtitle: 'Я всё запомнил. Осталось дождаться.',
    },
  },
  {
    id: 'midnight-invite',
    slug: 'posle-zakata',
    eventType: 'date',
    style: 'вечерний',
    name: 'После заката',
    tagline: 'Тёмное приглашение для вечернего свидания',
    description:
      'Глубокий фон, тёплое золото и индиго, крупная антиква. Содержимое лежит ' +
      'карточкой поверх ночного свечения, а частицы — редкие искры.',
    formality: 'спокойно',
    tags: ['тёмный', 'вечерний', 'премиум'],
    includes: ['Вопрос', 'Чем займёмся', 'Что едим', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'cat',
    layout: 'card',
    particles: 'sparks',
    defaultDateType: 'dinner',
    plan: 'free',
    status: 'published',
    sortOrder: 2,
    updatedAt: '2026-09-11',
    active: true,
    colors: { primary: '#E2B564', secondary: '#6F63D6', accent: '#1B1A2B', background: '#100F19', text: '#F1ECE2' },
    fonts: { heading: 'Prata', body: 'Manrope', buttonStyle: 'sharp', imageStyle: 'square' },
    demo: {
      sender: 'Дана',
      question: 'Проведёшь этот вечер со мной?',
      subtitle: 'Один вопрос. И пара уточнений после него.',
      yesLabel: 'Да',
      noLabel: 'Нет',
      taunts: ['Уверен?', 'Ещё раз подумай', 'Мимо', 'Так не выйдет 😏'],
      activityQuestion: 'Чем займёмся?',
      finalTitle: 'Значит, договорились',
      finalSubtitle: 'Буду ждать. Не опаздывай.',
    },
  },
  {
    id: 'playful-invite',
    slug: 'ne-dogonish',
    eventType: 'date',
    style: 'игривый',
    name: 'Не догонишь',
    tagline: 'Приглашение-игра с убегающими кнопками',
    description:
      'Самый живой из трёх: кнопка «Нет» уходит резче, персонаж крупный, ' +
      'варианты выложены сеткой. Коралл и мята вместо розового.',
    formality: 'дерзко',
    tags: ['игровой', 'яркий', 'живой'],
    includes: ['Вопрос', 'Чем займёмся', 'Что едим', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'bear',
    layout: 'stage',
    particles: 'confetti',
    defaultDateType: 'other',
    plan: 'free',
    status: 'published',
    sortOrder: 3,
    updatedAt: '2026-09-11',
    active: true,
    colors: { primary: '#FF6A3D', secondary: '#12A594', accent: '#FFE7D9', background: '#FFFCF8', text: '#221F1D' },
    fonts: { heading: 'Comfortaa', body: 'Nunito', buttonStyle: 'pill', imageStyle: 'rounded' },
    demo: {
      sender: 'Тимур',
      question: 'Пойдёшь со мной сегодня?',
      subtitle: 'Кнопка «Нет» работает. Наверное.',
      yesLabel: 'Да!',
      noLabel: 'Нет',
      taunts: ['Точно?', 'Подумай ещё', 'Не получится 😏', 'Не догонишь', 'Опять мимо', 'Сдавайся'],
      activityQuestion: 'Чем займёмся?',
      finalTitle: 'Всё, договорились ❤️',
      finalSubtitle: 'Отменять поздно.',
    },
  },
  {
    id: 'city-walk',
    slug: 'gorodom-peshkom',
    eventType: 'date',
    style: 'городской',
    name: 'Городом пешком',
    tagline: 'Для тех, кто зовёт просто пройтись вдвоём',
    description:
      'Светлый барвинковый экран и коралловый акцент. Лисёнок, лёгкие сердечки. ' +
      'Настроение вечерней прогулки без повода и пафоса.',
    formality: 'нежно',
    tags: ['прогулка', 'светлый', 'город'],
    includes: ['Вопрос', 'Где гуляем', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'fox',
    layout: 'center',
    particles: 'hearts',
    defaultDateType: 'walk',
    plan: 'free',
    status: 'published',
    sortOrder: 4,
    updatedAt: '2026-09-21',
    active: true,
    colors: { primary: '#F5476E', secondary: '#4C5BD4', accent: '#E4E7FB', background: '#F7F5FF', text: '#1B1930' },
    fonts: { heading: 'Manrope', body: 'Inter', buttonStyle: 'pill', imageStyle: 'rounded' },
    demo: {
      sender: 'Марк',
      question: 'Прогуляешься со мной сегодня?',
      subtitle: 'Без плана. Просто идём, куда захочется.',
      yesLabel: 'Пойдём',
      noLabel: 'Нет',
      taunts: ['Точно нет?', 'А если по набережной?', 'Догоняй', 'Не уйдёшь 😏'],
      activityQuestion: 'Куда сходим?',
      finalTitle: 'Значит, гуляем ❤️',
      finalSubtitle: 'Встречаемся и идём.',
    },
  },
  {
    id: 'cinema-night',
    slug: 'seans-na-dvoih',
    eventType: 'date',
    style: 'кино',
    name: 'Сеанс на двоих',
    tagline: 'Приглашение в кино — тёмное, как зал перед сеансом',
    description:
      'Почти чёрный экран, красный бархат кресел и янтарь попкорна. Панда, ' +
      'редкие искры. Карточка приглашения будто билет на сеанс.',
    formality: 'спокойно',
    tags: ['кино', 'тёмный', 'вечер'],
    includes: ['Вопрос', 'Что смотрим', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'panda',
    layout: 'card',
    particles: 'sparks',
    defaultDateType: 'cinema',
    plan: 'free',
    status: 'published',
    sortOrder: 5,
    updatedAt: '2026-09-21',
    active: true,
    colors: { primary: '#F04E5A', secondary: '#E9B84C', accent: '#221A22', background: '#141017', text: '#F3E9EC' },
    fonts: { heading: 'Prata', body: 'Manrope', buttonStyle: 'sharp', imageStyle: 'square' },
    demo: {
      sender: 'Лена',
      question: 'Сходим в кино вдвоём?',
      subtitle: 'Ты выбираешь фильм. Попкорн на мне.',
      yesLabel: 'Идём',
      noLabel: 'Нет',
      taunts: ['Серьёзно?', 'А если новинку?', 'Мимо', 'Так не пойдёт 😏'],
      activityQuestion: 'Что будем смотреть?',
      finalTitle: 'Тогда до сеанса ❤️',
      finalSubtitle: 'Билеты беру я.',
    },
  },
  {
    id: 'surprise-date',
    slug: 'sekret',
    eventType: 'date',
    style: 'сюрприз',
    name: 'Секрет',
    tagline: 'Ты решаешь всё сам — ей остаётся только довериться',
    description:
      'Фиолет и золото на глубоком фоне, чуть таинственно. Минимум вопросов: ' +
      'человек говорит «да» и настроение — остальное сюрприз.',
    formality: 'дерзко',
    tags: ['сюрприз', 'тёмный', 'загадка'],
    includes: ['Вопрос', 'Настроение', 'Дата и время', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'cat',
    layout: 'stage',
    particles: 'confetti',
    defaultDateType: 'surprise',
    plan: 'free',
    status: 'published',
    sortOrder: 6,
    updatedAt: '2026-09-21',
    active: true,
    colors: { primary: '#C46BF0', secondary: '#F5C542', accent: '#221630', background: '#170F22', text: '#F0E9F5' },
    fonts: { heading: 'Yeseva One', body: 'Montserrat', buttonStyle: 'rounded', imageStyle: 'pill' },
    demo: {
      sender: 'Тамерлан',
      question: 'Доверишься мне на один вечер?',
      subtitle: 'Ничего не спрашивай. Просто скажи «да».',
      yesLabel: 'Доверяюсь',
      noLabel: 'Нет',
      taunts: ['Боишься?', 'Не пожалеешь', 'А вдруг понравится', 'Ну же 😏'],
      activityQuestion: 'В каком ты настроении?',
      finalTitle: 'Договорились ❤️',
      finalSubtitle: 'Место и время пришлю за час.',
    },
  },
  {
    id: 'minimal-rose',
    slug: 'minimum-slov',
    eventType: 'date',
    style: 'минимализм',
    name: 'Минимум слов',
    tagline: 'Белый лист, один вопрос и один цвет',
    description:
      'Чистый белый фон и единственный горячий розовый акцент. Без персонажа, ' +
      'без лишнего — только вопрос и ответ. Для тех, кому неловко от мишуры.',
    formality: 'спокойно',
    tags: ['минимализм', 'белый', 'строго'],
    includes: ['Вопрос', 'Чем займёмся', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'none',
    layout: 'center',
    particles: 'hearts',
    defaultDateType: 'other',
    plan: 'free',
    status: 'published',
    sortOrder: 7,
    updatedAt: '2026-09-21',
    active: true,
    colors: { primary: '#F5306B', secondary: '#8A7680', accent: '#F3EDEF', background: '#FFFFFF', text: '#171017' },
    fonts: { heading: 'Manrope', body: 'Inter', buttonStyle: 'sharp', imageStyle: 'square' },
    demo: {
      sender: 'Аружан',
      question: 'Пойдёшь со мной на свидание?',
      subtitle: 'Один вопрос. Две кнопки.',
      yesLabel: 'Да',
      noLabel: 'Нет',
      taunts: ['Точно?', 'Подумай', 'Мимо'],
      activityQuestion: 'Что ты хочешь?',
      finalTitle: 'Договорились',
      finalSubtitle: 'До встречи.',
    },
  },
  {
    id: 'active-day',
    slug: 'na-drayve',
    eventType: 'date',
    style: 'активный',
    name: 'На драйве',
    tagline: 'Боулинг, каток, картинг — свидание в движении',
    description:
      'Горячий розовый и бирюза на светлом. Пёсик, конфетти, крупные кнопки ' +
      'сеткой. Для активного свидания, а не тихого ужина.',
    formality: 'дерзко',
    tags: ['актив', 'яркий', 'энергия'],
    includes: ['Вопрос', 'Чем займёмся', 'Кто платит', 'Дата и время', 'Место', 'Финал'],
    supportedBlocks: ['date-ask', 'date-choice', 'date-when', 'date-final'],
    character: 'dog',
    layout: 'stage',
    particles: 'confetti',
    defaultDateType: 'active',
    plan: 'free',
    status: 'published',
    sortOrder: 8,
    updatedAt: '2026-09-21',
    active: true,
    colors: { primary: '#FF3D6E', secondary: '#12B39A', accent: '#FFE0E8', background: '#FFF7F8', text: '#1E1116' },
    fonts: { heading: 'Onest', body: 'Nunito', buttonStyle: 'pill', imageStyle: 'rounded' },
    demo: {
      sender: 'Данияр',
      question: 'Проведём этот день активно?',
      subtitle: 'Боулинг, каток или квест — выбираешь ты.',
      yesLabel: 'Го!',
      noLabel: 'Нет',
      taunts: ['Струсил?', 'Догоняй', 'Не уйдёшь', 'Ну же 😏', 'Слабо?'],
      activityQuestion: 'Чем займёмся?',
      finalTitle: 'Всё, договорились ❤️',
      finalSubtitle: 'Готовься, будет весело.',
    },
  },
]

/** Шаблоны, доступные пользователю: активные, опубликованные, по порядку показа. */
export const ACTIVE_TEMPLATES: TemplateEntry[] = TEMPLATE_CATALOG
  .filter((t) => t.active && t.status === 'published')
  .sort((a, b) => a.sortOrder - b.sortOrder)

/** Шрифты, которые нужны каталогу для живых превью. Меньше библиотеки редактора. */
export const CATALOG_FONT_FAMILIES = Array.from(
  new Set(TEMPLATE_CATALOG.flatMap((t) => [t.fonts.heading, t.fonts.body])),
)

export const DEFAULT_TEMPLATE_ID: TemplateId = 'soft-invite'

export function getTemplate(id: TemplateId | string): TemplateEntry {
  return TEMPLATE_CATALOG.find((t) => t.id === id) ?? TEMPLATE_CATALOG.find((t) => t.id === DEFAULT_TEMPLATE_ID)!
}

/**
 * Демо-данные шаблона в формате переменных приглашения.
 * Используются, когда автор не заполнил свои — тогда созданное приглашение
 * выглядит ровно так же, как превью в каталоге.
 */
export function templateDemoVars(tpl: TemplateEntry): Partial<SiteVariables> {
  return {
    sender: tpl.demo.sender,
    character: tpl.character,
    dateType: tpl.defaultDateType,
    question: tpl.demo.question,
    finalTitle: tpl.demo.finalTitle,
  }
}
