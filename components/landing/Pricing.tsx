'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Reveal } from './Reveal'
import { PAID_PLANS_ENABLED, INVITATIONS_PER_ACCOUNT, FREE_INVITATIONS } from '@/lib/featureFlags'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePlan } from '@/lib/subscription'

interface Tier {
  id: 'free' | 'standard'
  name: string
  price: string
  period: string
  note: string
  featured?: boolean
  features: string[]
  cta: string
  // placeholder под будущую оплату (Kaspi / Robokassa / Stripe и т.д.)
  paymentReady: boolean
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Бесплатно',
    price: '0 ₸',
    period: 'сейчас',
    note: 'Чтобы попробовать — без карты',
    /*
     * Состав зависит от того, продаётся ли платный тариф. Пока оплата
     * выключена, бесплатный тариф — это весь продукт целиком, и список
     * обязан это отражать: обещать «одно приглашение», когда доступно
     * десять, значит врать в первом же пункте.
     *
     * Число берётся из lib/featureFlags.ts, а не набирается здесь руками:
     * страница тарифов и кабинет обязаны говорить одно и то же.
     */
    features: [
      `До ${FREE_INVITATIONS} приглашений`,
      'Полный редактор текстов, цветов и персонажа',
      'Все восемь шаблонов',
      'Своя ссылка и PIN-код доступа',
      'Ответ в Telegram или на почту',
    ],
    cta: 'Начать бесплатно',
    paymentReady: true,
  },
  {
    id: 'standard',
    name: 'Стандарт',
    price: '2 000 ₸',
    period: 'за аккаунт',
    note: 'Разовая покупка — доступ навсегда для этой почты',
    featured: true,
    features: [
      `Всё из бесплатного плюс:`,
      `До ${INVITATIONS_PER_ACCOUNT} приглашений на аккаунт`,
      'Дополнительные сцены: «Наша история» и другие',
      'Рассылка ссылки и напоминаний',
      'Приоритетная поддержка',
    ],
    cta: 'Перейти на Стандарт',
    paymentReady: true,
  },
]

export default function Pricing() {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, setPlan } = usePlan()

  /*
   * Тариф переключается по-настоящему: статус сохраняется за аккаунтом
   * и сразу снимает ограничения в кабинете и редакторе. Настоящая
   * платёжка (Kaspi / Stripe) встанет ровно сюда — между нажатием и
   * setPlan; лимиты и интерфейс менять не придётся.
   */
  const handleBuy = (tier: Tier) => {
    if (!user) { router.push('/auth/register'); return }
    if (tier.id === 'standard') {
      if (plan === 'standard') { router.push('/dashboard'); return }
      setPlan('standard')
      toast.success('Тариф «Стандарт» активирован — доступны все сцены и до 10 приглашений')
      router.push('/dashboard')
      return
    }
    // Бесплатный: остаёмся на нём и идём создавать приглашение
    router.push('/dashboard/new')
  }

  /*
   * Пока оплата не подключена, платный тариф не показывается: нажать
   * «Купить» и упереться в заглушку — худший из возможных сценариев.
   * Карточка вернётся сама, когда флаг станет true.
   */
  const visibleTiers = PAID_PLANS_ENABLED ? TIERS : TIERS.filter((t) => t.id === 'free')

  return (
    <section
      id="pricing"
      className="mrn-tone-paper"
      style={{
        // Сверху отступ меньше обычного: над секцией уже стоит заголовок
        // страницы со своим нижним полем, и два отступа подряд читались
        // как забытый пустой экран.
        paddingTop: 'clamp(8px, 1.5vw, 20px)',
        paddingBottom: 'clamp(56px, 9vw, 104px)',
      }}
    >
      {/* Заголовок раздела живёт на странице /pricing — здесь он не дублируется */}
      <div className="mrn-container">
        {/*
          Одна ширина на карточки и на примечание под ними. Раньше сетка
          была ограничена 820px, а текст шёл во всю ширину контейнера —
          из-за этого он и выглядел съехавшим влево от карточек.
        */}
        {/*
          Когда тариф один, карточка выравнивается по левому краю — по той же
          оси, что заголовок страницы и описание над ней. Центрированная узкая
          карточка в широком поле выглядела потерянной, а слева от неё
          оставалась пустота без всякого смысла.
        */}
        <div
          style={{
            maxWidth: visibleTiers.length > 1 ? 820 : 460,
            marginInline: visibleTiers.length > 1 ? 'auto' : 0,
          }}
        >
        <Reveal
          className={`grid items-stretch ${visibleTiers.length > 1 ? 'sm:grid-cols-2' : ''}`}
          style={{ gap: 'var(--gap-grid)' }}
        >
          {visibleTiers.map((tier) => (
            <div
              key={tier.id}
              className={`mrn-card flex flex-col ${tier.featured ? 'mrn-dark' : ''}`}
              style={{
                padding: 'clamp(26px, 3.4vw, 34px)',
                background: tier.featured ? 'var(--color-ink)' : 'var(--color-raised)',
                borderColor: tier.featured ? 'transparent' : 'var(--mrn-line)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="mrn-h3">
                  {tier.name}
                </h3>
                {tier.featured && <span className="mrn-tag">Популярный</span>}
              </div>

              <p
                className="mrn-display"
                style={{
                  fontSize: 'clamp(2.1rem, 4vw, 2.6rem)',
                  marginTop: 18,
                  color: tier.featured ? 'var(--color-paper)' : 'var(--color-ink)',
                }}
              >
                {tier.price}
              </p>
              <p className="mrn-meta" style={{ marginTop: 6 }}>{tier.period}</p>

              <p className="mrn-lead" style={{ marginTop: 14, fontSize: 14.5 }}>{tier.note}</p>

              <ul style={{ listStyle: 'none', margin: '24px 0 0', padding: 0, display: 'grid', gap: 11, flex: 1 }}>
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        marginTop: 3,
                        color: tier.featured ? 'var(--color-paper)' : 'var(--color-punch)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14.5,
                        lineHeight: 1.5,
                        color: tier.featured ? 'rgba(250,247,242,0.78)' : 'var(--color-ink-600)',
                      }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(tier)}
                className={`mrn-btn mrn-btn--block ${
                  tier.featured || tier.id === 'free' ? 'mrn-btn--primary' : 'mrn-btn--secondary'
                }`}
                style={{ marginTop: 28 }}
              >
                {tier.id === 'standard' && plan === 'standard' ? 'Тариф активен' : tier.cta}
              </button>
            </div>
          ))}
        </Reveal>

        <Reveal style={{ marginTop: 'var(--space-6)' }}>
          <p className="mrn-meta" style={{ textAlign: visibleTiers.length > 1 ? 'center' : 'left' }}>
            {PAID_PLANS_ENABLED ? (
              <>
                Оформляя платный тариф, вы принимаете{' '}
                <Link href="/terms" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
                  условия использования
                </Link>
                .
              </>
            ) : (
              <>
                Сейчас сервис бесплатный: все сцены и настройки доступны без оплаты.
                Создавая приглашение, вы принимаете{' '}
                <Link href="/terms" className="mrn-link" style={{ color: 'var(--color-punch)' }}>
                  условия использования
                </Link>
                .
              </>
            )}
          </p>
        </Reveal>
        </div>
      </div>
    </section>
  )
}
