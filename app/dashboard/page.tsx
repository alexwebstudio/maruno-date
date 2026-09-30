'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Eye, EyeOff, ExternalLink, Copy, Globe, Settings2, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import { getProjects, deleteProject, duplicateProject, publishProject, unpublishProject } from '@/lib/projects'
import { getProjectStatus, STATUS_META, formatMoment } from '@/lib/projectStatus'
import { reportError } from '@/lib/errors'
import { usePlan, PLAN_META } from '@/lib/subscription'
import { Users } from 'lucide-react'
import { PAID_PLANS_ENABLED } from '@/lib/featureFlags'
import { useOnboarding } from '@/lib/hooks/useOnboarding'
import { pickActiveProject } from '@/lib/onboarding'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { Assistant } from '@/components/onboarding/Assistant'
import { EmptyState } from '@/components/dashboard/EmptyState'
import type { Project } from '@/types'
import toast from 'react-hot-toast'

/**
 * Карточка тарифа. Пока оплата не подключена, её не показываем:
 * переключатель «получить Стандарт бесплатно» ничего не объясняет
 * человеку и только создаёт вопрос, за что он платит.
 */
function PlanCard() {
  // Хук вызывается всегда — до любого возврата (правило хуков React).
  const { plan, setPlan, meta } = usePlan()
  if (!PAID_PLANS_ENABLED) return null
  const priceLabel = plan === 'standard' ? 'Бесплатно' : plan === 'start' ? 'Бесплатно' : meta.price
  return (
    <div className="mb-6 bg-white rounded-2xl border p-4 sm:p-5" style={{ borderColor: meta.color + '40' }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white text-lg" style={{ background: meta.color }}>
          {plan === 'standard' ? '⭐' : '✦'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#1A1016]">Тариф: {meta.label}</p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ background: meta.color }}>{priceLabel}</span>
          </div>
          <p className="text-xs text-[#77777F] mt-0.5 leading-snug">{meta.desc}</p>
        </div>
      </div>

      <div className="mt-3.5">
        {plan === 'start' && (
          <button onClick={() => { setPlan('standard'); toast.success('Тариф «Стандарт» активирован 🎉') }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-transform active:scale-95"
            style={{ background: PLAN_META.standard.color }}>
            Получить Стандарт · Бесплатно
          </button>
        )}
        {plan === 'standard' && (
          <button onClick={() => { setPlan('start'); toast('Возвращён базовый тариф', { icon: 'ℹ️' }) }}
            className="text-xs text-ink-400 hover:text-ink-600 underline">Вернуться на базовый</button>
        )}
      </div>
      <p className="text-[10px] text-ink-300 mt-2.5">
        Оплата подключается. Пока «Стандарт» включается бесплатно — со всеми блоками библиотеки.
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { t } = useAppStore()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [fetching, setFetching] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Загрузка может не удаться — тогда показываем состояние с повтором,
  // а не пустой экран «сайтов нет»
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  const fetchProjects = useCallback(async (userId: string) => {
    try {
      const rows = await getProjects(userId)
      setProjects(rows)
      setLoadFailed(false)
    } catch {
      setLoadFailed(true)
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    // Промис-цепочка, а не прямой вызов async-функции: так состояние
    // не обновляется синхронно в теле эффекта
    getProjects(user.id)
      .then((rows) => { setProjects(rows); setLoadFailed(false) })
      .catch(() => setLoadFailed(true))
      .finally(() => setFetching(false))
  }, [user])

  // Обучение показывается по конкретному сайту — тому, с которым работали
  // последним. Это же состояние читает и пишет редактор того же сайта,
  // поэтому пройденный шаг сразу виден в обоих местах.
  const activeProject = pickActiveProject(projects)
  const onboarding = useOnboarding(user, activeProject)
  const { progress } = onboarding
  const showOnboarding = onboarding.visible

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить приглашение? Вместе с ним пропадут все полученные ответы.')) return
    setDeletingId(id)
    try {
      await deleteProject(id)
      setProjects((p) => p.filter((pr) => pr.id !== id))
      toast.success('Приглашение удалено')
    } catch {
      toast.error('Ошибка')
    } finally {
      setDeletingId(null)
    }
  }

  // Публикация обновляет опубликованный снимок. Раньше эта же кнопка
  // на живом сайте снимала его с публикации — отсюда путаница.
  const handlePublish = async (project: Project) => {
    try {
      const updated = await publishProject(project.id)
      setProjects((p) => p.map((pr) => (pr.id === project.id ? { ...pr, ...updated } : pr)))
      toast.success(project.published ? 'Изменения опубликованы' : 'Приглашение опубликовано')
    } catch (err) {
      reportError(err, { action: 'project.publish', meta: { projectId: project.id } },
        'Публикация не удалась. Попробуйте ещё раз')
    }
  }

  const handleUnpublish = async (project: Project) => {
    try {
      await unpublishProject(project.id)
      setProjects((p) => p.map((pr) => (pr.id === project.id ? { ...pr, published: false } : pr)))
      toast.success('Приглашение снято с публикации — ссылка больше не открывается')
    } catch (err) {
      reportError(err, { action: 'project.unpublish', meta: { projectId: project.id } },
        'Не удалось снять с публикации')
    }
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Ссылка скопирована! 🔗')
  }


  const handleDuplicate = async (project: Project) => {
    if (!user) return
    try {
      await duplicateProject(project)
      setProjects(await getProjects(user.id))
      toast.success('Копия создана')
    } catch (err) {
      reportError(err, { action: 'project.duplicate', meta: { projectId: project.id } },
        'Не удалось скопировать приглашение')
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#FCF6F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#F5306B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#1A1016]/40 text-sm">Загружаем...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FCF6F5]">
      <Navbar dark={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="mrn-h1" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
              {t('dashboard_title')}
            </h1>
            <p className="text-[#1A1016]/40 text-sm mt-1">
              {projects.length === 0 ? 'Начните создавать' : `${projects.length} приглашени${projects.length === 1 ? 'е' : 'й'}`}
            </p>
          </div>
        </div>

        {/* Текущий тариф */}
        <PlanCard />

        {/* Единая кнопка настроек сайта */}
        <div className="mb-10">
          <Link href="/dashboard/settings"
            className="group bg-white rounded-2xl border border-[#F5306B]/15 p-4 flex items-center gap-4 hover:border-[#F5306B]/40 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(228, 69, 31,.14)', color: '#1A1016' }}>
              <Settings2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1A1016]">Настройки аккаунта</p>
              <p className="text-xs text-[#77777F]">Шрифты и палитра, безопасность и доступ, сообщения с форм, помощь</p>
            </div>
            <ChevronRight size={18} className="text-[#F5306B] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Чек-лист первого сайта. Скрывается, когда обучение пройдено или отключено */}
        {showOnboarding && projects.length > 0 && (
          <OnboardingChecklist progress={progress} onSkip={onboarding.skip} />
        )}

        {loadFailed ? (
          <EmptyState
            kind={typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'load-error'}
            onRetry={() => { if (user) { setFetching(true); fetchProjects(user.id) } }}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            kind="no-projects"
            onStartTour={() => onboarding.setHintsEnabled(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, i) => {
              // Миниатюра берёт оформление самого проекта: после правок в редакторе
              // палитра могла уйти далеко от исходного шаблона
              const colors = project.colors
              const headingFont = project.fonts?.heading || 'Prata'
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F5306B]/10 proj-card-hover"
                >
                  {/* Preview thumbnail */}
                  <div
                    className="h-40 relative flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(145deg, ${colors.background}, ${colors.accent})` }}
                  >
                    <div className="text-center px-4">
                      <p className="text-xl font-light leading-tight" style={{ color: colors.primary, fontFamily: `'${headingFont}', serif` }}>
                        {project.title}
                      </p>
                      <div className="w-8 h-px mx-auto mt-2 opacity-60" style={{ background: colors.primary }} />
                      <p className="text-xs mt-2 tracking-widest uppercase opacity-40" style={{ color: colors.text }}>
                        {project.template?.replace('-', ' ')}
                      </p>
                    </div>

                    {/* Статус считается из данных: черновик / опубликован /
                        есть неопубликованные изменения / архив */}
                    {(() => {
                      const meta = STATUS_META[getProjectStatus(project)]
                      return (
                        <span
                          className="absolute top-3 left-3"
                          title={meta.hint}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 999,
                            fontSize: 11.5, fontWeight: 500, lineHeight: 1.3,
                            color: meta.color, background: meta.background,
                            maxWidth: 'calc(100% - 24px)',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', flexShrink: 0 }}
                          />
                          {meta.label}
                        </span>
                      )
                    })()}

                    {/* Quick edit overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <Link
                        href={`/dashboard/edit/${project.id}`}
                        className="px-4 py-2 bg-white rounded-xl text-sm font-medium text-[#1A1016] shadow-lg"
                      >
                        ✏️ Редактировать
                      </Link>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 pt-3 pb-1">
                    <h3 className="font-semibold text-[#1A1016] truncate text-sm">{project.title}</h3>
                    <p className="text-xs mt-0.5 font-mono truncate" style={{ color: 'var(--color-punch)' }}>
                      /{project.slug}
                    </p>
                    <p className="mrn-meta" style={{ fontSize: 11.5, marginTop: 6 }}>
                      Изменён: {formatMoment(project.updated_at) ?? '—'}
                      {project.published_at && (
                        <> · Опубликован: {formatMoment(project.published_at)}</>
                      )}
                    </p>
                  </div>

                  {/* Actions row */}
                  <div className="px-4 pb-3 pt-2 flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/dashboard/edit/${project.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FCF6F5] text-[#1A1016] text-xs font-medium hover:bg-[#F5306B]/10 transition-colors"
                    >
                      <Edit2 size={11} /> Редактировать
                    </Link>

                    <Link
                      href={`/dashboard/edit/${project.id}?preview=1`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FCF6F5] text-[#1A1016] text-xs font-medium hover:bg-[#F5306B]/10 transition-colors"
                    >
                      <Eye size={11} /> Предпросмотр
                    </Link>

                    {/*
                      Ответы на приглашение. Человек не должен гадать, куда
                      они приходят: путь «Мои приглашения → приглашение →
                      Ответы» виден прямо
                      в карточке, рядом с остальными действиями.
                    */}
                    <Link
                      href={`/dashboard/guests/${project.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(228,69,31,.10)', color: 'var(--color-punch)' }}
                    >
                      <Users size={11} /> Ответы
                    </Link>

                    <button
                      onClick={() => handlePublish(project)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
                    >
                      <Globe size={11} />
                      {project.published ? 'Опубликовать изменения' : 'Опубликовать'}
                    </button>

                    {project.published ? (
                      <>
                        <Link
                          href={`/${project.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FCF6F5] text-[#1A1016] text-xs font-medium hover:bg-[#F5306B]/10 transition-colors"
                        >
                          <ExternalLink size={11} /> Открыть
                        </Link>
                        <button
                          onClick={() => copyLink(project.slug)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FCF6F5] text-[#1A1016] text-xs font-medium hover:bg-[#F5306B]/10 transition-colors"
                        >
                          <Copy size={11} /> Ссылка
                        </button>
                      </>
                    ) : null}

                    {/* Right-side actions */}
                    <div className="ml-auto flex items-center gap-1.5">
                      {project.published ? (
                        <button
                          onClick={() => handleUnpublish(project)}
                          aria-label="Снять приглашение с публикации"
                          title="Снять с публикации — ссылка перестанет открываться"
                          className="p-2.5 rounded-xl bg-paper-2 text-ink-400 hover:bg-paper-2 hover:text-ink-600 transition-colors"
                        >
                          <EyeOff size={16} />
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleDuplicate(project)}
                        aria-label="Дублировать"
                        className="p-2.5 rounded-xl bg-paper-2 text-ink-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        title="Дублировать"
                      >
                        <Copy size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        aria-label="Удалить"
                        className="p-2.5 rounded-xl bg-paper-2 text-ink-400 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Add new project card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: projects.length * 0.06 }}
            >
              <Link
                href="/dashboard/new"
                className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-[#F5306B]/25 flex flex-col items-center justify-center gap-3 hover:border-[#F5306B] hover:bg-[#F5306B]/5 transition-all group block"
              >
                <div className="w-12 h-12 rounded-full bg-[#F5306B]/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-[#F5306B]/20">
                  <Plus size={22} className="text-[#F5306B]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1A1016]">Новое приглашение</p>
                  <p className="text-xs text-ink-400 mt-0.5">Нажмите для создания</p>
                </div>
              </Link>
            </motion.div>
          </div>
        )}
      </main>

      {/* Помощник: свёрнут в кнопку, раскрывается только по нажатию */}
      {showOnboarding && (
        <Assistant
          progress={progress}
          onSkip={onboarding.skip}
          onDisable={onboarding.disable}
          onFinish={onboarding.markCongratulated}
        />
      )}
    </div>
  )
}
