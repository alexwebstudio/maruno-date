'use client'

import { Reveal } from './Reveal'

/**
 * Полноширинная фраза на сливовой плоскости.
 *
 * Задача — пауза между двумя плотными блоками (каталогом и списком
 * возможностей) и место, где голос продукта звучит по-человечески,
 * а не списком преимуществ.
 */
export function QuoteBand() {
  return (
    <section className="mrn-section--tight mrn-tone-night mrn-dark">
      <div className="mrn-container mrn-container--narrow" style={{ textAlign: 'center' }}>
        <Reveal>
          <p
            className="mrn-h2"
            style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.3rem)', textWrap: 'balance' }}
          >
            Сообщение «пойдём куда-нибудь?» остаётся без ответа. Историю,
            которую{' '}<span className="mrn-h1-accent">проходят</span>{' '}
            — доводят до конца
          </p>
          <p className="mrn-meta" style={{ marginTop: 22 }}>
            Поэтому приглашение здесь — это сцены, а не страница
          </p>
        </Reveal>
      </div>
    </section>
  )
}
