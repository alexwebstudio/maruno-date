import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DateInvitationClient } from './DateInvitationClient'
import { SiteFonts } from '@/components/providers/SiteFonts'
import { publishedContent } from '@/lib/projects'
import { SITE_URL } from '@/lib/seo'
import type { Metadata } from 'next'
import type { Project } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('title')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) return { title: 'Приглашение', robots: { index: false, follow: false } }

  const title = `${data.title} — приглашение`
  const description = 'Вас приглашают. Откройте — там всего пара вопросов.'

  return {
    title: { absolute: title },
    description,
    // У каждого приглашения свой канонический адрес — дублей в индексе не будет
    alternates: { canonical: `${SITE_URL}/${slug}` },
    openGraph: { type: 'website', locale: 'ru_RU', url: `${SITE_URL}/${slug}`, title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PublicInvitationPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) notFound()

  const project = data as Project

  // Адресат видит снимок последней публикации, а не текущий черновик
  // редактора: пока автор правит приглашение, по ссылке остаётся
  // прошлая опубликованная версия.
  const content = publishedContent(project)
  const publicProject: Project = { ...project, ...content }

  // Грузим ровно те два семейства, которые выбраны в приглашении,
  // а не всю библиотеку редактора: первый экран должен открыться сразу.
  const usedFonts = [content.fonts?.heading, content.fonts?.body].filter(Boolean) as string[]

  return (
    <>
      <SiteFonts families={usedFonts} />
      <DateInvitationClient project={publicProject} />
    </>
  )
}
