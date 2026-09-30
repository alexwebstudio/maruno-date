'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Navbar } from '@/components/ui/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { AccountCard } from '@/components/dashboard/AccountCard'
import {
  loadUserSettings, saveUserSettings, DEFAULT_SETTINGS,
  type UserSettings, type PaletteId,
} from '@/lib/userSettings'
import {
  Settings2, Shield, Mail, HelpCircle, Check, Link2, Lock, EyeOff,
  Smartphone, Monitor, Send, ChevronRight, Save, UserRound,
} from 'lucide-react'

const PALETTES: { id: PaletteId; name: string; colors: string[] }[] = [
  { id: 'gold',      name: 'Золотая',        colors: ['#0F0D0A', '#F5306B', '#F0E8D8'] },
  { id: 'ivory',     name: 'Айвори',          colors: ['#FAF8F3', '#C9A96A', '#8A7F6E'] },
  { id: 'burgundy',  name: 'Бордовая',        colors: ['#5A1A22', '#C08552', '#F3E7D8'] },
  { id: 'pastel',    name: 'Пастельная',      colors: ['#FBEFF1', '#D4829A', '#7C6E74'] },
  { id: 'dark',      name: 'Luxury Dark',     colors: ['#121019', '#B9A06B', '#E6DCC8'] },
  { id: 'sage',      name: 'Botanical Sage',  colors: ['#EEF2E8', '#6B8560', '#2D3520'] },
]

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string; icon?: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = o.v === value
        return (
          <button key={o.v} onClick={() => onChange(o.v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, fontSize: 13.5, cursor: 'pointer',
              fontWeight: active ? 600 : 400,
              background: active ? '#1E1610' : '#fff',
              color: active ? '#F0E4D0' : '#5A4E40',
              border: `1px solid ${active ? '#1E1610' : 'rgba(228, 69, 31,.3)'}`,
              transition: 'all .2s',
            }}>
            {o.icon}{o.label}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: 46, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer', position: 'relative', background: on ? '#F5306B' : '#DDD5C9', transition: 'background .2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20, borderBottom: '1px solid rgba(228, 69, 31,.12)' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1016' }}>{label}</p>
        {hint && <p style={{ fontSize: 12.5, color: '#77777F', marginTop: 3, lineHeight: 1.5 }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Card({ id, icon, title, desc, children }: { id: string; icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 90, background: '#fff', borderRadius: 22, border: '1px solid rgba(228, 69, 31,.16)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 24px', borderBottom: '1px solid rgba(228, 69, 31,.12)', background: 'linear-gradient(120deg,#FBF8F3,#F6EFE3)' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(228, 69, 31,.16)', color: '#1A1016', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
        <div>
          <h2 className="mrn-h3" style={{ fontSize: 19 }}>{title}</h2>
          <p style={{ fontSize: 12.5, color: '#77777F', marginTop: 4 }}>{desc}</p>
        </div>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </section>
  )
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [s, setS] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    loadUserSettings(user.id, user.email || '').then((loaded) => {
      setS(loaded); setReady(true)
    })
  }, [user])

  const patch = (fn: (draft: UserSettings) => void) => {
    setS((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const res = await saveUserSettings(user.id, s)
    setSaving(false)
    setDirty(false)
    void res
    toast.success('Настройки сохранены')
  }

  if (loading || !ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#FCF6F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid #F5306B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  const NAV = [
    { href: '#defaults', label: 'Сайт по умолчанию', icon: <Settings2 size={15} /> },
    { href: '#security', label: 'Безопасность и доступ', icon: <Shield size={15} /> },
    { href: '#messages', label: 'Сообщения с форм', icon: <Mail size={15} /> },
    { href: '#help', label: 'Помощь', icon: <HelpCircle size={15} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FCF6F5' }}>
      <Navbar dark={false} />

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '96px 18px 130px' }}>
        {/* header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ color: '#1A1016', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>← Мои приглашения</Link>
          <h1 className="mrn-h1" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>Настройки кабинета</h1>
          <p style={{ color: '#77777F', fontSize: 14, marginTop: 4 }}>Задайте параметры, которые применяются к новым приглашениям, и настройте доступ и уведомления.</p>
        </div>

        {/* быстрые ссылки-якоря */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
          {NAV.map((n) => (
            <a key={n.href} href={n.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 100, background: '#fff', border: '1px solid rgba(228, 69, 31,.25)', color: '#5A4E40', fontSize: 13, textDecoration: 'none' }}>
              {n.icon}{n.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── НАСТРОЙКИ САЙТА ПО УМОЛЧАНИЮ ── */}
          {user && (
            <Card
              id="account"
              icon={<UserRound size={20} />}
              title="Аккаунт"
              desc="Имя, пароль, сессии и удаление профиля"
            >
              <AccountCard user={user} />
            </Card>
          )}

          <Card id="defaults" icon={<Settings2 size={20} />} title="Оформление по умолчанию" desc="Применяется как старт для новых приглашений">
            <Field label="Базовый размер шрифта">
              <Seg value={s.defaults.fontSize}
                options={[{ v: 'small', label: 'Компактный' }, { v: 'medium', label: 'Средний' }, { v: 'large', label: 'Крупный' }]}
                onChange={(v) => patch((d) => { d.defaults.fontSize = v })} />
            </Field>

            <Field label="Стиль заголовков">
              <Seg value={s.defaults.headingStyle}
                options={[{ v: 'classic', label: 'Классический' }, { v: 'modern', label: 'Современный' }, { v: 'script', label: 'Рукописный' }]}
                onChange={(v) => patch((d) => { d.defaults.headingStyle = v })} />
            </Field>

            <Field label="Стиль кнопок">
              <Seg value={s.defaults.buttonStyle}
                options={[{ v: 'rounded', label: 'Скруглённые' }, { v: 'pill', label: 'Капсула' }, { v: 'sharp', label: 'Прямые' }]}
                onChange={(v) => patch((d) => { d.defaults.buttonStyle = v })} />
            </Field>

            <Field label="Форма изображений" hint="Применяется к фото в блоках истории, галереи и карточках">
              <Seg value={s.defaults.imageStyle}
                options={[{ v: 'rounded', label: 'Скруглённые' }, { v: 'square', label: 'Квадратные' }, { v: 'pill', label: 'Капсула' }, { v: 'circle', label: 'Круглые' }]}
                onChange={(v) => patch((d) => { d.defaults.imageStyle = v })} />
            </Field>

            <Field label="Базовая цветовая палитра" hint="Больше палитр и свои цвета — в редакторе конкретного приглашения">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                {PALETTES.map((p) => {
                  const active = s.defaults.palette === p.id
                  return (
                    <button key={p.id} onClick={() => patch((d) => { d.defaults.palette = p.id })}
                      style={{ textAlign: 'left', padding: 12, borderRadius: 14, cursor: 'pointer', background: '#fff', border: `1.5px solid ${active ? '#F5306B' : 'rgba(228, 69, 31,.2)'}`, position: 'relative' }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {p.colors.map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: 6, background: c, border: '1px solid rgba(0,0,0,.06)' }} />)}
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: '#1A1016' }}>{p.name}</span>
                      {active && <span style={{ position: 'absolute', top: 10, right: 10, color: '#F5306B' }}><Check size={15} /></span>}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Общий визуальный стиль">
              <Seg value={s.defaults.displayType}
                options={[{ v: 'elegant', label: 'Элегантный' }, { v: 'minimal', label: 'Минимализм' }, { v: 'luxury', label: 'Luxury' }]}
                onChange={(v) => patch((d) => { d.defaults.displayType = v })} />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1016' }}>Собирать в первую очередь</p>
                <p style={{ fontSize: 12.5, color: '#77777F', marginTop: 3 }}>С какой версии вы начинаете верстать приглашение</p>
              </div>
              <Seg value={s.defaults.buildFirst}
                options={[{ v: 'mobile', label: 'Мобильная', icon: <Smartphone size={14} /> }, { v: 'desktop', label: 'Десктопная', icon: <Monitor size={14} /> }]}
                onChange={(v) => patch((d) => { d.defaults.buildFirst = v })} />
            </div>
          </Card>

          {/* ── БЕЗОПАСНОСТЬ И ДОСТУП ── */}
          <Card id="security" icon={<Shield size={20} />} title="Безопасность и доступ" desc="Кто сможет открыть приглашение по ссылке">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { v: 'link' as const, icon: <Link2 size={16} />, t: 'Доступ по ссылке', d: 'Сайт открывается всем, у кого есть ссылка' },
                { v: 'password' as const, icon: <Lock size={16} />, t: 'Доступ по паролю / PIN', d: 'Без кода приглашение не откроется — надёжно, если ссылка попадёт в общий чат' },
                { v: 'hidden' as const, icon: <EyeOff size={16} />, t: 'Скрыть от поиска', d: 'Добавляет noindex/nofollow — приглашение не попадёт в Google/Яндекс' },
              ].map((o) => {
                const active = s.security.access === o.v
                return (
                  <button key={o.v} onClick={() => patch((d) => { d.security.access = o.v; if (o.v === 'hidden') d.security.noindex = true })}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', background: active ? 'rgba(228, 69, 31,.08)' : '#fff', border: `1.5px solid ${active ? '#F5306B' : 'rgba(228, 69, 31,.2)'}` }}>
                    <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(228, 69, 31,.14)', color: '#1A1016', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.icon}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1A1016' }}>{o.t}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: '#77777F', marginTop: 2, lineHeight: 1.5 }}>{o.d}</span>
                    </span>
                    {active && <Check size={17} color="#F5306B" style={{ marginTop: 4 }} />}
                  </button>
                )
              })}
            </div>

            {s.security.access === 'password' && (
              <Field label="PIN-код доступа" hint="4–8 цифр. Отправляйте его вместе со ссылкой.">
                <input value={s.security.pin} inputMode="numeric" maxLength={8}
                  onChange={(e) => patch((d) => { d.security.pin = e.target.value.replace(/\D/g, '') })}
                  placeholder="например 2608"
                  style={{ width: 180, padding: '11px 14px', borderRadius: 12, border: '1px solid #e5ddd3', fontSize: 16, letterSpacing: '.3em', outline: 'none', color: '#1A1016' }} />
              </Field>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1016' }}>Скрыть от индексации (noindex)</p>
                <p style={{ fontSize: 12.5, color: '#77777F', marginTop: 3 }}>Приглашение не будет находиться в поисковиках</p>
              </div>
              <Toggle on={s.security.noindex} onChange={(v) => patch((d) => { d.security.noindex = v })} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1016' }}>Сложная приватная ссылка</p>
                <p style={{ fontSize: 12.5, color: '#77777F', marginTop: 3 }}>Неугадываемый адрес вместо простого имени</p>
              </div>
              <Toggle on={s.security.privateSlug} onChange={(v) => patch((d) => { d.security.privateSlug = v })} />
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(228, 69, 31,.08)', border: '1px solid rgba(228, 69, 31,.2)' }}>
              <Shield size={17} color="#1A1016" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: '#6A5D4C', lineHeight: 1.6 }}>
                Самый безопасный вариант для личного приглашения — <b>ссылка + PIN-код</b>. Настройки сохраняются в аккаунте и применяются при публикации.
              </p>
            </div>
          </Card>

          {/* ── СООБЩЕНИЯ С ФОРМ ── */}
          <Card id="messages" icon={<Mail size={20} />} title="Сообщения с форм" desc="Куда приходят ответы на ваши приглашения">
            <Field label="Канал уведомлений">
              <Seg value={s.messages.channel}
                options={[{ v: 'email', label: 'Email' }, { v: 'telegram', label: 'Telegram' }, { v: 'both', label: 'Email + Telegram' }]}
                onChange={(v) => patch((d) => { d.messages.channel = v })} />
            </Field>

            {(s.messages.channel === 'email' || s.messages.channel === 'both') && (
              <Field label="Email для ответов" hint="По умолчанию — почта вашего аккаунта. Можно указать другую.">
                <input value={s.messages.email} type="email"
                  onChange={(e) => patch((d) => { d.messages.email = e.target.value })}
                  placeholder={user?.email || 'you@example.com'}
                  style={{ width: '100%', maxWidth: 360, padding: '11px 14px', borderRadius: 12, border: '1px solid #e5ddd3', fontSize: 14, outline: 'none', color: '#1A1016' }} />
              </Field>
            )}

            {(s.messages.channel === 'telegram' || s.messages.channel === 'both') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: 14, background: '#F0F6FB', border: '1px solid #D6E6F2' }}>
                  <Send size={17} color="#2A7BB8" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12.5, color: '#3A5A72', lineHeight: 1.6 }}>
                    Telegram-уведомления без возни с BotFather: скоро подключение будет в один клик через общий бот Maruno. Пока можно оставить email — ответы точно не потеряются.
                  </p>
                </div>
                <button onClick={() => toast('Подключение Telegram в один клик — скоро 🤍', { icon: '✈️' })}
                  style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, background: '#229ED9', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
                  <Send size={15} /> Подключить Telegram
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(228, 69, 31,.08)', border: '1px solid rgba(228, 69, 31,.2)' }}>
              <Mail size={17} color="#1A1016" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: '#6A5D4C', lineHeight: 1.6 }}>
                Когда приглашение проходят до конца, ответ приходит выбранным способом. Ничего настраивать вручную в коде не нужно.
              </p>
            </div>
          </Card>

          {/* ── ПОДСКАЗКИ ПОМОЩНИКА ── */}
          <Card
            id="hints"
            icon={<HelpCircle size={20} />}
            title="Подсказки помощника"
            desc="Обучение по созданию первого приглашения"
          >
            <Field
              label="Показывать подсказки"
              hint="Помощник в углу кабинета подсказывает следующий шаг и объясняет разницу между сохранением, предпросмотром и публикацией."
            >
              <Toggle
                on={s.onboarding.hintsEnabled}
                onChange={(v) => patch((d) => { d.onboarding.hintsEnabled = v })}
              />
            </Field>

            <Field
              label="Пройти обучение заново"
              hint="Сбрасывает отметку «пройдено» по всем вашим приглашениям. Шаги, которые уже выполнены, останутся закрытыми — список считается из ваших данных."
            >
              <button
                type="button"
                onClick={() => patch((d) => {
                  d.onboarding.hintsEnabled = true
                  // Прогресс хранится по каждому приглашению отдельно, поэтому
                  // «показать снова» снимает отметку у всех сразу
                  for (const site of Object.values(d.onboarding.sites)) {
                    site.finished = false
                    site.congratulated = false
                  }
                })}
                className="mrn-btn mrn-btn--sm mrn-btn--secondary"
                style={{ alignSelf: 'flex-start' }}
              >
                Показать подсказки снова
              </button>
            </Field>
          </Card>

          {/* ── ПОМОЩЬ ── */}
          <Card id="help" icon={<HelpCircle size={20} />} title="Помощь и инструкция" desc="Короткие ответы на частые вопросы">
            {[
              { q: 'Как создать приглашение?', a: 'Нажмите «Создать приглашение», выберите шаблон, впишите своё имя — и правьте вопросы прямо на сценах. Всё сохраняется автоматически.' },
              { q: 'Как поделиться ссылкой?', a: 'После публикации на карточке приглашения есть кнопки «Открыть» и «Ссылка». Скопируйте и отправьте.' },
              { q: 'Где ответы?', a: 'На карточке приглашения есть кнопка «Ответы». Там же можно выбрать, дублировать ли их в Telegram или на почту.' },
              { q: 'Как закрыть приглашение паролем?', a: 'В разделе «Безопасность и доступ» выберите «Доступ по паролю / PIN» и задайте код.' },
            ].map((it) => (
              <details key={it.q} style={{ borderBottom: '1px solid rgba(228, 69, 31,.12)', paddingBottom: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1A1016', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {it.q} <ChevronRight size={16} color="#F5306B" />
                </summary>
                <p style={{ fontSize: 13, color: '#6A5D4C', lineHeight: 1.65, marginTop: 8 }}>{it.a}</p>
              </details>
            ))}
            <a href="https://t.me/sanyamaster200" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: '11px 20px', borderRadius: 12, background: '#fff', border: '1px solid rgba(228, 69, 31,.3)', color: '#1A1016', fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>
              <Send size={15} /> Написать в поддержку
            </a>
          </Card>
        </div>
      </main>

      {/* sticky save bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(228, 69, 31,.2)', padding: '12px 18px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 13, color: dirty ? '#1A1016' : '#77777F' }}>{dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}</p>
          <button onClick={handleSave} disabled={saving || !dirty} className="btn-luxury"
            style={{ padding: '12px 26px', borderRadius: 14, fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving || !dirty ? 0.5 : 1 }}>
            <Save size={15} /> {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
