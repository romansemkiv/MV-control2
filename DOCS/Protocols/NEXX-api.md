# Evertz Quartz MultiViewer - Протокол Управління

Детальна специфікація REST API роутера NEXX. Частина мультивювера.

---

## 1. ПІДКЛЮЧЕННЯ ДО ПРИСТРОЮ

### 1.1 Базова URL
```
http://<device-ip>/v.api/apis/
```

**Приклад:**
```
http://192.168.225.35/v.api/apis/
```

### 1.2 REST API Endpoints

Система надає три типи API:

| API | Призначення | Base Path |
|-----|-------------|-----------|
| **EV** | Easy Value - GET/SET параметрів | `/EV/` |
| **PT** | Pass-Through - JSON-RPC виклики | `/PT/` |
| **BT** | Bearer Tokens - авторизація | `/BT/` |

---

## 2. АВТОРИЗАЦІЯ

### 2.1 Методи авторизації

#### Метод 1: API Key
Створюється в WebEASY: **APIs → Actor/Keys → New Actor**

**Використання в Query Parameter:**
```
GET /v.api/apis/EV/GET/parameter/2700?webeasy-api-key=29-347-895-1200
```

**Використання в Request Header:**
```
webeasy-api-key: 29-347-895-1200
```

#### Метод 2: JWT Token

**Створення JWT:**
```
GET /v.api/apis/BT/JWTCREATE/<base64_credentials>
```

**Credentials JSON:**
```json
{"username": "admin", "password": "password123"}
```

**Response:**
```json
{
  "status": "success",
  "message": "OK",
  "jwt": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "brief": {
    "username": "admin",
    "userrole": "administrator",
    "lifespan": 4500,
    "client": "::1",
    "state": "new"
  }
}
```

**Використання JWT в Query:**
```
GET /v.api/apis/EV/GET/parameter/2700?jwt=eyJ0eXAi...
```

**Використання JWT в Header:**
```
jwt: eyJ0eXAi...
```

**Оновлення JWT:**
```
GET /v.api/apis/BT/JWTREFRESH/<current_jwt>
```

**Перевірка JWT:**
```
GET /v.api/apis/BT/JWTVERIFY/<current_jwt>
```

### 2.2 Ролі користувачів

| Роль | Доступні операції |
|------|-------------------|
| `administrator` | GET, SET - повний доступ |
| `rw-user` | GET, SET - read-write |
| `ro-user` | GET - тільки читання |

---

## 3. БАЗОВІ ОПЕРАЦІЇ API

### 3.1 GET - Читання параметрів

**Один параметр:**
```
GET /EV/GET/parameter/<VARID>
GET /EV/GET/parameter?varid=<VARID>
```

**Кілька параметрів:**
```
GET /EV/GET/parameters/<VARID1>,<VARID2>,<VARID3>
GET /EV/GET/parameters?varid=<VARID1>,<VARID2>
```

**Response формат:**
```json
{
  "2700": "120",
  "2701": "96",
  "2702": "64"
}
```

### 3.2 SET - Запис параметрів

**Один параметр:**
```
GET /EV/SET/parameter/<VARID>/<VALUE>
GET /EV/SET/parameter?<VARID>=<VALUE>
```

**Кілька параметрів:**
```
GET /EV/SET/parameters/<VARID1>,<VARID2>/<VALUE1>,<VALUE2>
GET /EV/SET/parameters?<VARID1>=<VALUE1>&<VARID2>=<VALUE2>
```

### 3.3 Формат помилок
```json
{
  "error": "Invalid parameter"
}
```

---

## 4. MULTIVIEWER - ПАРАМЕТРИ

### 4.1 Адресація VarID

Параметри мультив'ювера використовують індекси:

**Формат:** `VARID.INDEX1.INDEX2.INDEX3`

**Діапазони індексів:**
- `[0..119]` - номер мультів'ювера (до 120 MV)
- `[0..15]` - номер вікна в MV (до 16 вікон)
- `[0..2]` - номер UMD шару (3 шари)

**Приклади:**
```
2703.0        → Enable для MV #0
2709.5.2.1    → UMD текст для MV#5, вікно#2, шар#1
2714.10.3.0   → Колір тексту для MV#10, вікно#3, шар#0
```

---

## 5. ГЛОБАЛЬНІ ПАРАМЕТРИ MULTIVIEWER

### 5.1 Інформація про систему (GET only)

| VarID | Параметр | Опис |
|-------|----------|------|
| **2700** | Chassis Total Multiviewers | Загальна кількість MV (до 120) |
| **2701** | Licensed Multiviewers | Скільки MV ліцензовано |
| **2702** | Enabled Multiviewers | Скільки MV активовано |

**Приклад:**
```bash
curl "http://192.168.225.35/v.api/apis/EV/GET/parameters/2700,2701,2702"
```

**Response:**
```json
{
  "2700": "120",
  "2701": "48",
  "2702": "24"
}
```

---

### 5.2 Глобальні налаштування Timecode (GET/SET)

#### VarID 2722 - Джерело Timecode

| Значення | Джерело |
|----------|---------|
| 0 | Local ATC |
| 1 | NTP |
| 2 | NTP з offset |
| 3 | Global ATC 1 |
| 4 | Global ATC 2 |
| 5 | Global ATC 3 |
| 6 | Global ATC 4 |

**Приклад:**
```bash
# Встановити Global ATC 1
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2722/3"
```

#### VarID 2734 - Формат Timecode

| Значення | Формат |
|----------|--------|
| 0 | HH:MM:SS:FF.F |
| 1 | HH:MM:SS |

#### VarID 2729-2732 - Джерела Global ATC

| VarID | Параметр | Діапазон |
|-------|----------|----------|
| **2729** | Global ATC 1 Source | 0-959 (SDI вхід 1-960) |
| **2730** | Global ATC 2 Source | 0-959 |
| **2731** | Global ATC 3 Source | 0-959 |
| **2732** | Global ATC 4 Source | 0-959 |

**Приклад:**
```bash
# Встановити SDI вхід #5 як джерело Global ATC 1
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2729/4"
```

#### VarID 2723-2725 - NTP Offset

| VarID | Параметр | Діапазон |
|-------|----------|----------|
| **2723** | Direction | 0="+", 1="-" |
| **2724** | Hours | 0-23 |
| **2725** | Minutes | 0-59 |

---

### 5.3 Глобальні налаштування вікон (GET/SET)

#### VarID 2721 - Window Size

| Значення | Розмір |
|----------|--------|
| 0 | Full |
| 1 | Reduced Small |
| 2 | Reduced Medium |
| 3 | Reduced Large |

**Приклад:**
```bash
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2721/2"
```

---

## 6. КОНФІГУРАЦІЯ ОКРЕМОГО MULTIVIEWER

**Індекс:** `[0..119]` - номер мультів'ювера

### 6.1 Основні параметри

| VarID | Параметр | Тип | Опис |
|-------|----------|-----|------|
| **2704** | Layout Selection | GET/SET | Вибір layout |
| **2716** | Text Font | GET/SET | Шрифт тексту |

---

### 6.2 Параметри відображення

| VarID | Параметр | Тип | Опис |
|-------|----------|-----|------|
| **2726** | Outer Border Pixels | GET/SET | Товщина зовнішньої рамки (пікселі) |
| **2727** | Inner Border Pixels | GET/SET | Товщина внутрішньої рамки (пікселі) |

**Приклади:**
```bash
# Встановити зовнішню рамку 5px для MV#0
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2726.0/5"

# Встановити внутрішню рамку 2px для MV#0
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2727.0/2"

```

---

## 7. КОНФІГУРАЦІЯ ВІКОН

**Індекси:** `[mv].[window]` де:
- `mv` = 0..119 (номер мультів'ювера)
- `window` = 0..15 (номер вікна)

### 7.1 Параметри вікон

| VarID | Параметр | Тип | Опис |
|-------|----------|-----|------|
| **2719** | PCM Audio Bars | GET/SET | Відображення аудіо індикаторів |

**Приклади:**
```bash
# Увімкнути аудіо індикатори для MV#5, вікно#7
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2719.5.7/1"
```

---

## 8. UMD ЕЛЕМЕНТИ

**Індекси:** `[mv].[window].[layer]` де:
- `mv` = 0..119 (мультів'ювер)
- `window` = 0..15 (вікно)
- `layer` = 0..2 (шар UMD)

### 8.1 Повний список UMD параметрів

| VarID | Параметр | Тип значення | Опис |
|-------|----------|--------------|------|
| **2708** | UMD Selection | enum | Вибір типу UMD елемента |
| **2709** | UMD Text (static) | string | Статичний текст |
| **2710** | UMD Box Colour | hex RGB | Колір фону (0xRRGGBB) |
| **2711** | UMD Box Alpha | 0-255 | Прозорість фону |
| **2712** | UMD Box X | pixels | Позиція X (пікселі) |
| **2713** | UMD Box Y | pixels | Позиція Y (пікселі) |
| **2714** | UMD Text Colour | hex RGB | Колір тексту (0xRRGGBB) |
| **2715** | UMD Text Alpha | 0-255 | Прозорість тексту |
| **2717** | UMD Text Size | integer | Розмір тексту |
| **2733** | UMD Padding | pixels | Padding текстового бокса |

---

### 8.2 Детальний опис UMD параметрів

#### 2709 - UMD Text (static)
Статичний текст, що відображається в UMD елементі.

**Приклад:**
```bash
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2709.0.0.0/CAMERA%201"
```

#### 2710 - UMD Box Colour
Колір фону UMD бокса в форматі RGB hex.

**Формат:** `0xRRGGBB`

**Приклади кольорів:**
- `0xFF0000` - червоний
- `0x00FF00` - зелений
- `0x0000FF` - синій
- `0xFFFFFF` - білий
- `0x000000` - чорний
- `0xFFD700` - золотий

**Приклад:**
```bash
# Встановити червоний фон для MV#0, вікно#1, шар#0
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2710.0.1.0/0xFF0000"
```

#### 2711 - UMD Box Alpha
Прозорість фону UMD бокса.

**Діапазон:** 0-255
- `0` = повністю прозорий
- `255` = повністю непрозорий

**Приклад:**
```bash
# Встановити напівпрозорий фон
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2711.0.1.0/128"
```

#### 2712 / 2713 - UMD Box X / Y
Позиція UMD елемента на екрані в пікселях.

**Координати:**
- X: горизонтальна позиція (0 = лівий край)
- Y: вертикальна позиція (0 = верхній край)

**Приклад:**
```bash
# Встановити позицію (100, 50) для MV#0, вікно#2, шар#0
curl "http://192.168.225.35/v.api/apis/EV/SET/parameters/2712.0.2.0,2713.0.2.0/100,50"
```

#### 2714 - UMD Text Colour
Колір тексту в форматі RGB hex.

**Формат:** `0xRRGGBB`

**Приклад:**
```bash
# Білий текст
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2714.0.0.0/0xFFFFFF"
```

#### 2715 - UMD Text Alpha
Прозорість тексту.

**Діапазон:** 0-255

**Приклад:**
```bash
# Повністю непрозорий текст
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2715.0.0.0/255"
```

#### 2717 - UMD Text Size
Розмір шрифту тексту.

**Приклад:**
```bash
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2717.0.0.0/24"
```

#### 2733 - UMD Padding
Відступ між текстом та краями UMD бокса в пікселях.

**Приклад:**
```bash
curl "http://192.168.225.35/v.api/apis/EV/SET/parameter/2733.0.0.0/5"
```

---

### 9.2 Моніторинг стану мультів'ювера

```bash
BASE_URL="http://192.168.225.35/v.api/apis/EV/GET"

# Отримати базову інформацію
curl "$BASE_URL/parameters/2700,2701,2702"

# Отримати стан конкретного MV
MV=5
curl "$BASE_URL/parameter/2703.$MV"

```

---

## 11. ОБМЕЖЕННЯ ТА ПРИМІТКИ

### 11.1 Обмеження системи

| Параметр | Значення |
|----------|----------|
| Максимум мультів'юверів | 120 (залежить від ліцензії та конфігурації) |
| Максимум вікон на MV | 16 |
| Максимум UMD шарів | 3 |
| Формат кольору | 0xRRGGBB (hex) |
| Діапазон Alpha | 0-255 |
| SDI входи для Global ATC | 0-959 (960 входів) |

### 11.2 Важливі примітки

2. **JSON параметри** - деякі складні параметри не можна змінювати через EV API, використовуйте PT API
4. **Індекси** - завжди використовуйте правильний діапазон індексів. Діапазон мультів'юверів залежить від конфігурації та ліцензії (VarID 2700-2702)
5. **URL Encoding** - спеціальні символи в текстових полях потрібно кодувати (пробіл = %20)
6. **Rate Limiting** - не перевищуйте розумну частоту запитів (рекомендовано < 10 req/sec)
7. **Ліцензування** - кількість доступних мультів'юверів залежить від ліцензії (перевіряйте VarID 2701)

---

## 14. ШВИДКИЙ ДОВІДНИК - ВСІ ПАРАМЕТРИ MV

### 14.1 Глобальні параметри (без індексів)

| VarID | Параметр | R/W | Тип | Діапазон/Enum |
|-------|----------|-----|-----|---------------|
| 2700 | Chassis Total Multiviewers | R | int | Максимум в системі |
| 2701 | Licensed Multiviewers | R | int | Ліцензовано |
| 2702 | Enabled Multiviewers | R | int | Активовано |
| 2721 | Window Size | R/W | enum | 0=Full, 1=Reduced Small, 2=Medium, 3=Large |
| 2722 | Timecode Source | R/W | enum | 0=Local ATC, 1=NTP, 2=NTP+offset, 3-6=Global ATC 1-4 |
| 2734 | Timecode Format | R/W | enum | 0=HH:MM:SS:FF.F, 1=HH:MM:SS |
| 2723 | NTP Offset Direction | R/W | enum | 0="+", 1="-" |
| 2724 | NTP Offset Hours | R/W | int | 0-23 |
| 2725 | NTP Offset Minutes | R/W | int | 0-59 |
| 2729 | Global ATC 1 Source | R/W | int | 0-959 (SDI input) |
| 2730 | Global ATC 2 Source | R/W | int | 0-959 (SDI input) |
| 2731 | Global ATC 3 Source | R/W | int | 0-959 (SDI input) |
| 2732 | Global ATC 4 Source | R/W | int | 0-959 (SDI input) |

### 14.2 Параметри MV [0..119]

| VarID | Параметр | R/W | Тип | Опис |
|-------|----------|-----|-----|------|
| 2703.X | Enable | R/W | enum | 0=Disabled, 1=Enabled |
| 2704.X | Layout Selection | R/W | int | Номер layout |
| 2716.X | Text Font | R/W | int | Шрифт |
| 2720.X | Output Format | R/W | int | Формат виходу |
| 2726.X | Outer Border Pixels | R/W | int | Зовнішня рамка (px) |
| 2727.X | Inner Border Pixels | R/W | int | Внутрішня рамка (px) |
| 2735.X | Update Preview | W | - | Оновити preview (SET=1) |

### 14.3 Параметри вікон [mv].[window 0..15]

| VarID | Параметр | R/W | Тип | Опис |
|-------|----------|-----|-----|------|
| 2707.X.Y | Video Audio Source | R/W | int | Audio follows video |
| 2718.X.Y | Source Label | R/W | string | Мітка джерела |
| 2719.X.Y | PCM Audio Bars | R/W | enum | Аудіо індикатори |

### 14.4 UMD елементи [mv].[window].[layer 0..2]

| VarID | Параметр | R/W | Тип | Діапазон | Опис |
|-------|----------|-----|-----|----------|------|
| 2708.X.Y.Z | UMD Selection | R/W | enum | - | Тип UMD елемента |
| 2709.X.Y.Z | UMD Text | R/W | string | - | Статичний текст |
| 2710.X.Y.Z | UMD Box Colour | R/W | hex | 0x000000-0xFFFFFF | Колір фону (RGB) |
| 2711.X.Y.Z | UMD Box Alpha | R/W | int | 0-255 | Прозорість фону |
| 2712.X.Y.Z | UMD Box X | R/W | int | pixels | Позиція X |
| 2713.X.Y.Z | UMD Box Y | R/W | int | pixels | Позиція Y |
| 2714.X.Y.Z | UMD Text Colour | R/W | hex | 0x000000-0xFFFFFF | Колір тексту (RGB) |
| 2715.X.Y.Z | UMD Text Alpha | R/W | int | 0-255 | Прозорість тексту |
| 2717.X.Y.Z | UMD Text Size | R/W | int | - | Розмір шрифту |
| 2733.X.Y.Z | UMD Padding | R/W | int | pixels | Padding бокса |

**Легенда:**
- R/W = Read/Write (GET/SET)
- R = Read only (тільки GET)
- W = Write only (тільки SET, не зберігає стан)
- X = номер MV [0..119]
- Y = номер вікна [0..15]
- Z = номер UMD шару [0..2]

---

## 16. КОРИСНІ ПОСИЛАННЯ

- WebEASY Interface: `http://<device-ip>`
- API Summary: `http://<device-ip>/v.api/apis/EV/SUMMARY`
- PT API Summary: `http://<device-ip>/v.api/apis/PT/SUMMARY`
- API Documentation: `http://<device-ip>/v.api/apis/` (rest of endpoints)

---

**Версія документа:** 1.2
**Дата створення:** 2026-02-09
**Останнє оновлення:** 2026-02-09
**Призначення:** Розробка ПЗ для управління Evertz Quartz MultiViewer
**Базується на:** Evertz Quartz Control API specification + live system parameter dump analysis
