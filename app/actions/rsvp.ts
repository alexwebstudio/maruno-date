'use server'

interface RSVPData {
  name: string
  attending: 'yes' | 'no'
  guestCount: number
  /** Комментарий. Необязателен. */
  comment?: string
  projectTitle: string
  projectSlug: string
}

export async function sendRSVPToTelegram(data: RSVPData): Promise<{ ok: boolean }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  // If Telegram not configured — just return ok (still save to DB)
  if (!botToken || !chatId) {
    console.log('RSVP received (no Telegram configured):', data)
    return { ok: true }
  }

  const emoji = data.attending === 'yes' ? '✅' : '❌'
  const statusText = data.attending === 'yes' ? 'Придёт' : 'Не сможет'
  const guestText = data.attending === 'yes' ? `👥 Гостей: ${data.guestCount}` : ''
  const commentText = data.comment?.trim() ? `💬 ${data.comment.trim()}` : ''

  const text = [
    `💌 *Новый ответ на приглашение*`,
    ``,
    `📝 Приглашение: *${data.projectTitle}*`,
    `🔗 date.maruno.kz/${data.projectSlug}`,
    ``,
    `👤 Имя: *${data.name}*`,
    `${emoji} Статус: *${statusText}*`,
    guestText,
    commentText,
    ``,
    `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}`,
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })
    const json = await res.json()
    return { ok: json.ok }
  } catch (err) {
    console.error('Telegram RSVP error:', err)
    return { ok: false }
  }
}

/**
 * Сохранение ответа за конкретным приглашением.
 *
 * Это не «одна из трёх копий» ответа, а основное хранилище: даже когда
 * человек выбрал Telegram или почту, запись всё равно ложится в базу —
 * иначе список гостей зависел бы от того, не потерялось ли сообщение.
 *
 * Ошибка здесь критична и не проглатывается: если ответ не сохранился,
 * гость должен увидеть это и попробовать снова, а не уйти с экраном
 * «Ждём вас!», после которого его никто не ждёт.
 */
export async function saveRSVPToDatabase(
  data: RSVPData & { projectId: string; extra?: Record<string, string> },
): Promise<{ ok: boolean; reason?: string }> {
  if (!data.projectId) {
    return { ok: false, reason: 'Приглашение не определено' }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const row: Record<string, unknown> = {
      project_id: data.projectId,
      name: data.name,
      attending: data.attending,
      guest_count: data.attending === 'yes' ? data.guestCount : 0,
      comment: data.comment?.trim() || null,
      extra: data.extra ?? {},
    }

    const { error } = await supabase.from('rsvp_responses').insert(row)
    if (!error) {
      // Заявка владельцу в Telegram, если он подключил его. Fire-and-forget:
      // гость не должен ждать Telegram, и его сбой не отменяет приём ответа.
      void notifyProjectOwnerTelegram(data)
      return { ok: true }
    }

    // База ещё без колонок comment/extra — миграция не выполнена.
    // Сохраняем то, что схема принимает: потерять ответ целиком хуже,
    // чем потерять комментарий. Но об этом честно пишем в лог.
    if (/column|comment|extra/i.test(error.message)) {
      const { error: legacyError } = await supabase.from('rsvp_responses').insert({
        project_id: data.projectId,
        name: data.name,
        attending: data.attending,
        guest_count: data.attending === 'yes' ? data.guestCount : 0,
      })
      if (legacyError) {
        console.error('RSVP save failed:', legacyError.message)
        return { ok: false, reason: legacyError.message }
      }
      console.warn(
        '[maruno] Ответ сохранён без комментария: выполните ' +
        'supabase/migrations/20260921_guest_responses.sql',
      )
      void notifyProjectOwnerTelegram(data)
      return { ok: true }
    }

    console.error('RSVP save failed:', error.message)
    return { ok: false, reason: error.message }
  } catch (err) {
    console.error('RSVP save error:', err)
    return { ok: false, reason: err instanceof Error ? err.message : 'Неизвестная ошибка' }
  }
}

// Отправка письма-уведомления о RSVP через Resend.
// Архитектура готова: нужно лишь задать RESEND_API_KEY, RSVP_FROM_EMAIL, RSVP_TO_EMAIL.
export async function sendRSVPEmail(data: RSVPData): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.RSVP_TO_EMAIL
  if (!key || !to) return { ok: false, reason: 'not_configured' }

  const from = process.env.RSVP_FROM_EMAIL || 'Maruno <onboarding@resend.dev>'
  const status = data.attending === 'yes' ? 'придёт' : 'НЕ придёт'
  const sentAt = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })
  const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:11px 0;border-bottom:1px solid #F0E9DE"><span style="display:inline-block;width:150px;color:#9A8B76;font-size:13px">${label}</span><span style="color:#2C2017;font-size:15px;${strong ? 'font-weight:600' : ''}">${value}</span></td></tr>`
  const html = `
    <div style="margin:0;padding:28px 12px;background:#F3EEE7;font-family:'Segoe UI',Arial,sans-serif">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(120,90,50,.14)">
        <tr><td style="background:linear-gradient(135deg,#C4A97D,#8B6F47);padding:32px 30px;text-align:center">
          <div style="font-size:30px;margin-bottom:8px">💌</div>
          <div style="color:#fff;font-size:20px;font-weight:600">Новый ответ на приглашение</div>
          <div style="color:rgba(255,255,255,.82);font-size:13px;margin-top:6px">${esc(data.projectTitle)}</div>
        </td></tr>
        <tr><td style="padding:26px 30px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row('Имя', esc(data.name), true)}
            ${row('Статус', status, true)}
            ${data.attending === 'yes' ? row('Количество гостей', String(data.guestCount), true) : ''}
            ${row('Дата отправки', sentAt)}
          </table>
        </td></tr>
        <tr><td style="padding:20px 30px 28px;text-align:center">
          <div style="height:1px;background:#F0E9DE;margin-bottom:16px"></div>
          <div style="color:#B8A48A;font-size:12px">Отправлено через <b style="color:#8B6F47">Maruno</b></div>
        </td></tr>
      </table></td></tr></table>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `Ответ на приглашение: ${data.projectTitle}`, html }),
    })
    return { ok: res.ok }
  } catch (err) {
    console.error('RSVP email error:', err)
    return { ok: false, reason: 'send_failed' }
  }
}


/**
 * Отправка заявки ВЛАДЕЛЬЦУ приглашения в его подключённый Telegram.
 *
 * Канал, который человек подключил в настройках (Настройки → Telegram).
 * Владелец определяется так же, как везде в Maruno — по projects.user_id.
 * Работает через service role (createAdminClient), потому что нужно прочитать
 * чужую связь telegram_connections в обход RLS. Если Telegram не подключён
 * или сервис не настроен — тихо выходим: это дополнительный канал, а не
 * замена сохранению в базе.
 */
async function notifyProjectOwnerTelegram(
  data: RSVPData & { projectId: string; extra?: Record<string, string> },
): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const { sendTelegramMessage, esc } = await import('@/lib/telegram')
    const admin = createAdminClient()
    if (!admin) return

    const { data: project } = await admin
      .from('projects')
      .select('user_id, title, slug')
      .eq('id', data.projectId)
      .maybeSingle()
    if (!project?.user_id) return

    const { data: conn } = await admin
      .from('telegram_connections')
      .select('chat_id')
      .eq('user_id', project.user_id)
      .maybeSingle()
    if (!conn?.chat_id) return

    const lines: string[] = []
    lines.push('💌 <b>Новая заявка</b>')
    lines.push(`Приглашение: <b>${esc(project.title || data.projectTitle)}</b>`)
    lines.push('')
    lines.push(`Имя: <b>${esc(data.name)}</b>`)
    lines.push(`Ответ: <b>${data.attending === 'yes' ? 'Согласие' : 'Отказ'}</b>`)

    // Пройденный сценарий свидания лежит в extra (ключ = подпись сцены)
    for (const [key, val] of Object.entries(data.extra ?? {})) {
      if (val) lines.push(`${esc(key)}: ${esc(val)}`)
    }
    if (data.comment?.trim()) lines.push(`Комментарий: ${esc(data.comment.trim())}`)

    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://maruno.site'
    lines.push('')
    lines.push(`🔗 ${base}/${esc(project.slug || data.projectSlug)}`)
    lines.push(`🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}`)

    await sendTelegramMessage(String(conn.chat_id), lines.join('\n'))
  } catch (err) {
    console.warn('[telegram] notifyProjectOwnerTelegram failed:', err)
  }
}
