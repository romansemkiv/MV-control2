# Backend — принцип роботи

## 1. Стек
- Python 3.11+
- FastAPI
- PostgreSQL
- SQLAlchemy або SQLModel
- Alembic для міграцій

## 2. Авторизація (простий варіант)
- Сесії через secure HttpOnly cookies.
- Таблиця `sessions` або підписаний token з терміном життя.
- Логін видає cookie, лог‑аут її очищає.
- Без відновлення паролю, лише reset адміном.

## 3. Основні сервіси
- `AuthService`: login/logout, first‑admin flow, RBAC.
- `UserService`: CRUD користувачів, призначення ролей.
- `AccessService`: доступи user→sources/MV.
- `QuartzService`: TCP клієнт, RD/RS/I/SV.
- `NEXXService`: REST клієнт, EV GET/SET.
- `PresetService`: save/load/import/export.
- `StateService`: refresh, кеш, snapshot у БД.

## 4. Потік команд
- UI → API → валідація → rate‑limit → інтеграційний клієнт → відповідь → оновлення state.
- Quartz і NEXX викликаються синхронно, з throttle.
- Масові оновлення блокуються або дробляться на батчі.

## 4.1 Мапінг Quartz output ↔ MV window
- Адмін задає кількість MV у системі.
- Кожен MV відповідає 16 output‑каналам Quartz.
- Схема: `mv1.window1 -> out1`, `mv2.window1 -> out17`, `mv3.window1 -> out33` і т.д.
- Формула для output: `out = (mvIndex-1) * 16 + windowIndex`, де `windowIndex` у діапазоні 1..16.

## 5. Оновлення стану
- Нічний cron або ручний refresh (endpoint).
- Ручний refresh має throttle (наприклад 1 запит / 60 секунд на користувача).
- Останній refresh зберігається у БД (успішно/неуспішно, дата).
- Після зчитування параметри зберігаються в БД, UI працює з кешованим станом.

## 6. Структура API (чернетка)
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /users`
- `GET /users`
- `PATCH /users/{id}`
- `DELETE /users/{id}`
- `GET /sources`
- `GET /multiviewers`
- `GET /multiviewers/{id}`
- `POST /multiviewers/{id}/layout`
- `POST /multiviewers/{id}/windows/{n}`
- `GET /routing`
- `POST /routing/switch`
- `GET /presets`
- `POST /presets`
- `POST /presets/{id}/apply`
- `POST /presets/import`
- `GET /presets/{id}/export`
- `POST /refresh`

## 7. Дані (мінімальна модель)
- `users`: id, login, role, password_hash, created_at, last_login
- `sessions`: id, user_id, token_hash, expires_at
- `sources`: id, quartz_input, label
- `multiviewers`: id, nexx_index, label, enabled
- `user_access_sources`: user_id, source_id
- `user_access_mvs`: user_id, mv_id
- `presets`: id, user_id, name, payload_json, created_at
- `state_mv`: mv_id, layout, font, borders, updated_at
- `state_windows`: mv_id, window_index, pcm_bars, umd_json, updated_at
- `state_routing`: output, input, updated_at

## 8. Налаштування протоколів
- Адмін задає параметри з’єднання.
- Зберігаємо в таблиці `integrations`.
- Для NEXX підтримка API key або JWT.
- Для Quartz — IP/Port.
 - Перший запит статусу виконується при збереженні параметрів.

## 9. Логи
- Лише системні логи помилок.
- Немає audit‑логів користувачів.

## 10. Обмеження протоколів
### Quartz
- ASCII TCP, request‑response, одна команда на підключення.
- Termination: `\\r\\n`.
- Timeout 1–5 секунд.
- Помилки повертаються як `.E`.

### NEXX‑API
- Rate limiting: бажано < 10 req/sec.
- URL‑encoding для спецсимволів у текстових полях.
- Індекси: MV 0..119, Window 0..15, UMD layer 0..2.
- Обмеження: до 120 MV, до 16 вікон на MV, 3 UMD.
- Формат кольору: `0xRRGGBB`, Alpha 0–255.
 - Кількість активних MV читається з параметра `Enabled Multiviewers`.
 - Фактична кількість вікон визначається layout.

## 11. Quartz ↔ UI routing
- Output‑номер визначається формулою: `out = (mvIndex-1) * 16 + windowIndex`, де `windowIndex` у діапазоні 1..16.
- У UI показується output‑номер кожного вікна.
- Роутинг виконується шляхом вибору вікна і Source, після чого викликається `.SV<output,input>`.
- Source labels читаються з Quartz `.RD` і прив’язуються до input‑номерів.
