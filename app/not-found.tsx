import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-paper)' }}
    >
      <div className="mrn-container mrn-container--narrow" style={{ textAlign: 'center', paddingBlock: 64 }}>
        <p className="mrn-eyebrow">Ошибка 404</p>
        <h1 className="mrn-h1" style={{ marginTop: 16 }}>Страница не найдена</h1>
        <p className="mrn-lead" style={{ marginTop: 16, marginInline: 'auto', maxWidth: '42ch' }}>
          Возможно, ссылка устарела или приглашение ещё не опубликовано.
          Проверьте адрес — или начните собирать свой сайт.
        </p>
        <div className="flex flex-wrap justify-center gap-3" style={{ marginTop: 30 }}>
          <Link href="/" className="mrn-btn mrn-btn--primary">На главную</Link>
          <Link href="/templates" className="mrn-btn mrn-btn--secondary">Посмотреть шаблоны</Link>
        </div>
      </div>
    </main>
  )
}
