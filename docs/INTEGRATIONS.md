# Maruno Date — Документация по интеграциям

Краткое, но полное руководство: как подключить отзывы, e-mail рассылку, обновления, добавлять шаблоны/блоки и сторонние сервисы.

## 1. Отзывы (лендинг)

Отзывы хранятся в таблице `reviews` (Supabase).

- Миграция: `supabase/migrations/20260703_reviews_subscribers.sql` — создаёт `reviews` + RLS (публичное чтение одобренных, публичная вставка).
- Модерация: `lib/moderation.ts` — режет мат/оскорбления/спам-ссылки (RU/KZ, нормализация leet и пробелов).
- Логика: `app/actions/reviews.ts` → `submitReview()` (вставляет `approved=true` сразу) и `getApprovedReviews()`.
- UI: `components/landing/Reviews.tsx`. Оставить отзыв может только авторизованный пользователь; отзыв появляется на сайте моментально (оптимистичная вставка).

**Как включить:** прогнать миграцию в Supabase SQL Editor. Больше ничего не нужно.

## 2. E-mail уведомления с форм (RSVP)

Отправка писем реализована через **Resend** (бесплатный тариф) — роут `app/api/notify-rsvp/route.ts`.

**Env-переменные (`.env.local` / Vercel):**
```
RESEND_API_KEY=re_xxxxxxxx        # ключ с resend.com
RSVP_FROM_EMAIL=Maruno Date <onboarding@resend.dev>   # или свой верифицированный домен
```

Куда придёт письмо — берётся из настроек кабинета (`/dashboard/settings` → «Сообщения с форм» → email; по умолчанию почта аккаунта).

**Поток данных при отправке формы гостем:**
1. Гость заполняет RSVP → `app/actions/rsvp.ts`.
2. Ответ сохраняется в БД и (если настроено) уходит в Telegram-бот.
3. Дополнительно `POST /api/notify-rsvp` c телом `{ to, siteName, guestName, guests, attending, comment }` → письмо владельцу.

Без `RESEND_API_KEY` роут не падает, а возвращает `{ ok:false, reason:'no_key' }` — форма продолжает работать, письмо просто не уходит (честное поведение, без фейка).

**Telegram (альтернатива/дополнение):** `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` в env. Планируется общий бот Maruno Date с подключением в один клик (кнопка в настройках помечена «скоро»).

## 3. Обновления (подписка)

- Таблица `subscribers` (та же миграция, п.1).
- `app/actions/subscribe.ts` → `subscribeToUpdates(email)` (upsert).
- UI: `components/landing/UpdatesSubscribe.tsx`.

Рассылку по подписчикам можно делать тем же Resend (батчами) или выгрузкой email из таблицы.

## 4. Настройки кабинета

- Модель и хранение: `lib/userSettings.ts` (Supabase `user_settings` + резерв в localStorage).
- Миграция: `supabase/migrations/20260703_user_settings.sql`.
- Страница: `app/dashboard/settings/page.tsx` (сайт по умолчанию, безопасность/доступ, сообщения, помощь).

Чтобы настройки сохранялись в облаке (а не только локально) — прогнать миграцию `user_settings`.

## 5. Как добавить новый шаблон

1. Добавить id в тип `TemplateId` (`types/index.ts`).
2. Прописать дефолты в `lib/utils.ts` → `getTemplateDefaults()` / `getDefaultBlocks()`.
3. Добавить карточку в каталог `app/dashboard/new/page.tsx` (массив `TEMPLATES`) и, если нужно, на лендинг (`components/LandingPage.tsx`, массив `TEMPLATES`). Каталоги держать одинаковыми.

## 6. Как добавить новый блок

1. Тип блока — в `types/index.ts` (`BlockData` / union типов блоков).
2. Дефолтный контент — в `lib/utils.ts` (`getDefaultBlocks`).
3. Рендер — новый компонент в `components/blocks/`, подключить в рендерере сайта (`components/templates/PartySite.tsx`).
4. Тумблер/настройки блока — в сайдбаре редактора (`components/editor/EditorSidebar.tsx`).

Рекомендуется каждому блоку дать красивый предпросмотр (миниатюру) в каталоге блоков.

## 7. Сторонние сервисы

- **Supabase** — БД, авторизация, Storage (медиа): `lib/supabase/*`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Resend** — e-mail (см. п.2).
- **Telegram Bot API** — RSVP-уведомления (см. п.2).
- **Оплата (план):** Kaspi Pay / Robokassa для KZ. Точка подключения — `components/landing/Pricing.tsx` (`// TODO(payment)`), а также попап эксклюзива (кнопка «Оплатить»).

## 8. Storage изображений

Загрузка фото — `components/ui/ImagePicker.tsx`: сначала Supabase Storage (бакет `media`), при недоступности — base64 data-URL (работает по опубликованной ссылке у любого гостя). `blob:`-ссылки не сохраняются (иначе у гостей «?»).

Для Storage прогнать `supabase/storage.sql` и создать публичный бакет `media`.
