'use client'

import { Navbar } from '@/components/ui/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { Hero } from '@/components/landing/Hero'
import { TemplateShowcase } from '@/components/landing/TemplateShowcase'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { QuoteBand } from '@/components/landing/QuoteBand'
import { Capabilities } from '@/components/landing/Capabilities'
import { FinalCta } from '@/components/landing/FinalCta'
import Reviews from '@/components/landing/Reviews'
import UpdatesSubscribe from '@/components/landing/UpdatesSubscribe'
import { SiteFooter } from '@/components/landing/SiteFooter'

export const BRAND = 'Maruno'

/**
 * Главная страница — композиция секций из components/landing.
 *
 * Порядок: сначала объясняем продукт, потом показываем, что получится,
 * и только затем — как это собрать. Раздел «эксклюзивной линейки» убран:
 * он рекламировал то, чего нет, и тянул за собой третий тариф.
 *
 * Тона чередуются, иначе страница читается как одно белое полотно,
 * и держатся на трёх цветах — чернила, кремовый, мандарин.
 */
export default function LandingPage() {
  const { user } = useAuth()

  // Вошедшего ведём в кабинет, нового человека — на регистрацию.
  const startHref = user ? '/dashboard' : '/auth/register'
  const templateHref = (id: string) => (user ? `/dashboard/new?template=${id}` : '/auth/register')

  return (
    <>
      <a href="#content" className="mrn-skip">К содержимому</a>
      <Navbar />

      <main id="content">
        <Hero startHref={startHref} />

        {/* Четыре карточки: ведущая на всю ширину, остальные три закрывают ряд */}
        <TemplateShowcase templateHref={templateHref} limit={4} showAllLink />

        <HowItWorks startHref={startHref} />

        <QuoteBand />

        <Capabilities />

        <Reviews />

        <UpdatesSubscribe />

        <FinalCta startHref={startHref} />
      </main>

      <SiteFooter />
    </>
  )
}
