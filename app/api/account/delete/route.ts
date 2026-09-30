import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Удаление собственного аккаунта.
 *
 * Удалить запись в auth.users может только сервисный ключ, поэтому операция
 * выполняется на сервере. Ключ никогда не попадает в браузер.
 *
 * Удаляется ровно тот пользователь, который сейчас авторизован, — id берётся
 * из сессии, а не из тела запроса. Приглашения, ответы и настройки уходят
 * каскадом по внешним ключам (ON DELETE CASCADE).
 */
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Нужно войти в аккаунт' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !url) {
    return NextResponse.json(
      {
        error:
          'Удаление аккаунта не настроено: на сервере нет SUPABASE_SERVICE_ROLE_KEY. ' +
          'Напишите в поддержку — удалим вручную.',
      },
      { status: 503 },
    )
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Файлы в storage не связаны внешним ключом — убираем их отдельно,
  // иначе после удаления аккаунта в бакете остались бы «сироты».
  try {
    const { data: files } = await admin.storage.from('media').list(user.id, { limit: 1000 })
    if (files?.length) {
      await admin.storage
        .from('media')
        .remove(files.map((f) => `${user.id}/${f.name}`))
    }
  } catch {
    // Не блокируем удаление аккаунта из-за файлов — их можно вычистить позже
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: 'Не удалось удалить аккаунт' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
