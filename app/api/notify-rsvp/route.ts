import { NextRequest, NextResponse } from 'next/server'

/**
 * Отправка e-mail уведомления о новом RSVP.
 *
 * Работает при заданном RESEND_API_KEY (https://resend.com — бесплатный тариф).
 * Env:
 *   RESEND_API_KEY   — ключ Resend
 *   RSVP_FROM_EMAIL  — адрес отправителя (по умолчанию onboarding@resend.dev)
 *
 * Тело запроса (JSON):
 *   { to, siteName, guestName, guests, attending, comment }
 *
 * Если ключа нет — запрос не падает, а возвращает { ok:false, reason:'no_key' },
 * чтобы приём ответов продолжал работать (ответ всё равно сохраняется/уходит в Telegram).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, siteName = 'Ваше приглашение', guestName = 'Ответ', guests, attending, comment } = body || {}

    if (!to) return NextResponse.json({ ok: false, reason: 'no_recipient' }, { status: 400 })

    const key = process.env.RESEND_API_KEY
    if (!key) {
      // честно: без ключа письмо не уходит
      return NextResponse.json({ ok: false, reason: 'no_key' })
    }

    const from = process.env.RSVP_FROM_EMAIL || 'Maruno <onboarding@resend.dev>'
    const attendText = attending === false ? 'НЕ придёт' : 'придёт'
    const sentAt = new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const row = (label: string, value: string, strong = false) => `
      <tr><td style="padding:11px 0;border-bottom:1px solid #F0E9DE">
        <span style="display:inline-block;width:150px;color:#9A8B76;font-size:13px">${label}</span>
        <span style="color:#2C2017;font-size:15px;${strong ? 'font-weight:600' : ''}">${value}</span>
      </td></tr>`
    const html = `
      <div style="margin:0;padding:28px 12px;background:#F3EEE7;font-family:'Segoe UI',Arial,sans-serif">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(120,90,50,.14)">
          <tr><td style="background:linear-gradient(135deg,#C4A97D,#8B6F47);padding:32px 30px;text-align:center">
            <div style="font-size:30px;margin-bottom:8px">💌</div>
            <div style="color:#fff;font-size:20px;font-weight:600">Новая регистрация RSVP</div>
            <div style="color:rgba(255,255,255,.82);font-size:13px;margin-top:6px">${escapeHtml(siteName)}</div>
          </td></tr>
          <tr><td style="padding:26px 30px 6px">
            <p style="color:#6A5D4C;font-size:14px;line-height:1.6;margin:0 0 18px">Гость ответил на ваше приглашение:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${row('Имя', escapeHtml(guestName), true)}
              ${row('Статус', attendText, true)}
              ${guests != null ? row('Количество гостей', String(Number(guests) || 0), true) : ''}
              ${comment ? row('Комментарий', escapeHtml(String(comment))) : ''}
              ${row('Дата отправки', sentAt)}
            </table>
          </td></tr>
          <tr><td style="padding:20px 30px 28px;text-align:center">
            <div style="height:1px;background:#F0E9DE;margin-bottom:16px"></div>
            <div style="color:#B8A48A;font-size:12px">Отправлено через <b style="color:#8B6F47">Maruno</b></div>
          </td></tr>
        </table></td></tr></table>
      </div>`

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `RSVP: ${guestName} — ${siteName}`, html }),
    })

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      return NextResponse.json({ ok: false, reason: 'send_failed', detail }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'error', detail: String(e) }, { status: 500 })
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
