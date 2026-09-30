'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'

const STEPS = [
  {
    n: '01',
    title: 'Выберите шаблон',
    text: 'Три готовых оформления — мягкое, тёмное и игривое. Сценарий у них общий, а палитра, шрифты, персонаж и характер анимаций разные. Поменять можно в любой момент.',
  },
  {
    n: '02',
    title: 'Поправьте вопросы',
    text: 'Главный вопрос, варианты ответов, подписи кнопок и финал правятся прямо на сцене — кликом по нужной строке. Ничего искать в настройках не нужно.',
  },
  {
    n: '03',
    title: 'Отправьте ссылку',
    text: 'Приглашение публикуется по своему адресу и открывается с любого телефона. Ответ приходит вам, а правки попадают в ссылку только после нажатия «Опубликовать».',
  },
]

export function HowItWorks({ startHref }: { startHref: string }) {
  return (
    <section className="mrn-section mrn-tone-paper">
      <div className="mrn-container">
        <Reveal className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="mrn-eyebrow">Как это работает</p>
            <h2 className="mrn-h2" style={{ marginTop: 14, maxWidth: '17ch' }}>
              Приглашение собирается за полчаса
            </h2>
            <p className="mrn-lead" style={{ marginTop: 20, maxWidth: '40ch' }}>
              Три шага, ничего не нужно верстать и настраивать. Достаточно
              знать, кого вы хотите позвать.
            </p>
            <Link href={startHref} className="mrn-btn mrn-btn--primary" style={{ marginTop: 28 }}>
              Начать <ArrowRight size={16} />
            </Link>
          </div>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'clamp(18px, 3vw, 32px)',
                  paddingBlock: 'clamp(22px, 3vw, 30px)',
                  borderTop: i === 0 ? 'none' : '1px solid var(--mrn-line)',
                }}
              >
                <span
                  className="mrn-h3"
                  aria-hidden="true"
                  style={{ color: 'var(--color-punch)', fontSize: 15, letterSpacing: '0.08em', paddingTop: 4 }}
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="mrn-h3">{step.title}</h3>
                  <p className="mrn-lead" style={{ marginTop: 8, fontSize: 15.5, maxWidth: '52ch' }}>
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
