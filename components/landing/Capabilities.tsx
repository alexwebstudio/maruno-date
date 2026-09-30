'use client'

import { Reveal } from './Reveal'

const CAPABILITIES = [
  {
    title: 'Сцены, а не секции',
    text: 'Приглашение собрано из экранов: вопрос, выбор, дата, финал. Следующий появляется только после ответа на предыдущий — поэтому его дочитывают до конца.',
  },
  {
    title: 'Кнопка «Нет» убегает',
    text: 'Классическая шутка, сделанная аккуратно: кнопка не выходит за экран, не ломает вёрстку и работает пальцем. Механику можно выключить одним переключателем.'
  },
  {
    title: 'Ответ приходит вам',
    text: 'Что выбрали, когда и где — приходит готовой сводкой в кабинет, в Telegram или на почту. Договорённость не теряется в переписке.',
  },
  {
    title: 'Свой стиль',
    text: 'Двадцать шрифтовых пар с кириллицей, восемь готовых стилей и точная настройка цвета. Никакого обязательного розового и сердечек по всему экрану.',
  },
  {
    title: 'Сначала телефон',
    text: 'Ссылку открывают с телефона, поэтому мобильная версия проектируется первой: экран во всю высоту, крупные кнопки, ничего под вырезом и жестовой полосой.',
  },
  {
    title: 'Закрытый доступ',
    text: 'Приглашение можно закрыть PIN-кодом — тогда его откроет только тот, кому вы отправили ссылку, даже если она попадёт в общий чат.',
  },
]

export function Capabilities() {
  return (
    <section className="mrn-section mrn-tone-ink mrn-dark">
      <div className="mrn-container">
        <Reveal className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="mrn-eyebrow">Возможности</p>
            <h2 className="mrn-h2" style={{ marginTop: 14, maxWidth: '14ch' }}>
              Что входит в приглашение
            </h2>
            <p className="mrn-lead" style={{ marginTop: 20, maxWidth: '38ch' }}>
              Блоки, анкета для гостей, музыка и настройки доступа — всё уже собрано.
            </p>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="grid sm:grid-cols-2 gap-x-10">
            {CAPABILITIES.map((item) => (
              <li
                key={item.title}
                style={{
                  paddingBlock: 'clamp(18px, 2.4vw, 24px)',
                  borderTop: '1px solid var(--mrn-line-invert)',
                }}
              >
                <h3 className="mrn-h3" style={{ fontSize: 18 }}>
                  {item.title}
                </h3>
                <p className="mrn-lead" style={{ marginTop: 8, fontSize: 15 }}>{item.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
