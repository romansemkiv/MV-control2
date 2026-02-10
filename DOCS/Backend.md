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

## 5. Оновлення стану
- Нічний cron або ручний refresh (endpoint).
- Ручний refresh має throttle (наприклад 1 запит / 60 секунд на користувача).
- Останній refresh зберігається у БД (успішно/неуспішно, дата).

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

## 9. Логи
- Лише системні логи помилок.
- Немає audit‑логів користувачів.
