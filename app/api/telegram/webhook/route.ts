import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage, esc } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * TELEGRAM WEBHOOK
 *
 * Принимает обновления от Telegram Bot API и обрабатывает команду /start с
 * токеном привязки. Весь путь:
 *   /start <token> → проверка токена → привязка Telegram к аккаунту Maruno →
 *   гашение токена → подтверждение пользователю.
 *
 * Пишет через service role (createAdminClient): у webhook нет пользовательской
 * сессии, и RLS его не ограничивает. Всегда отвечает 200 — иначе Telegram
 * будет ретраить одно и то же обновление.
 *
 * Обрабатываемые ситуации (ТЗ п.11):
 *   — повторный /start, устаревший/использованный/неизвестный токен;
 *   — этот Telegram уже привязан к другому аккаунту → понятная ошибка, без
 *     автоперепривязки;
 *   — повторная привязка того же аккаунта → без дублей (upsert по user_id).
 */
export async function POST(req: Request) {
  // Защита вебхука секретом (устанавливается при setWebhook, см. инструкцию).
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const got = req.headers.get('x-telegram-bot-api-secret-token')
    if (got !== secret) return NextResponse.json({ ok: true }) // молча игнорируем чужие запросы
  }

  let update: {
    message?: {
      text?: string
      chat?: { id?: number | string }
      from?: { id?: number | string; username?: string; first_name?: string; last_name?: string }
    }
  }
  try {
    update = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const msg = update.message
  const text = (msg?.text || '').trim()
  const chatId = msg?.chat?.id != null ? String(msg.chat.id) : null
  const from = msg?.from

  // Нас интересует только /start (возможно, с токеном)
  if (!chatId || !from || !text.startsWith('/start')) {
    return NextResponse.json({ ok: true })
  }

  const token = text.split(/\s+/)[1] || ''
  const admin = createAdminClient()

  if (!admin) {
    console.error('[telegram] SUPABASE_SERVICE_ROLE_KEY не задан — привязка невозможна')
    await sendTelegramMessage(chatId, 'Сервис временно недоступен. Попробуйте позже.')
    return NextResponse.json({ ok: true })
  }

  // /start без токена — просто поздоровались
  if (!token) {
    await sendTelegramMessage(
      chatId,
      'Привет! Это бот <b>Maruno</b>.\n\nЧтобы получать сюда заявки с ваших приглашений, откройте ' +
        '<b>Настройки → Сообщения с форм</b> в кабинете Maruno и нажмите «Подключить Telegram».',
    )
    return NextResponse.json({ ok: true })
  }

  // Проверяем токен
  const { data: tokenRow } = await admin
    .from('telegram_link_tokens')
    .select('token, user_id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle()

  const expired = tokenRow && new Date(tokenRow.expires_at).getTime() < Date.now()
  if (!tokenRow || tokenRow.used_at || expired) {
    await sendTelegramMessage(
      chatId,
      'Ссылка для подключения недействительна или устарела. Запросите новую в настройках Maruno.',
    )
    return NextResponse.json({ ok: true })
  }

  const tgUserId = String(from.id)

  // Этот Telegram уже привязан к ДРУГОМУ аккаунту — не перепривязываем молча
  const { data: existingByTg } = await admin
    .from('telegram_connections')
    .select('user_id')
    .eq('tg_user_id', tgUserId)
    .maybeSingle()

  if (existingByTg && existingByTg.user_id !== tokenRow.user_id) {
    await sendTelegramMessage(
      chatId,
      'Этот Telegram уже привязан к другому аккаунту Maruno. Сначала отключите его в настройках того аккаунта.',
    )
    return NextResponse.json({ ok: true })
  }

  // Привязка (upsert по user_id — без дублей при повторном подключении)
  const { error: upsertErr } = await admin
    .from('telegram_connections')
    .upsert(
      {
        user_id: tokenRow.user_id,
        chat_id: chatId,
        tg_user_id: tgUserId,
        username: from.username ?? null,
        first_name: from.first_name ?? null,
        last_name: from.last_name ?? null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (upsertErr) {
    console.error('[telegram] upsert connection error:', upsertErr.message)
    await sendTelegramMessage(chatId, 'Не удалось подключить. Попробуйте ещё раз из настроек Maruno.')
    return NextResponse.json({ ok: true })
  }

  // Гасим токен (повторный /start по нему уже не сработает)
  await admin
    .from('telegram_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  const name = esc(from.first_name || from.username || 'друг')
  await sendTelegramMessage(
    chatId,
    `✅ Готово, ${name}! Telegram подключён к Maruno.\n\nТеперь новые заявки с ваших приглашений будут приходить сюда.`,
  )

  return NextResponse.json({ ok: true })
}
