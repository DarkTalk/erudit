# Эрудит — онлайн-игра с друзьями

Веб-версия настольной игры «Эрудит» (русский Scrabble). Создайте комнату, отправьте ссылку друзьям и играйте вместе.

## Возможности

- Мультиплеер 2–4 игрока по одной ссылке
- Словарь из 51 000+ русских существительных
- Классическое поле 15×15 с бонусными клетками
- Обмен фишек, пропуск хода, пустые фишки
- Состояние игры в Vercel Blob (object storage)

## Локальный запуск

```bash
npm install
cp .env.example .env.local
# Добавьте BLOB_READ_WRITE_TOKEN из Vercel Dashboard (Storage → Blob)
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

> Без `BLOB_READ_WRITE_TOKEN` игра работает в памяти — подходит только для быстрого теста на одном процессе.

## Деплой на Vercel

### 1. Репозиторий на GitHub

```bash
git init
git add .
git commit -m "Initial commit: Erudit web game"
gh auth login
gh repo create erudit --public --source=. --remote=origin --push
```

Или создайте репозиторий вручную на [github.com/new](https://github.com/new) и выполните:

```bash
git remote add origin https://github.com/YOUR_USERNAME/erudit.git
git branch -M main
git push -u origin main
```

### 2. Импорт в Vercel

1. Откройте [vercel.com/new](https://vercel.com/new)
2. Import Git Repository → выберите `erudit`
3. Framework Preset: **Next.js** (определяется автоматически)
4. Deploy

### 3. Подключить Vercel Blob

1. Vercel Dashboard → ваш проект → **Storage**
2. **Create Database** → **Blob** → **Continue**
3. Имя store (например `erudit-blob`) → **Create & Connect to Project**

Vercel автоматически добавит переменную `BLOB_READ_WRITE_TOKEN` в проект.

### 4. Redeploy

После подключения Blob выполните **Redeploy** (Deployments → ⋯ → Redeploy), чтобы переменная окружения применилась.

## Как играть

1. Создайте игру на главной странице
2. Скопируйте ссылку и отправьте друзьям
3. Когда все подключились — хост нажимает «Начать игру»
4. Составляйте слова: выберите фишку → кликните клетку (или drag & drop)
5. Первый ход — через центральную звезду

## Стек

- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- Vercel Blob (Fast object storage)

## Структура хранилища

Каждая игра сохраняется как JSON-файл:

```
games/{gameId}.json
```

Доступ приватный (`access: private`), чтение/запись только через API с токеном.
