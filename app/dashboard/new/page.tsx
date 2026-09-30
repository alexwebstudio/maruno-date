'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, Plus } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePlan, PLAN_META } from '@/lib/subscription'
import { siteLimitFor } from '@/lib/featureFlags'
import { createProject, getProjects } from '@/lib/projects'
import { generateSlug } from '@/lib/utils'
import { ACTIVE_TEMPLATES, CATALOG_FONT_FAMILIES, DEFAULT_TEMPLATE_ID, getTemplate, type TemplateEntry } from '@/lib/templateCatalog'
import { TemplatePreview } from '@/components/templates/TemplatePreview'
import { TemplateDemoModal } from '@/components/templates/TemplateDemoModal'
import { SiteFonts } from '@/components/providers/SiteFonts'
import type { TemplateId, Language } from '@/types'
import { DATE_TYPES, getDateType } from '@/lib/dateScenario'
import toast from 'react-hot-toast'

function NewProjectForm() {
  const searchParams = useSearchParams()
  // Шаблон, выбранный в каталоге (?template=...), — иначе выбор пользователя терялся
  const preselected = searchParams.get('template')
  const initialTemplate = ACTIVE_TEMPLATES.some((t) => t.id === preselected)
    ? (preselected as TemplateId)
    : DEFAULT_TEMPLATE_ID

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [template, setTemplate] = useState<TemplateId>(initialTemplate)
  // «Собрать самостоятельно»: сайт создаётся только с главным экраном и подвалом
  const [blank, setBlank] = useState(false)
  const [demo, setDemo] = useState<TemplateEntry | null>(null)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<Language>('ru')
  const [loading, setLoading] = useState(false)
  // Тип свидания — предвыбран из шаблона, дальше меняется на шаге 2.
  const [dateType, setDateType] = useState<string>(getTemplate(initialTemplate).defaultDateType)

  // Выбор шаблона заодно предлагает его тип свидания: «Сеанс на двоих» → кино.
  const chooseTemplate = (id: TemplateId) => {
    setTemplate(id)
    setBlank(false)
    setDateType(getTemplate(id).defaultDateType)
  }

  /*
   * Данные приглашения.
   *
   * Здесь нет ни даты, ни места, ни активности — и это не упущение:
   * их выбирает тот, кому приглашение отправят. Автор задаёт только то,
   * что относится к нему самому: кто зовёт, кого зовёт и как ответить.
   */
  const [sender, setSender] = useState('')
  const [recipient, setRecipient] = useState('')
  const [question, setQuestion] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [telegram, setTelegram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const { user } = useAuth()
  const { plan } = usePlan()
  const router = useRouter()

  // Пока оплата не подключена, лимит одинаков для всех: запирать продукт
  // ограничением, которое нельзя снять покупкой, бессмысленно.
  const SITE_LIMIT = siteLimitFor(plan)

  /*
   * Название нужно только автору — так он отличит приглашения в кабинете.
   * По умолчанию собирается из имён: «Тимур → Айгерим», или просто имя
   * адресата, если он один указан.
   */
  const autoTitle = title.trim()
    || [sender.trim(), recipient.trim()].filter(Boolean).join(' → ')
    || getTemplate(template).name

  const handleCreate = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (!sender.trim()) { toast.error('Напишите, от кого приглашение'); return }
    const finalTitle = autoTitle
    if (!finalTitle) { toast.error('Введите название'); return }
    setLoading(true)
    try {
      const existing = await getProjects(user.id)
      if (existing.length >= SITE_LIMIT) {
        toast.error(
          plan === 'standard'
            ? `Достигнут предел аккаунта: ${SITE_LIMIT} приглашений. Удалите одно из существующих.`
            : `На бесплатном тарифе доступно ${SITE_LIMIT} приглашения. Перейдите на «Стандарт» для 10 — или удалите одно.`,
          { duration: 5000 },
        )
        setLoading(false)
        return
      }
      const project = await createProject(user.id, finalTitle, template, language, {
        sender: sender.trim(),
        recipient: recipient.trim(),
        dateType,
        question: question.trim(),
        contactPhone: contactPhone.trim(),
        instagram: instagram.trim(),
        telegram: telegram.trim(),
        whatsapp: whatsapp.trim(),
      }, { blank })
      toast.success('Приглашение создано')
      router.push(`/dashboard/edit/${project.id}`)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper-2)' }}>
      <SiteFonts families={CATALOG_FONT_FAMILIES} />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Back */}
        <Link href="/dashboard" className="mrn-link inline-flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--color-ink-600)' }}>
          <ArrowLeft size={14} /> Назад
        </Link>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-10">
          {([[1, 'Шаблон'], [2, 'Свидание'], [3, 'Детали']] as const).map(([n, label]) => (
            <div key={n} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step > n ? 'bg-punch text-paper' :
                step === n ? 'bg-ink text-paper' :
                'bg-paper-3 text-ink-400'
              }`}>
                {step > n ? <Check size={14} /> : n}
              </div>
              <span className={`text-sm ${step === n ? 'text-ink font-medium' : 'text-ink-400'}`}>
                {label}
              </span>
              {n < 3 && <div className="w-8 h-px" style={{ background: 'var(--mrn-line-strong)' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose template */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="mrn-h2">Выберите шаблон</h1>
              <p className="mrn-lead" style={{ marginTop: 10, marginBottom: 32, fontSize: 15 }}>
                Сценарий у шаблонов общий — отличаются оформление, персонаж и характер
                анимаций. Всё это меняется позже в редакторе, поэтому выбор
                ни к чему не обязывает.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACTIVE_TEMPLATES.map((tpl) => {
                  const selected = template === tpl.id && !blank
                  return (
                    <div
                      key={tpl.id}
                      className={`template-card mrn-tpl flex flex-col ${selected ? 'selected' : ''}`}
                      style={{ background: 'var(--color-paper)' }}
                    >
                      <div className="relative">
                        <TemplatePreview template={tpl} ratio="3 / 4" />
                        {selected && (
                          <span
                            className="absolute top-3 right-3 flex items-center justify-center"
                            style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--color-punch)', zIndex: 3 }}
                          >
                            <Check size={15} color="#fff" aria-hidden="true" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col" style={{ padding: '16px 18px 18px', textAlign: 'left' }}>
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="mrn-h3" style={{ fontSize: 17 }}>{tpl.name}</h2>
                          <span className="mrn-tag" style={{ flexShrink: 0 }}>{tpl.formality}</span>
                        </div>
                        <p className="mrn-meta" style={{ marginTop: 6 }}>{tpl.tagline}</p>

                        <ul className="flex flex-wrap gap-1.5" style={{ marginTop: 12, listStyle: 'none', padding: 0 }}>
                          {tpl.tags.map((tag) => (
                            <li key={tag} className="mrn-tag" style={{ borderColor: 'transparent', background: 'var(--color-paper-2)' }}>
                              {tag}
                            </li>
                          ))}
                        </ul>

                        <div
                          className="flex items-center justify-between gap-2"
                          style={{ marginTop: 'auto', paddingTop: 16 }}
                        >
                          <button
                            type="button"
                            onClick={() => setDemo(tpl)}
                            className="mrn-btn mrn-btn--sm mrn-btn--ghost mrn-above"
                          >
                            <Eye size={15} aria-hidden="true" /> Посмотреть демо
                          </button>
                          {/* Растянутая кнопка: выбрать можно кликом по всей карточке */}
                          <button
                            type="button"
                            onClick={() => chooseTemplate(tpl.id)}
                            aria-pressed={selected}
                            className="mrn-stretch mrn-btn mrn-btn--sm mrn-btn--ghost"
                            style={{ color: 'var(--color-punch)' }}
                          >
                            {selected ? 'Выбран' : 'Выбрать'}
                            <span className="mrn-sr">— шаблон «{tpl.name}»</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Старт без шаблона */}
              <button
                type="button"
                onClick={() => setBlank(true)}
                aria-pressed={blank}
                className={`template-card w-full ${blank ? 'selected' : ''}`}
                style={{
                  marginTop: 16,
                  padding: 'clamp(20px, 3vw, 26px)',
                  background: 'var(--color-paper)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--mrn-line-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-ink-400)', flexShrink: 0,
                  }}
                >
                  <Plus size={20} />
                </span>
                <span style={{ flex: '1 1 220px' }}>
                  <span className="mrn-h3 block" style={{ fontSize: 17 }}>Собрать самостоятельно</span>
                  <span className="mrn-meta block" style={{ marginTop: 4 }}>
                    Только вопрос и финал — остальные сцены добавите в редакторе
                  </span>
                </span>
                {blank && (
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--color-punch)' }}
                  >
                    <Check size={15} color="#fff" aria-hidden="true" />
                  </span>
                )}
              </button>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="btn-luxury px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 group"
                >
                  <span className="flex items-center gap-2">
                    Далее <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Тип свидания — задаёт сценарий приглашения */}
          {step === 2 && (
            <motion.div
              key="step-datetype"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="mrn-h2">Куда зовёте на свидание?</h1>
              <p className="mrn-lead" style={{ marginTop: 10, marginBottom: 28, fontSize: 15 }}>
                От этого зависит сценарий: у ужина спросят, где ужинать, у кино —
                что смотреть. Выбор можно поменять, тексты — тоже.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DATE_TYPES.map((dt) => {
                  const selected = dateType === dt.id
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDateType(dt.id)}
                      className="text-left transition-all"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px', borderRadius: 'var(--radius-lg)',
                        border: `1.5px solid ${selected ? 'var(--color-punch)' : 'var(--mrn-line-strong)'}`,
                        background: selected ? 'rgba(245,48,107,0.06)' : 'var(--color-paper)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{dt.emoji}</span>
                      <span style={{ flex: 1 }}>
                        <span className="block" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)' }}>{dt.label}</span>
                        <span className="mrn-meta block" style={{ marginTop: 2 }}>{dt.hint}</span>
                      </span>
                      {selected && (
                        <span className="flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--color-punch)', flexShrink: 0 }}>
                          <Check size={14} color="#fff" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-[#1A1016]/50 hover:text-[#1A1016] transition-colors">
                  <ArrowLeft size={14} /> Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-luxury px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 group"
                >
                  <span className="flex items-center gap-2">
                    Далее <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Title & language */}
          {step === 3 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-lg"
            >
              <h1 className="text-3xl md:text-4xl font-light text-[#1A1016] mb-2"
                style={{ fontFamily: 'var(--font-display)' }}>
                Последний шаг
              </h1>
              <p className="text-[#1A1016]/50 text-sm mb-8">
                Всего пара полей. Дату, место и всё остальное выберет тот, кому вы отправите ссылку.
              </p>

              <div className="space-y-6">
                {/* Кто и кому */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#1A1016]/40 mb-2">
                      От кого *
                    </label>
                    <input
                      type="text" value={sender} onChange={(e) => setSender(e.target.value)}
                      placeholder="Ваше имя" className="input-luxury text-[#1A1016]" autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#1A1016]/40 mb-2">
                      Кому
                    </label>
                    <input
                      type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Необязательно" className="input-luxury text-[#1A1016]"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#1A1016]/45 -mt-3">
                  Имя отправителя встанет подписью на финальном экране. Имя адресата — строкой над вопросом.
                </p>

                {/* Главный вопрос */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1A1016]/40 mb-2">
                    Главный вопрос
                  </label>
                  <input
                    type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                    placeholder={getTemplate(template).demo.question}
                    className="input-luxury text-[#1A1016]"
                  />
                  <p className="text-xs text-[#1A1016]/40 mt-2">
                    Оставьте пустым — подставится фраза шаблона. Изменить можно в любой момент.
                  </p>
                </div>

                {/* Название (необязательно) */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1A1016]/40 mb-2">
                    Название в кабинете
                  </label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder={autoTitle} className="input-luxury text-[#1A1016]"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  {autoTitle && (
                    <p className="text-xs text-[#1A1016]/40 mt-2">
                      Ссылка: <span className="font-mono text-[#F5306B]">
                        site.com/{generateSlug(autoTitle) || 'priglashenie'}
                      </span>
                    </p>
                  )}
                </div>

                {/* Контакты — чтобы ответ было куда прислать */}
                <div className="rounded-xl border border-paper-3 overflow-hidden">
                  <button type="button" onClick={() => setShowMore((s) => !s)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#1A1016] hover:bg-paper-2 transition-colors">
                    <span className="font-medium">
                      Как с вами связаться <span className="text-[#1A1016]/40 font-normal">— можно заполнить позже</span>
                    </span>
                    <span className={`transition-transform ${showMore ? 'rotate-180' : ''}`}>⌄</span>
                  </button>
                  {showMore && (
                    <div className="p-4 pt-0 space-y-3">
                      <p className="text-xs text-[#1A1016]/40 leading-relaxed pt-1">
                        Появятся кнопками на финальном экране. Ответы в любом случае придут
                        в раздел «Ответы» этого приглашения.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="Telegram" className="input-luxury text-[#1A1016] text-sm" />
                        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="input-luxury text-[#1A1016] text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" className="input-luxury text-[#1A1016] text-sm" />
                        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Телефон" className="input-luxury text-[#1A1016] text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#1A1016]/40 mb-3">
                    Язык приглашения
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {([['ru', '🇷🇺', 'Русский'], ['kz', '🇰🇿', 'Қазақша']] as const).map(([code, flag, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          if (code === 'kz') { toast('Казахская версия платформы находится в разработке и станет доступна в одном из ближайших обновлений.', { icon: '🇰🇿', duration: 5000 }); return }
                          setLanguage(code)
                        }}
                        className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          language === code
                            ? 'border-[#F5306B] bg-[#F5306B]/5'
                            : 'border-paper-3 hover:border-[#F5306B]/30'
                        } ${code === 'kz' ? 'opacity-70' : ''}`}
                      >
                        <span className="text-2xl">{flag}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-[#1A1016]">{name}</p>
                          {code === 'kz' && <p className="text-[10px] text-[#F5306B]">Скоро</p>}
                        </div>
                        {language === code && code === 'ru' && (
                          <Check size={14} className="text-[#F5306B] ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Выбранный шаблон */}
                <div
                  className="flex items-center gap-3"
                  style={{
                    padding: 14,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--mrn-line)',
                  }}
                >
                  {blank ? (
                    <span
                      aria-hidden="true"
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width: 44, height: 56, borderRadius: 'var(--radius-xs)',
                        border: '1px dashed var(--mrn-line-strong)', color: 'var(--color-ink-400)',
                      }}
                    >
                      <Plus size={18} />
                    </span>
                  ) : (
                    <div
                      className="flex-shrink-0 overflow-hidden"
                      style={{ width: 44, height: 56, borderRadius: 'var(--radius-xs)' }}
                    >
                      <TemplatePreview template={getTemplate(template)} ratio="44 / 56" eager />
                    </div>
                  )}
                  <div>
                    <p className="mrn-eyebrow">{blank ? 'Старт' : 'Выбранный шаблон'}</p>
                    <p style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>
                      {blank ? 'Собрать самостоятельно' : getTemplate(template).name}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="mrn-btn mrn-btn--sm mrn-btn--ghost"
                    style={{ marginLeft: 'auto' }}
                  >
                    Изменить
                  </button>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-sm text-[#1A1016]/50 hover:text-[#1A1016] transition-colors">
                  <ArrowLeft size={14} /> Назад
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !sender.trim()}
                  className="btn-luxury px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 disabled:opacity-50 group"
                >
                  <span className="flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Создаём…
                      </>
                    ) : (
                      <>
                        Создать приглашение
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TemplateDemoModal
        template={demo}
        onClose={() => setDemo(null)}
        onChoose={(tpl) => chooseTemplate(tpl.id)}
      />
    </div>
  )
}

/**
 * useSearchParams требует границы Suspense — иначе страница не проходит
 * пререндер при сборке. Шаблон приходит из каталога параметром ?template=.
 */
export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ background: 'var(--color-paper-2)' }}>
          <Navbar />
        </div>
      }
    >
      <NewProjectForm />
    </Suspense>
  )
}
