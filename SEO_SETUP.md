# SEO и подключение wedding.maruno.site

Документ описывает, что настроено в коде и что нужно сделать руками при
выкладке. Позиции в поиске здесь не обещаются и обещаться не могут — задача
документа в том, чтобы поисковые системы корректно видели сайт.

---

## 1. Схема доменов

| Адрес | Назначение |
|---|---|
| `maruno.site` | основной бренд, отдельный проект |
| `wedding.maruno.site` | свадебное направление — **этот репозиторий** |
| `www.wedding.maruno.site` | склеивается 301-редиректом на адрес без `www` |

Каждое направление — отдельный деплой со своим доменом. Общая у них
только база Supabase (см. `docs/ACCOUNTS_ARCHITECTURE.md`).

---

## 2. DNS-записи

Настраиваются у регистратора домена `maruno.site` (там, где лежит его зона).

### Если хостинг — Vercel

| Тип | Имя | Значение |
|---|---|---|
| `CNAME` | `wedding` | `cname.vercel-dns.com` |
| `CNAME` | `www.wedding` | `cname.vercel-dns.com` |

Вторая запись нужна, только если хотите, чтобы `www.wedding.maruno.site`
открывался и корректно редиректил. Без неё адрес просто не будет
резолвиться — это тоже допустимо.

### Если хостинг даёт IP-адрес

| Тип | Имя | Значение |
|---|---|---|
| `A` | `wedding` | IP сервера |
| `AAAA` | `wedding` | IPv6, если есть |

**TTL:** 3600 или «Auto». Обновление занимает от нескольких минут до
нескольких часов.

**Проверка:**

```bash
dig +short wedding.maruno.site
```

---

## 3. Подключение домена на хостинге

### Vercel

1. Проект → **Settings → Domains → Add**.
2. Ввести `wedding.maruno.site`, подтвердить.
3. Дождаться статуса **Valid Configuration** — сертификат HTTPS выпускается автоматически.
4. Если добавляли `www.wedding.maruno.site`, оставить его как есть: редирект
   на адрес без `www` выполняет сам код (`next.config.ts`).

HTTPS отдельно включать не нужно — Vercel выпускает сертификат и
принудительно переводит трафик на HTTPS.

---

## 4. Переменные окружения

| Переменная | Значение на проде | Зачем |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://wedding.maruno.site` | canonical, Open Graph, sitemap, robots, редирект с `www` |
| `NEXT_PUBLIC_SUPABASE_URL` | адрес проекта Supabase | доступ к базе |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный ключ | доступ к базе |
| `SUPABASE_SERVICE_ROLE_KEY` | сервисный ключ | удаление аккаунта, **только сервер** |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | по желанию | уведомления о RSVP |
| `RESEND_API_KEY`, `RSVP_FROM_EMAIL`, `RSVP_TO_EMAIL` | по желанию | письма о RSVP |

> **Важно.** Пока `NEXT_PUBLIC_APP_URL` не задан, canonical и sitemap
> собираются с запасным адресом `https://maruno.kz`. Задайте переменную
> до первой индексации, иначе поисковики получат ссылки на чужой домен.

Не добавляйте префикс `NEXT_PUBLIC_` к сервисному ключу — он попадёт в браузер.

---

## 5. Что уже настроено в коде

| Что | Где |
|---|---|
| `metadataBase`, шаблон заголовков `%s — Maruno Wedding` | `app/layout.tsx` |
| `title` и `description` на каждой публичной странице | серверные обёртки `page.tsx` |
| `canonical` | `lib/seo.ts` → `pageMetadata()` |
| Open Graph и Twitter Cards | там же |
| `robots.txt` | `app/robots.ts` |
| `sitemap.xml` | `app/sitemap.ts` |
| Манифест | `app/manifest.ts` |
| Иконки | `public/icon.svg`, `app/favicon.ico` |
| Schema.org (`WebApplication`) | `app/layout.tsx` |
| Редирект `www` → без `www` | `next.config.ts` |
| Заголовок `X-Robots-Tag` для служебных разделов | `next.config.ts` |
| Один `H1` на страницу, иерархия `H2`/`H3` | компоненты публичной части |

---

## 6. Какие страницы закрыты и почему

| Раздел | Статус | Причина |
|---|---|---|
| `/`, `/templates`, `/pricing`, `/blog` | **индексируются** | маркетинговые страницы, ради них и приходят из поиска |
| `/<slug>` — опубликованные приглашения | **индексируются** | публичны по замыслу, у каждого свой `canonical` |
| `/privacy`, `/terms` | `noindex, follow` | юридические тексты, дублируются между направлениями |
| `/auth/*` | `noindex` + `Disallow` + `X-Robots-Tag` | формы входа не должны попадать в выдачу |
| `/dashboard/*` | `noindex` + `Disallow` + `X-Robots-Tag` | приватный раздел |
| `/api/*` | `Disallow` | служебные маршруты |

Предпросмотр отдельного адреса не имеет — он живёт внутри редактора
(`/dashboard/edit/<id>?preview=1`), а этот раздел закрыт целиком.

Владелец приглашения может дополнительно закрыть свой сайт: **Настройки →
Безопасность и доступ**.

---

## 7. Как работает canonical

Каждая страница объявляет свой единственный правильный адрес:

- маркетинговые страницы — `https://wedding.maruno.site/<путь>`;
- приглашение гостя — `https://wedding.maruno.site/<slug>`.

Это снимает три типичные причины дублей: адрес с `www` и без, ссылки с
метками `?utm_...`, и один и тот же сайт, открытый по разным путям.
Дополнительно 301-редирект убирает `www` ещё до отдачи страницы.

---

## 8. Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → **Добавить ресурс**.
2. Тип **Ресурс с префиксом в URL**, адрес: `https://wedding.maruno.site`.
3. Подтверждение — способ **HTML-тег**: скопируйте `content` из выданного тега.
4. Добавьте его в `app/layout.tsx`:

```ts
export const metadata: Metadata = {
  // …
  verification: { google: 'КОД_ИЗ_SEARCH_CONSOLE' },
}
```

5. Задеплойте, вернитесь в Search Console и нажмите **Подтвердить**.
6. **Файлы Sitemap** → добавить `sitemap.xml` → отправить.

---

## 9. Яндекс Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru) → **Добавить сайт**.
2. Адрес: `https://wedding.maruno.site`.
3. Подтверждение — **Мета-тег**, добавьте в те же `verification`:

```ts
verification: {
  google: 'КОД_GOOGLE',
  yandex: 'КОД_ЯНДЕКСА',
},
```

4. После подтверждения: **Индексирование → Файлы Sitemap** → добавить
   `https://wedding.maruno.site/sitemap.xml`.
5. Там же в **Переобход страниц** можно вручную отправить главную и каталог.

---

## 10. Проверка после выкладки

```bash
# домен резолвится и отдаёт HTTPS
curl -sI https://wedding.maruno.site | head -1

# www склеивается 301-м
curl -sI https://www.wedding.maruno.site | grep -i "location\|HTTP/"

# служебные разделы закрыты
curl -s https://wedding.maruno.site/robots.txt
curl -sI https://wedding.maruno.site/dashboard | grep -i x-robots-tag

# карта сайта отдаётся
curl -s https://wedding.maruno.site/sitemap.xml | head -20

# у страниц разные заголовки и свой canonical
for p in "" templates pricing blog; do
  curl -s "https://wedding.maruno.site/$p" | grep -o "<title>[^<]*</title>"
done
```

Дополнительно стоит прогнать главную и каталог через
[Rich Results Test](https://search.google.com/test/rich-results) — он покажет,
корректно ли прочитана разметка Schema.org.

---

## 11. Как проверять индексацию дальше

- **Google:** запрос `site:wedding.maruno.site` в поиске; в Search Console —
  раздел **Индексирование → Страницы**.
- **Яндекс:** запрос `site:wedding.maruno.site`; в Вебмастере —
  **Индексирование → Страницы в поиске**.

Первые страницы обычно появляются в течение нескольких дней после отправки
карты сайта, полная переиндексация занимает недели. Сроки и позиции зависят
от поисковых систем и не гарантируются.

---

## 12. Что сделать после деплоя — коротким списком

1. Задать `NEXT_PUBLIC_APP_URL=https://wedding.maruno.site`.
2. Подключить домен на хостинге, дождаться сертификата.
3. Проверить командами из раздела 10.
4. Подтвердить сайт в Search Console и Вебмастере, вставить коды в `verification`.
5. Отправить `sitemap.xml` в обе панели.
6. Добавить Redirect URL `https://wedding.maruno.site/auth/reset` в Supabase
   (см. `docs/PASSWORD_RECOVERY.md`) — иначе восстановление пароля не сработает.

---

## Известные ограничения

- **Изображения для Open Graph.** Отдельной картинки-превью для соцсетей пока
  нет: при отправке ссылки покажется заголовок и описание без изображения.
  Когда появятся фотографии шаблонов, стоит добавить `opengraph-image.tsx`.
- **Коды подтверждения** Search Console и Вебмастера не вписаны — их выдают
  только после создания ресурса в панели.
- **Sitemap статичен:** содержит четыре маркетинговые страницы. Опубликованные
  приглашения в него намеренно не попадают — это личные страницы, и владелец
  может закрыть их кодом или скрыть от поиска.
