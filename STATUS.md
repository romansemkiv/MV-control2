# MV-Control — Статус Проекту / Project Status

Корисні команди:

  # Подивитися логи
  docker compose logs -f app

  # Зупинити
  docker compose down

  # Перезапустити
  docker compose restart

  # Перезібрати після змін коду
  docker compose up --build -d

## 📋 Огляд / Overview

**MV-Control** — веб-додаток для керування broadcast мультивʼюерами та відео-роутингом через протоколи Evertz Quartz (TCP) та NEXX-API (REST).

**MV-Control** is a web application for managing broadcast multiviewers and video routing via Evertz Quartz (TCP) and NEXX-API (REST) protocols.

---

Аудит проекту MV-Control                                                                                                                  
                                                                                                                                            
  Backend (~85% готовий)                                                                                                                    
  ┌────────────────────┬─────────┬────────────────────────────────────────────────────────────────────┐                                       │     Компонент      │ Статус  │                               Деталі                               │                                     
  ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤                                     
  │ БД моделі          │ ✅ 100% │ Всі 11 таблиць, міграції Alembic                                   │                                       ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤                                       │ QuartzClient       │ ✅ 95%  │ TCP, всі команди (.RD/.RS/.IV/.SV)                                 │                                       ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤                                       │ NEXXClient         │ ✅ 95%  │ REST, GET/SET single+batch, JWT+API key                            │                                     
  ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤
  │ AuthService        │ ✅ 95%  │ Login/logout, first-admin, RBAC                                    │
  ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤
  │ StateService       │ ✅ 90%  │ Refresh NEXX+Quartz, кешування в БД                                │
  ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤
  │ API ендпоінти      │ ✅ 90%  │ Auth, Users, Sources, MVs, Routing, Presets, Refresh, Integrations │
  ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤
  │ Docker             │ ✅ 100% │ Multi-stage build, compose з PostgreSQL                            │
  ├────────────────────┼─────────┼────────────────────────────────────────────────────────────────────┤
  │ Schemas (Pydantic) │ ✅ 100% │ Всі моделі запитів/відповідей                                      │
  └────────────────────┴─────────┴────────────────────────────────────────────────────────────────────┘
  Що НЕ реалізовано в бекенді:
  1. Rate limiting — немає зовсім (NEXX вимагає <10 req/sec)
  2. Ендпоінт глобальних параметрів MV — немає PATCH /multiviewers/{id} для font/borders
  3. Валідація доступу на routing — можна перемикати маршрути без перевірки доступу
  4. Сервісний шар — UserService, AccessService, PresetService логіка в роутерах
  5. Тести — 0% покриття
  6. Логування — відсутнє
  7. Очищення сесій — протерміновані накопичуються в БД

  ---
  Frontend (~70% готовий)
  ┌────────────────────┬─────────┬──────────────────────────────────────────────────┐
  │     Компонент      │ Статус  │                      Деталі                      │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ Login              │ ✅ 100% │ Форма, first-login notice, dark theme            │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ Admin              │ ✅ 100% │ Users, Access, Integrations, Status — все працює │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ Main page          │ ⚠️ 70%  │ MV selector, SVG canvas, routing — ок            │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ LayoutCanvas       │ ✅ 100% │ SVG viewBox 0 0 1000, кліки, output numbers      │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ LayoutPreviewModal │ ✅ 100% │ Сітка превʼюшок, вибір layout                    │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ PresetsModal       │ ✅ 100% │ Save/apply/export/import, checkboxes             │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ WindowInspector    │ ⚠️ 20%  │ Тільки source routing + PCM + UMD text           │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ Zustand stores     │ ✅ 100% │ authStore, mvStore                               │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ API client         │ ✅ 100% │ Всі ендпоінти                                    │
  ├────────────────────┼─────────┼──────────────────────────────────────────────────┤
  │ Layouts data       │ ⚠️ 30%  │ 13 із 43 layouts                                 │
  └────────────────────┴─────────┴──────────────────────────────────────────────────┘
  Що НЕ реалізовано у фронтенді:
  1. 30 layouts (14-43) — є лише 13 з 43
  2. UMD контроли — з 10 параметрів реалізовано лише текст:
    - Немає: тип UMD, колір/alpha фону, колір/alpha тексту, позиція X/Y, розмір, padding
  3. Глобальні параметри MV — font/borders тільки read-only
  4. TypeScript типи — багато any замість нормальних інтерфейсів
  5. Route guards — немає ProtectedRoute компонента
  6. Loading/error states — мінімальні

  ---
  Пріоритетний план доробки

  Критичне (MVP):
  1. UMD контроли у WindowInspector (без них неможливо повноцінно керувати MV)
  2. Глобальні параметри MV (font, borders) — бекенд ендпоінт + фронтенд UI
  3. Rate limiting на бекенді (захист обладнання)
  4. Валідація доступу на routing

  Важливе:
  5. Решта 30 layouts
  6. TypeScript інтерфейси замість any
  7. Route guards

  Бажане:
  8. Тести
  9. Логування
  10. Очищення сесій

---

## ✅ Що Реалізовано / What's Implemented

### 🏗️ Infrastructure / Інфраструктура

- [x] **Docker Setup**
  - Multi-stage Dockerfile (Node.js для фронтенду → Python для бекенду)
  - docker-compose.yml з PostgreSQL 16
  - Автоматична збірка фронтенду і статична роздача
  - Health checks для бази даних

- [x] **Database / База даних**
  - PostgreSQL 16 Alpine
  - SQLAlchemy ORM
  - Alembic migrations
  - Повна схема бази даних з усіма таблицями

### 🔐 Backend — Authentication & Users

- [x] **Моделі даних** (SQLAlchemy models):
  - `User` — користувачі системи
  - `Session` — сесії користувачів
  - `Source` — джерела відео
  - `Multiviewer` — мультивʼюери
  - `UserAccessSource` / `UserAccessMV` — права доступу
  - `Preset` — пресети налаштувань
  - `StateMV`, `StateWindow`, `StateRouting` — кеш стану
  - `Integration` — налаштування Quartz/NEXX

- [x] **Authentication API** (`/auth`):
  - `POST /auth/login` — вхід (сесія через HttpOnly cookie)
  - `POST /auth/logout` — вихід
  - `GET /auth/me` — поточний користувач
  - Bcrypt password hashing
  - First-admin flow (перший користувач отримує роль admin)
  - Session-based auth з cookie

- [x] **User Management API** (`/users`):
  - `POST /users` — створення користувача (admin only)
  - `GET /users` — список користувачів (admin only)
  - `PATCH /users/{id}` — оновлення користувача
  - `DELETE /users/{id}` — видалення користувача
  - Access control (призначення доступу до джерел і MV)

### 🔌 Backend — Protocol Clients

- [x] **Quartz Client** (`app/clients/quartz.py`):
  - TCP socket connection
  - Commands: `.RAD`, `.RAS`, `.SV` (read/switch routing)
  - Response parsing (`.AV`, `.E`, `.B`)
  - Timeout handling

- [x] **NEXX Client** (`app/clients/nexx.py`):
  - REST API client (httpx)
  - GET/SET parameters (single & batch)
  - JWT authentication support
  - API key authentication
  - URL encoding для текстових значень

### 📡 Backend — Core API

- [x] **Sources API** (`/sources`):
  - `GET /sources` — список джерел (фільтр за правами користувача)

- [x] **Multiviewers API** (`/multiviewers`):
  - `GET /multiviewers` — список MV (фільтр за правами)
  - `GET /multiviewers/{id}` — деталі MV + windows state
  - `POST /multiviewers/{id}/layout` — зміна layout
  - `POST /multiviewers/{id}/windows/{n}` — налаштування вікна (UMD, PCM, source)
  - `PATCH /multiviewers/{id}` — глобальні параметри MV (font, borders)

- [x] **Routing API** (`/routing`):
  - `GET /routing` — поточний routing (з кешу DB)
  - `POST /routing/switch` — переключення джерела через Quartz

- [x] **Refresh API** (`/refresh`):
  - `POST /refresh` — оновлення стану з NEXX/Quartz
  - Throttling (1 запит/60с на користувача)
  - State service для читання з обладнання

- [x] **Integrations API** (`/integrations`):
  - `GET /integrations` — отримання налаштувань
  - `POST /integrations` — збереження налаштувань Quartz/NEXX
  - JWT credentials management

### 💾 Backend — Presets

- [x] **Presets API** (`/presets`):
  - `GET /presets` — список пресетів користувача
  - `POST /presets` — створення пресета
  - `POST /presets/{id}/apply` — застосування пресета
  - `DELETE /presets/{id}` — видалення пресета
  - Import/Export через JSON

### 🎨 Frontend — React + TypeScript

- [x] **Infrastructure**:
  - Vite build system
  - React 18
  - TypeScript
  - Tailwind CSS (темна тема)
  - Zustand stores для state management

- [x] **Pages**:
  - `Login.tsx` — сторінка входу
  - `Main.tsx` — головна сторінка (MV control)
  - `Admin.tsx` — адмін-панель

- [x] **Components**:
  - `LayoutCanvas.tsx` — SVG canvas для відображення layout
  - `LayoutPreviewModal.tsx` — модалка з вибором layout
  - `WindowInspector.tsx` — панель налаштувань вікна
  - `PresetsModal.tsx` — модалка пресетів

- [x] **Stores**:
  - `authStore.ts` — авторизація
  - `mvStore.ts` — стан мультивʼюерів

- [x] **Data**:
  - 43 layout definitions з нормалізованими координатами (0..1)

### 📦 Deployment

- [x] Multi-stage Docker build
- [x] Docker Compose orchestration
- [x] Static file serving (frontend через FastAPI)
- [x] Database migrations (Alembic)
- [x] Health checks

---

## ⚠️ Що Потрібно Доробити / What's Left To Do

### 🔧 Backend

- [ ] **State Service** — покращення:
  - Batch reads для зменшення кількості запитів до NEXX
  - Error handling при недоступності обладнання
  - Background refresh task (опціонально)

- [ ] **Access Control**:
  - Перевірка прав доступу до джерел/MV у всіх endpoints
  - Middleware для автоматичної фільтрації

- [ ] **Rate Limiting**:
  - Rate limiting на endpoints що викликають протоколи
  - Per-user throttling на критичні операції

- [ ] **Validation**:
  - Валідація VarID ranges для NEXX
  - Валідація routing output/input ranges

- [ ] **Error Handling**:
  - Standardized error responses
  - Graceful degradation при збоях зв'язку з обладнанням

### 🎨 Frontend

- [ ] **Admin Page** — вкладки:
  - Users management (CRUD)
  - Access control (призначення джерел/MV користувачам)
  - Integrations (налаштування Quartz/NEXX)
  - System status (останній refresh, помилки)

- [ ] **Main Page** — покращення:
  - Real-time status updates (опціонально через WebSocket)
  - Loading states
  - Error messages
  - Confirmation dialogs для critical actions

- [ ] **UI/UX**:
  - Toast notifications
  - Loading spinners
  - Better error handling
  - Responsive design для різних екранів

### 📚 Documentation

- [ ] API documentation (Swagger descriptions)
- [ ] User manual (інструкція користувача)
- [ ] Deployment guide (розгортання у production)
- [ ] Configuration guide (налаштування Quartz/NEXX)

### 🧪 Testing

- [ ] Unit tests (backend services)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (frontend flows)
- [ ] Mock NEXX/Quartz servers для тестування

### 🚀 Production Readiness

- [ ] Environment variables для secrets
- [ ] Logging configuration
- [ ] Monitoring/metrics
- [ ] Backup strategy для database
- [ ] SSL/TLS certificates
- [ ] Reverse proxy configuration (nginx)
- [ ] Auto-update webhook endpoint

---

## 🐳 Робота з Docker Desktop / Working with Docker Desktop

### Встановлення / Installation

1. Завантажте Docker Desktop: https://www.docker.com/products/docker-desktop
2. Встановіть додаток
3. Запустіть Docker Desktop

### Основні Команди / Basic Commands

#### 🚀 Запуск / Start

```bash
# Запустити контейнери (перший раз або після зупинки)
docker-compose up -d

# Або з rebuild (якщо змінили код)
docker-compose up -d --build
```

**Пояснення прапорців:**
- `-d` = detached mode (контейнери працюють у фоні)
- `--build` = перебудувати образи перед запуском

#### 🔄 Перезапуск / Restart

```bash
# Перезапустити всі контейнери
docker-compose restart

# Перезапустити конкретний контейнер
docker restart mv-control-app-1
docker restart mv-control-db-1

# Або через Docker Compose
docker-compose restart app
docker-compose restart db
```

#### ⏸️ Зупинка / Stop

```bash
# Зупинити контейнери (дані зберігаються)
docker-compose stop

# Зупинити і видалити контейнери (volumes залишаються)
docker-compose down

# Видалити все включно з volumes (БД буде очищена!)
docker-compose down -v
```

⚠️ **УВАГА:** `docker-compose down -v` видалить базу даних!

#### 📊 Статус / Status

```bash
# Подивитися запущені контейнери
docker ps

# Подивитися всі контейнери (включно зі зупиненими)
docker ps -a

# Статус через Docker Compose
docker-compose ps
```

#### 📜 Логи / Logs

```bash
# Подивитися логи всіх сервісів
docker-compose logs

# Логи конкретного сервісу
docker-compose logs app
docker-compose logs db

# Стежити за логами в реальному часі
docker-compose logs -f app

# Останні 50 рядків
docker-compose logs --tail=50 app
```

#### 🔍 Доступ до Контейнера / Access Container

```bash
# Відкрити shell у контейнері
docker exec -it mv-control-app-1 /bin/sh
docker exec -it mv-control-db-1 /bin/sh

# Виконати команду в контейнері
docker exec mv-control-app-1 python --version
docker exec mv-control-db-1 psql -U mvcontrol -d mvcontrol -c "SELECT COUNT(*) FROM users;"
```

#### 🧹 Очищення / Cleanup

```bash
# Видалити зупинені контейнери
docker container prune

# Видалити невикористані образи
docker image prune

# Видалити все невикористане (контейнери, мережі, образи)
docker system prune

# Радикальне очищення (з volumes!)
docker system prune -a --volumes
```

### Корисні Команди для MV-Control

```bash
# Перебудувати після змін у коді
docker-compose up -d --build

# Подивитися логи додатка
docker-compose logs -f app

# Підключитися до бази даних
docker exec -it mv-control-db-1 psql -U mvcontrol -d mvcontrol

# Виконати міграції вручну
docker exec mv-control-app-1 alembic upgrade head

# Створити нову міграцію (у dev режимі)
docker exec mv-control-app-1 alembic revision --autogenerate -m "description"

# Перевірити здоров'я бази даних
docker exec mv-control-db-1 pg_isready -U mvcontrol
```

### Доступ до Додатка / Access Application

Після запуску `docker-compose up -d`:

- **Frontend (веб-інтерфейс):** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **ReDoc Documentation:** http://localhost:8000/redoc
- **Database:** localhost:5432 (не експонується назовні, тільки між контейнерами)

### Troubleshooting

#### Контейнер не запускається

```bash
# Подивитися детальні логи
docker-compose logs app

# Перевірити статус
docker-compose ps
```

#### База даних недоступна

```bash
# Перевірити чи працює контейнер БД
docker ps | grep db

# Подивитися логи БД
docker-compose logs db

# Перевірити здоров'я
docker exec mv-control-db-1 pg_isready -U mvcontrol
```

#### Порт вже зайнятий

```bash
# Знайти процес що використовує порт 8000
lsof -i :8000

# Змінити порт у docker-compose.yml:
# ports:
#   - "8001:8000"  # зовнішній:внутрішній
```

#### Очистити і почати з нуля

```bash
# Зупинити все
docker-compose down -v

# Видалити образи
docker rmi mv-control-app postgres:16-alpine

# Перебудувати
docker-compose up -d --build
```

---

## 📁 Структура Проекту / Project Structure

```
MV-control/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models ✅
│   │   ├── schemas/         # Pydantic schemas ✅
│   │   ├── routers/         # API endpoints ✅
│   │   ├── services/        # Business logic ✅
│   │   ├── clients/         # Quartz/NEXX clients ✅
│   │   ├── config.py        # Settings ✅
│   │   ├── database.py      # DB connection ✅
│   │   ├── dependencies.py  # Auth dependencies ✅
│   │   └── main.py          # FastAPI app ✅
│   ├── alembic/             # Migrations ✅
│   ├── requirements.txt     # Python dependencies ✅
│   └── entrypoint.sh        # Startup script ✅
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages ✅
│   │   ├── components/      # React components ✅
│   │   ├── stores/          # Zustand stores ✅
│   │   ├── api/             # API client ✅
│   │   └── data/            # Layouts (43 items) ✅
│   ├── package.json         # Node dependencies ✅
│   └── vite.config.ts       # Vite config ✅
├── DOCS/                    # Documentation 📚
├── Dockerfile               # Multi-stage build ✅
├── docker-compose.yml       # Orchestration ✅
├── .gitignore              # Git ignore rules ✅
└── STATUS.md               # Цей документ / This file 📄
```

---

## 🎯 Пріоритети / Priorities

### High Priority 🔴

1. **Admin Page** — завершити всі вкладки (users, access, integrations, status)
2. **Error Handling** — добавити proper error handling у frontend
3. **Access Control** — імплементувати перевірку прав доступу у всіх endpoints
4. **Testing** — basic integration tests для критичних flows

### Medium Priority 🟡

1. **State Service** — batch reads і error handling
2. **UI/UX** — loading states, notifications, confirmations
3. **Documentation** — user manual і deployment guide
4. **Rate Limiting** — захист endpoints від abuse

### Low Priority 🟢

1. **Real-time Updates** — WebSocket для live status (optional)
2. **Monitoring** — metrics і logging
3. **Advanced Features** — додаткові опції налаштування

---

## 📝 Нотатки / Notes

- ✅ Базова інфраструктура повністю готова
- ✅ Backend API майже повністю реалізовано
- ✅ Frontend структура створена
- ⚠️ Потрібно доробити Admin page UI
- ⚠️ Потрібно покращити error handling
- 🔜 Готово до тестування з реальним обладнанням

---

**Оновлено:** 2026-02-10
**Версія:** 0.1.0
