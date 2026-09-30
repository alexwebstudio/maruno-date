'use client'

import { Navbar } from '@/components/ui/Navbar'
import { TemplateCatalog } from '@/components/templates/TemplateCatalog'
import { FinalCta } from '@/components/landing/FinalCta'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { Reveal } from '@/components/landing/Reveal'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Каталог шаблонов.
 *
 * Клик по карточке передаёт выбранный шаблон в мастер создания параметром
 * ?template= — раньше выбор пользователя терялся по дороге на регистрацию.
 */
export default function TemplatesPageClient() {
  const { user } = useAuth()
  const startHref = user ? '/dashboard/new' : '/auth/register'
  const templateHref = (id: string) => (user ? `/dashboard/new?template=${id}` : '/auth/register')

  return (
    <>
      <a href="#content" className="mrn-skip">К содержимому</a>
      <Navbar />

      <main id="content">
        <section
          className="mrn-tone-sand"
          style={{
            paddingTop: 'clamp(104px, 13vh, 148px)',
            paddingBottom: 'clamp(40px, 6vw, 72px)',
          }}
        >
          <div className="mrn-container">
            <Reveal>
              <p className="mrn-eyebrow">Каталог</p>
              <h1 className="mrn-h1" style={{ marginTop: 16, maxWidth: '20ch' }}>
                Шаблоны{' '}
                <span className="mrn-h1-accent">приглашения</span>
              </h1>
              <p className="mrn-lead" style={{ marginTop: 22, maxWidth: '54ch' }}>
                Восемь характеров под разные свидания: ужин, прогулка, кино, актив,
                сюрприз, минимализм. Сценарий подстроится под тип свидания, а палитру,
                шрифты и персонажа можно сменить в редакторе.
              </p>
            </Reveal>
          </div>
        </section>

        <TemplateCatalog templateHref={templateHref} />

        <FinalCta startHref={startHref} />
      </main>

      <SiteFooter />
    </>
  )
}
