'use client'

/**
 * Последняя граница: сбой в корневом макете, когда стили и шрифты
 * могли не загрузиться. Поэтому оформление здесь минимальное и
 * не зависит от дизайн-системы.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#FCF6F5',
          color: '#1A1016',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#77777F',
              margin: 0,
            }}
          >
            Ошибка приложения
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 500, margin: '14px 0 0' }}>
            Сервис временно недоступен
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4A52', marginTop: 14 }}>
            Мы уже знаем о сбое. Ваши сайты и черновики сохранены — перезагрузите
            страницу через минуту.
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: 24,
              height: 48,
              paddingInline: 26,
              border: 0,
              borderRadius: 10,
              background: '#1A1016',
              color: '#FCF6F5',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Перезагрузить
          </button>

          {error.digest && (
            <p style={{ fontSize: 12, color: '#77777F', marginTop: 20 }}>
              Код ошибки: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
