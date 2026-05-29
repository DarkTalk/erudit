# Эрудит — онлайн-игра с друзьями

Веб-версия настольной игры «Эрудит» (русский Scrabble). Создайте комнату, отправьте ссылку друзьям и играйте вместе.

## Возможности

- Мультиплеер 2–4 игрока по одной ссылке
- Словарь из 51 000+ русских существительных
- Классическое поле 15×15 с бонусными клетками
- Обмен фишек, пропуск хода, пустые фишки
- Состояние игры в Upstash Redis

## Локальный запуск

```bash
npm install
cp .env.example .env.local
# Добавьте UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN из Vercel Dashboard
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

> Без Redis-переменных игра работает в памяти — подходит только для быстрого теста на одном процессе.

## Деплой на Vercel

### 1. Репозиторий на GitHub

Репозиторий: [github.com/DarkTalk/erudit](https://github.com/DarkTalk/erudit)

### 2. Импорт в Vercel

1. Откройте [vercel.com/new](https://vercel.com/new)
2. Import Git Repository → выберите `erudit`
3. Framework Preset: **Next.js** (определяется автоматически)
4. Deploy

### 3. Подключить Upstash Redis

1. Vercel Dashboard → ваш проект → **Storage**
2. **Create Database** → **Redis** (Upstash) → **Continue**
3. Имя базы (например `erudit-redis`) → **Create & Connect to Project**

Vercel автоматически добавит переменные:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 4. Redeploy

После подключения Redis выполните **Redeploy** (Deployments → ⋯ → Redeploy).

> Если ранее был подключён Blob Store — его можно отключить, он больше не используется.

## Как играть

1. Создайте игру на главной странице
2. Скопируйте ссылку и отправьте друзьям
3. Когда все подключились — хост нажимает «Начать игру»
4. Составляйте слова: выберите фишку → кликните клетку (или drag & drop)
5. Первый ход — через центральную звезду

## Стек

- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- Upstash Redis

## Структура хранилища

Каждая игра — JSON в Redis с ключом `game:{gameId}` и TTL 7 дней.
