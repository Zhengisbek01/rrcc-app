# Контроль оплат и закрывающих документов по строительным объектам

MVP по ТЗ: заявки на оплату → согласование руководителем → проведение оплаты
бухгалтером → контроль закрывающих документов → уведомления → еженедельный отчёт.

Стек: React + Vite (фронтенд), Vercel Serverless Functions (API), Vercel Postgres,
Vercel Blob (фото счетов), своя JWT-авторизация, Vercel Cron (еженедельный отчёт),
Telegram-бот для уведомлений.

---

## 1. Залить в GitHub

Репозиторий уже инициализирован (`git init` + первый коммит сделаны). Дальше:

```bash
# распакуйте архив, зайдите в папку
cd oplata-app

# создайте пустой репозиторий на github.com (без README/лицензии), затем:
git remote add origin https://github.com/<ваш-логин>/oplata-app.git
git branch -M main
git push -u origin main
```

---

## 2. Подключить проект к Vercel

1. vercel.com → Add New → Project → Import Git Repository → выбрать `oplata-app`.
2. Framework Preset определится автоматически как Vite. Build Command / Output Directory менять не нужно.
3. Deploy — на этом шаге сборка пройдёт, но приложение ещё не заработает (нет БД).

---

## 3. Подключить Vercel Postgres

1. В проекте на Vercel → вкладка **Storage** → **Create Database** → **Postgres**.
2. После создания — **Connect** к вашему проекту (переменные `POSTGRES_URL` и т.д. подставятся в Environment Variables автоматически).
3. Там же в Storage → ваша БД → вкладка **Query** — вставить и выполнить целиком файл `schema.sql` из репозитория.

---

## 4. Подключить Vercel Blob (для фото счетов)

1. Storage → **Create** → **Blob**.
2. **Connect** к проекту — токен `BLOB_READ_WRITE_TOKEN` подставится автоматически.

---

## 5. Переменные окружения

Project Settings → Environment Variables, добавить (Production + Preview):

| Переменная | Значение |
|---|---|
| `JWT_SECRET` | любая длинная случайная строка (например, сгенерировать `openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN` | токен от @BotFather |
| `VITE_TELEGRAM_BOT_USERNAME` | username бота без @ |
| `CRON_SECRET` | любая случайная строка (Vercel сам добавит её в заголовок при вызове по расписанию) |

`POSTGRES_URL*` и `BLOB_READ_WRITE_TOKEN` уже подставлены автоматически шагами 3–4.

После добавления переменных — **Redeploy** (Deployments → … → Redeploy).

---

## 6. Telegram-бот

1. Написать [@BotFather](https://t.me/BotFather) → `/newbot` → получить токен → вписать в `TELEGRAM_BOT_TOKEN`.
2. Задать вебхук (подставьте домен вашего проекта на Vercel):
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-project>.vercel.app/api/telegram/webhook"
   ```

Еженедельный отчёт уже настроен в `vercel.json` (крон каждую пятницу 18:00 по Алматы) — сработает автоматически после деплоя.

---

## Как это работает (сквозной сценарий)

1. **Начальник объекта** создаёт заявку: объект, подрядчик, сумма, фото счёта, назначение платежа, ответственный.
2. Заявка попадает **руководителю** со статусом «На согласовании» → Одобрить / Отказать.
3. При одобрении **бухгалтер** отмечает оплату (сумма, дата) и указывает, какие закрывающие
   документы нужны (акт, счёт-фактура, накладная, акт сверки) и срок предоставления.
4. **Начальник объекта** получает уведомление (в приложении + Telegram) с суммой, за что оплачено,
   какие документы и до какой даты нужны.
5. Статус документов считается автоматически: получены / ожидаются / просрочены (по дате).
6. Бухгалтер отмечает «Документы получены» → заявка закрывается.
7. Каждую пятницу всем трём ролям автоматически приходит сводный отчёт (в приложении и Telegram).

## Локальная разработка

```bash
npm install
cp .env.example .env.local   # заполнить POSTGRES_URL, BLOB_READ_WRITE_TOKEN, JWT_SECRET и т.д.
npm run dev                  # фронтенд на localhost:5173
```
Для локального запуска API-функций удобнее использовать `vercel dev` (Vercel CLI) вместо `npm run dev`,
чтобы папка `/api` тоже поднялась локально:
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

## Что можно добавить дальше
- Web Push как альтернатива/дополнение к Telegram
- Экспорт отчёта в Excel/PDF
- Аудит-лог изменений по каждой заявке
- Многоязычность интерфейса (KZ/RU/EN)
