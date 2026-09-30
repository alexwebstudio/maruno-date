'use client'

import { Navbar } from '@/components/ui/Navbar'
import Pricing from '@/components/landing/Pricing'
import { FinalCta } from '@/components/landing/FinalCta'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { Reveal } from '@/components/landing/Reveal'
import { useAuth } from '@/lib/hooks/useAuth'

export default function PricingPageClient() {
  const { user } = useAuth()
  const startHref = user ? '/dashboard' : '/auth/register'

  return (
    <>
      <a href="#content" className="mrn-skip">К содержимому</a>
      <Navbar />

      <main id="content">
        <section
          className="mrn-tone-sand"
          style={{
            paddingTop: 'clamp(104px, 13vh, 148px)',
            paddingBottom: 'clamp(40px, 6vw, 64px)',
          }}
        >
          <div className="mrn-container">
            <Reveal>
              <p className="mrn-eyebrow">Тарифы</p>
              <h1 className="mrn-h1" style={{ marginTop: 16, maxWidth: '20ch' }}>
                Сколько стоит приглашение
              </h1>
              <p className="mrn-lead" style={{ marginTop: 22, maxWidth: '52ch' }}>
                Сейчас конструктор бесплатный — можно собрать и опубликовать приглашение
                без карты. Платный тариф появится позже: 2000 ₸ за аккаунт и до десяти
                приглашений внутри. Разовая покупка, без подписок и ежемесячных списаний.
              </p>
            </Reveal>
          </div>
        </section>

        <Pricing />

        <FinalCta startHref={startHref} />
      </main>

      <SiteFooter />
    </>
  )
}
