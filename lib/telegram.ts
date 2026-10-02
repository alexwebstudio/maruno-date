/**
 * Хелперы Telegram Bot API. Только сервер: токен бота читается из
 * TELEGRAM_BOT_TOKEN и никогда не уходит в клиентский бандл.
 */

const API = 'https://api.telegram.org/bot'

export function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null
}

/** @username бота для deep link. Без ведущего @. */
export function botUsername(): string | null {
  return (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '') || null
}

/** Отправить сообщение в чат. Возвращает true при успехе, не бросает. */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = botToken()
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено')
    return false
  }
  try {
    const res = await fetch(`${API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    const json = await res.json().catch(() => ({ ok: false }))
    if (!json.ok) console.warn('[telegram] sendMessage error:', json.description)
    return !!json.ok
  } catch (err) {
    console.error('[telegram] sendMessage failed:', err)
    return false
  }
}

/** Экранирование для HTML parse_mode. */
export function esc(v: unknown): string {
  return String(v ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))
}

/** Криптостойкий токен для deep link. */
export function makeLinkToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
