'use client'
import { SiteFooter } from '@/components/landing/SiteFooter'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/ui/Navbar'
import { Reveal } from '@/components/landing/Reveal'
import { Sparkles, HelpCircle, Rocket, X, Clock, ArrowRight } from 'lucide-react'

type Article = {
  id: string
  icon: typeof Rocket
  tag: string
  title: string
  desc: string
  read: string
  body: { h?: string; p?: string; list?: string[] }[]
}

const ARTICLES: Article[] = [
  {
    id: 'guide',
    icon: Rocket,
    tag: 'Гайд',
    read: '4 мин',
    title: 'Как собрать приглашение на свидание за полчаса',
    desc: 'Пошагово: от выбора шаблона до ссылки, которую можно отправить одним сообщением.',
    body: [
      { p: 'Приглашение на свидание в Maruno — не страница, которую читают, а маленькая история, которую проходят: вопрос, выбор, дата, финал. Ниже — весь путь от нуля до готовой ссылки.' },
      { h: 'Шаг 1. Выберите шаблон' },
      { p: 'Нажмите «Создать приглашение» и выберите одно из трёх оформлений: «Тихо и тепло», «После заката» или «Не догонишь». Сценарий у них общий, а палитра, шрифты, персонаж и характер анимаций разные. Поменять всё это можно позже, поэтому на старте о деталях думать не нужно.' },
      { h: 'Шаг 2. Напишите свой вопрос' },
      { p: 'Стандартное «Ты хочешь пойти со мной на свидание?» работает хуже вашей собственной фразы. Нажмите на вопрос прямо на первой сцене и напишите то, что сказали бы вслух.' },
      { h: 'Шаг 3. Поправьте варианты ответов' },
      { p: 'Сцены выбора приходят с готовыми наборами — «Поесть / Кино / Погулять», «Пицца / Суши / Бургеры». Под вариантами есть поле, где их можно переписать, удалить лишние и добавить свои.' },
      { h: 'Шаг 4. Проверьте, как это выглядит' },
      { p: 'Кнопка «Предпросмотр» проходит сценарий по-настоящему: нажмите «Да», попробуйте поймать «Нет», выберите день и место. Ответы при этом никуда не сохраняются — это черновик.' },
      { list: [
        'Проверьте приглашение на телефоне: его откроют именно там',
        'Убедитесь, что подписаны — имя стоит на финальном экране',
        'Оставьте хотя бы один контакт: Telegram или WhatsApp',
      ] },
      { h: 'Шаг 5. Опубликуйте и отправьте' },
      { p: 'Публикация — единственное действие, которое меняет то, что откроется по ссылке. Автосохранение пишет только в черновик, поэтому править приглашение можно сколько угодно и после отправки.' },
    ],
  },
  {
    id: 'templates',
    icon: Sparkles,
    tag: 'Разбор',
    read: '3 мин',
    title: 'Три шаблона: чем они отличаются',
    desc: 'Почему «просто поменять цвет» недостаточно и как выбрать под свой характер.',
    body: [
      { p: 'Шаблоны в Maruno Date отличаются не только палитрой. У каждого своя раскладка сцены, свой персонаж и свой характер анимаций — от того, насколько резко убегает кнопка «Нет», до того, что взлетает в воздух после согласия.' },
      { h: 'Тихо и тепло' },
      { p: 'Светлый экран, терракота на кремовом, много воздуха. Персонаж появляется мягко, кнопка «Нет» уходит в сторону, а не мечется. Для приглашения, которое отправляют одному человеку, а не в шутку в общий чат.' },
      { h: 'После заката' },
      { p: 'Тёмный фон, тёплое золото и индиго, крупная антиква. Содержимое лежит карточкой поверх ночного свечения, частицы — редкие искры вместо конфетти. Для вечернего свидания: ужин, бар, концерт.' },
      { h: 'Не догонишь' },
      { p: 'Самый живой: кнопка уходит резче, персонаж крупный и реагирует на каждое действие, варианты выложены сеткой. Коралл и мята вместо розового. Для тех, кто зовёт с улыбкой.' },
      { h: 'Что общего' },
      { p: 'Сценарий. Вопрос → чем займёмся → что едим → кто платит → когда → куда → финал. Любую сцену можно выключить, переставить или добавить новую, поэтому выбор шаблона ни к чему не обязывает.' },
    ],
  },
  {
    id: 'runaway',
    icon: HelpCircle,
    tag: 'Механика',
    read: '3 мин',
    title: 'Кнопка «Нет», которая убегает: как это работает',
    desc: 'Главная шутка приглашения — и как сделать так, чтобы она не раздражала.',
    body: [
      { p: 'Убегающая кнопка «Нет» — самая узнаваемая часть такого приглашения. Сделанная неаккуратно, она ломает вёрстку, уезжает за экран и превращается в баг. В Maruno она устроена так, чтобы этого не случилось.' },
      { h: 'Она не выходит за экран' },
      { p: 'Кнопка остаётся в потоке страницы: «побег» — это только сдвиг, а не перемещение по координатам окна. Границы считаются от размеров сцены, поэтому горизонтальной прокрутки не появляется даже на узком телефоне.' },
      { h: 'Она работает пальцем' },
      { p: 'На телефоне нет наведения, поэтому побег запускается прикосновением, а само нажатие гасится. Палец не успевает поймать кнопку — но и промахнуться мимо экрана она не может.' },
      { h: 'Она не бесит' },
      { p: 'После нескольких попыток кнопка слегка уменьшается и меняет подпись: «Точно?», «Подумай ещё», «Не догонишь». Уменьшается до предела, ниже которого в неё уже не попасть пальцем, — и на этом останавливается.' },
      { h: 'Её можно выключить' },
      { list: [
        'Откройте настройки первой сцены — значок шестерёнки',
        'Переключатель «Кнопка „Нет“ убегает»',
        'Там же меняются фразы, которыми она дразнит',
      ] },
      { p: 'Выключите её, если приглашение должно быть серьёзным. Ту же механику можно включить на другой сцене — например, чтобы уворачивался вариант «Ты» в вопросе про то, кто платит.' },
    ],
  },
]

export default function BlogPageClient() {
  const [open, setOpen] = useState<Article | null>(null)

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
      window.addEventListener('keydown', onEsc)
      return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onEsc) }
    }
  }, [open])

  return (
    <>
      <a href="#content" className="mrn-skip">К содержимому</a>
      <Navbar />

      <main id="content">
        <section
          style={{
            background: 'var(--color-paper)',
            paddingTop: 'clamp(104px, 13vh, 148px)',
            paddingBottom: 'clamp(28px, 4vw, 44px)',
          }}
        >
          <div className="mrn-container">
            <Reveal>
              <p className="mrn-eyebrow">Советы</p>
              <h1 className="mrn-h1" style={{ marginTop: 16, maxWidth: '18ch' }}>
                Как собрать приглашение и ничего не забыть
              </h1>
              <p className="mrn-lead" style={{ marginTop: 20, maxWidth: '52ch' }}>
                Гайды по сборке интерактивного приглашения, разбор шаблонов и объяснение механик.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mrn-section--tight" style={{ background: 'var(--color-paper)', paddingTop: 0 }}>
          <div className="mrn-container">
            <Reveal as="ul" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {ARTICLES.map((a) => (
                <li key={a.id} style={{ borderTop: '1px solid var(--mrn-line)' }}>
                  <button
                    type="button"
                    onClick={() => setOpen(a)}
                    className="mrn-article-row"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 0,
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 'clamp(10px, 2vw, 28px)',
                      alignItems: 'baseline',
                      paddingBlock: 'clamp(22px, 3vw, 30px)',
                      paddingInline: 0,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="mrn-eyebrow" style={{ color: 'var(--color-punch)' }}>{a.tag}</span>
                      <span className="mrn-meta inline-flex items-center gap-1.5">
                        <Clock size={13} aria-hidden="true" /> {a.read}
                      </span>
                    </span>

                    <span className="block">
                      <span className="mrn-h3 block">{a.title}</span>
                      <span className="mrn-lead block" style={{ marginTop: 8, fontSize: 15, maxWidth: '56ch' }}>
                        {a.desc}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ marginTop: 14, color: 'var(--color-punch)', fontSize: 14, fontWeight: 500 }}
                      >
                        Читать <ArrowRight size={15} aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,22,.6)', zIndex: 80 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={open.title}
              style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', pointerEvents: 'none' }}
            >
              <article
                data-lenis-prevent
                className="mrn-card"
                style={{ pointerEvents: 'auto', width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--mrn-shadow-lift)' }}
              >
                <div
                  className="flex items-start justify-between gap-4"
                  style={{
                    position: 'sticky', top: 0, zIndex: 2,
                    background: 'var(--color-paper)',
                    padding: 'clamp(20px, 3vw, 28px)',
                    borderBottom: '1px solid var(--mrn-line)',
                  }}
                >
                  <div>
                    <p className="mrn-eyebrow" style={{ color: 'var(--color-punch)' }}>{open.tag} · {open.read}</p>
                    <h2 className="mrn-h2" style={{ marginTop: 8, fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)' }}>{open.title}</h2>
                  </div>
                  <button onClick={() => setOpen(null)} className="mrn-icon-btn" aria-label="Закрыть статью" style={{ flexShrink: 0 }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: 'clamp(20px, 3vw, 28px)' }}>
                  {open.body.map((b, i) => {
                    if (b.h) return <h3 key={i} className="mrn-h3" style={{ margin: '26px 0 10px' }}>{b.h}</h3>
                    if (b.list) return (
                      <ul key={i} style={{ margin: '4px 0 14px', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                        {b.list.map((li, j) => (
                          <li key={j} style={{ position: 'relative', paddingLeft: 20, color: 'var(--color-ink-600)', fontSize: 15.5, lineHeight: 1.6 }}>
                            <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 11, width: 10, height: 1, background: 'var(--color-punch)' }} />
                            {li}
                          </li>
                        ))}
                      </ul>
                    )
                    return <p key={i} style={{ color: 'var(--color-ink-600)', fontSize: 16, lineHeight: 1.75, margin: '0 0 14px' }}>{b.p}</p>
                  })}

                  <div
                    className="flex flex-wrap items-center justify-between gap-3"
                    style={{ marginTop: 30, paddingTop: 22, borderTop: '1px solid var(--mrn-line)' }}
                  >
                    <span className="mrn-meta">Готовы попробовать?</span>
                    <Link href="/dashboard/new" onClick={() => setOpen(null)} className="mrn-btn mrn-btn--primary mrn-btn--sm">
                      Создать сайт <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SiteFooter />

      <style>{`
        .mrn-article-row { grid-template-columns: 1fr; }
        .mrn-article-row:hover .mrn-h3 { color: var(--color-punch); }
        .mrn-article-row .mrn-h3 { transition: color var(--mrn-t) var(--mrn-ease); }
        @media (min-width: 768px) { .mrn-article-row { grid-template-columns: 220px 1fr; } }
      `}</style>
    </>
  )
}
