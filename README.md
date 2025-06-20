# Hotel Booking API

REST API для системы бронирования номеров в отеле с поддержкой VIP клиентов.

## 🚀 Возможности

- **Управление номерами**: Просмотр всех номеров и поиск свободных номеров на определенные даты
- **Бронирование**: Создание, обновление и отмена бронирований
- **VIP статус**: Автоматическая проверка VIP статуса клиентов через внешний API
- **Предотвращение конфликтов**: Защита от двойного бронирования одного номера
- **Скидки**: Автоматическое применение VIP скидок
- **Документация API**: Swagger/OpenAPI документация

## 🛠 Технологии

- **Backend**: Node.js + Express.js
- **База данных**: PostgreSQL
- **ORM**: Sequelize
- **Контейнеризация**: Docker + Docker Compose
- **Валидация**: Joi
- **Документация**: Swagger

## 📋 Требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- PostgreSQL 15+ (если запуск без Docker)

## 🏗 Структура проекта

```
hotel-booking-api/
├── src/
│   ├── config/
│   │   └── database.js          # Конфигурация БД
│   ├── models/                  # Модели Sequelize
│   │   ├── index.js
│   │   ├── Hotel.js
│   │   ├── Room.js
│   │   ├── RoomType.js
│   │   ├── Client.js
│   │   └── Booking.js
│   ├── services/                # Бизнес-логика
│   │   ├── vipService.js
│   │   └── bookingService.js
│   ├── middleware/              # Middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/                  # API маршруты
│   │   ├── health.js
│   │   ├── rooms.js
│   │   ├── bookings.js
│   │   └── clients.js
│   └── app.js                   # Главный файл приложения
├── database/
│   ├── init/                    # Файлы инициализации для Docker
│   ├── schema.sql               # Схема БД
│   └── test_data.sql           # Тестовые данные
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.mock-vip
├── package.json
├── .env.example
├── .gitignore
├── .dockerignore
└── README.md
```

## 🐳 Быстрый старт с Docker

### 1. Клонирование и настройка

```bash
# Создайте директорию проекта (если еще не создана)
mkdir hotel-booking-api
cd hotel-booking-api

# Создайте файл .env на основе .env.example
cp .env.example .env
```

### 2. Запуск приложения

```bash
# Запуск всех сервисов
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f api

# Остановка сервисов
docker-compose down
```

### 3. Доступ к сервисам

- **API**: http://localhost:3000
- **API Документация**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Mock VIP API**: http://localhost:3001
- **pgAdmin**: http://localhost:5050 (admin@hotel.com / admin)

## 💻 Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

```bash
# Создание БД (если PostgreSQL установлен локально)
createdb hotel_booking

# Выполнение миграций
npm run db:setup
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

## 📚 API Endpoints

### Номера
- `GET /api/rooms` - Список всех номеров отеля
- `GET /api/rooms/available` - Свободные номера на даты
- `GET /api/rooms/:id` - Детали номера
- `GET /api/rooms/types` - Типы номеров

### Бронирования
- `POST /api/bookings` - Создать бронирование
- `GET /api/bookings` - Список бронирований
- `GET /api/bookings/:uuid` - Детали бронирования
- `PUT /api/bookings/:uuid` - Обновить бронирование
- `DELETE /api/bookings/:uuid/cancel` - Отменить бронирование
- `GET /api/bookings/stats` - Статистика бронирований

### Клиенты
- `POST /api/clients` - Создать/обновить клиента
- `GET /api/clients` - Список клиентов
- `GET /api/clients/:id` - Детали клиента
- `GET /api/clients/:id/vip-status` - VIP статус клиента
- `GET /api/clients/:id/bookings` - Бронирования клиента
- `GET /api/clients/search` - Поиск клиента по email

### Здоровье системы
- `GET /health` - Базовая проверка
- `GET /health/detailed` - Детальная проверка
- `GET /health/database` - Проверка БД

## 🔧 Конфигурация

Основные переменные окружения в файле `.env`:

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_booking
DB_USER=hotel_user
DB_PASSWORD=hotel_password

# VIP API
VIP_API_URL=http://localhost:3001/check-vip

# Приложение
PORT=3000
NODE_ENV=development
```

## 🧪 Тестирование API

### Пример создания бронирования:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-1234"
    },
    "room_id": 1,
    "check_in_date": "2025-07-15",
    "check_out_date": "2025-07-20",
    "guest_count": 2,
    "special_requests": "Late check-in requested"
  }'
```

### Поиск свободных номеров:

```bash
curl "http://localhost:3000/api/rooms/available?hotel_id=1&check_in_date=2025-07-15&check_out_date=2025-07-20&guest_count=2"
```

### Проверка health check:

```bash
curl http://localhost:3000/health
```

### Получение списка номеров:

```bash
curl "http://localhost:3000/api/rooms?hotel_id=1&page=1&limit=5"
```

## 🔒 VIP функциональность

Система автоматически проверяет VIP статус клиентов через внешний API. VIP клиенты получают:

- Автоматические скидки (15-20%)
- Специальный tier статус
- Приоритетное обслуживание

### VIP Email'ы для тестирования:
- vip1@example.com
- vip2@example.com
- premium@hotel.com
- gold@customer.com

### Тестирование VIP функциональности:

```bash
# Создание бронирования с VIP клиентом
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "John",
      "last_name": "VIP",
      "email": "vip1@example.com"
    },
    "room_id": 1,
    "check_in_date": "2025-08-01",
    "check_out_date": "2025-08-05",
    "guest_count": 1
  }'
```

## 🛡 Предотвращение двойного бронирования

Система использует несколько механизмов защиты:

1. **Уникальный индекс в БД** для активных бронирований
2. **Транзакции** для атомарности операций
3. **Проверка доступности** перед созданием бронирования

### Тестирование конфликта бронирования:

```bash
# Попытка забронировать уже занятый номер
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com"
    },
    "room_id": 1,
    "check_in_date": "2025-07-01",
    "check_out_date": "2025-07-03",
    "guest_count": 1
  }'
```

## 🗄 База данных

### Основные таблицы:
- `hotels` - Отели
- `room_types` - Типы номеров
- `rooms` - Номера
- `clients` - Клиенты
- `bookings` - Бронирования

### Тестовые данные включают:
- 3 отеля с разными типами номеров
- 25+ номеров различных категорий
- 10 тестовых клиентов (4 VIP)
- Примеры бронирований

### Доступ к базе данных:

```bash
# Через pgAdmin
# URL: http://localhost:5050
# Email: admin@hotel.com
# Password: admin

# Или через psql в контейнере
docker exec -it hotel_booking_db psql -U hotel_user -d hotel_booking
```

## 📊 Мониторинг

- Health check endpoints для мониторинга
- Логирование всех операций
- Метрики производительности
- Статистика бронирований

### Проверка состояния системы:

```bash
# Базовая проверка
curl http://localhost:3000/health

# Детальная проверка
curl http://localhost:3000/health/detailed

# Проверка БД
curl http://localhost:3000/health/database
```

### Получение статистики:

```bash
# Общая статистика
curl http://localhost:3000/api/bookings/stats

# Статистика по отелю
curl "http://localhost:3000/api/bookings/stats?hotel_id=1"

# Статистика за период
curl "http://localhost:3000/api/bookings/stats?date_from=2025-01-01&date_to=2025-12-31"
```

## 🚨 Обработка ошибок

API возвращает структурированные ошибки:

```json
{
  "success": false,
  "error": {
    "message": "Room is already booked for the selected dates"
  }
}
```

### Коды ошибок:
- **400** - Неверный запрос
- **404** - Ресурс не найден
- **409** - Конфликт (двойное бронирование)
- **422** - Ошибка валидации
- **500** - Внутренняя ошибка сервера

## 📈 Масштабирование

Архитектура поддерживает:
- Горизонтальное масштабирование API
- Репликацию БД
- Кэширование
- Load balancing

## 🔧 Полезные команды Docker

```bash
# Просмотр логов всех сервисов
docker-compose logs

# Просмотр логов конкретного сервиса
docker-compose logs api
docker-compose logs db
docker-compose logs mock-vip-api

# Перезапуск сервиса
docker-compose restart api

# Пересборка и запуск
docker-compose up --build

# Очистка контейнеров и образов
docker-compose down --rmi all --volumes --remove-orphans

# Подключение к контейнеру
docker exec -it hotel_booking_api bash
docker exec -it hotel_booking_db psql -U hotel_user -d hotel_booking
```

## 🤝 Разработка

### Добавление новых функций:
1. Создайте новые модели в `src/models/`
2. Добавьте бизнес-логику в `src/services/`
3. Создайте маршруты в `src/routes/`
4. Добавьте валидацию в `src/middleware/`
5. Обновите документацию

### Стандарты кода:
- ESLint для линтинга
- Prettier для форматирования
- Swagger для документации
- Jest для тестирования

### Структура коммитов:
```
feat: добавить новую функциональность
fix: исправить ошибку
docs: обновить документацию
style: форматирование кода
refactor: рефакторинг без изменения функциональности
test: добавить тесты
chore: вспомогательные изменения
```

## 🛟 Решение проблем

### Часто встречающиеся проблемы:

1. **Порты заняты**
   ```bash
   # Проверить занятые порты
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5432
   
   # Изменить порты в docker-compose.yml
   ```

2. **Контейнер не запускается**
   ```bash
   # Проверить логи
   docker-compose logs api
   
   # Пересобрать контейнер
   docker-compose up --build api
   ```

3. **База данных недоступна**
   ```bash
   # Проверить статус контейнера БД
   docker-compose ps db
   
   # Проверить логи БД
   docker-compose logs db
   ```

4. **VIP API не работает**
   ```bash
   # Проверить Mock VIP API
   curl http://localhost:3001/health
   
   # Проверить логи
   docker-compose logs mock-vip-api
   ```

### Сброс проекта:

```bash
# Полная очистка
docker-compose down --rmi all --volumes --remove-orphans
docker system prune -a

# Пересоздание
docker-compose up --build
```

## 📝 Чек-лист для проверки

### Базовые проверки:
- [ ] API запускается без ошибок
- [ ] Health check возвращает OK
- [ ] Swagger документация доступна
- [ ] База данных подключается

### Функциональные проверки:
- [ ] Получение списка номеров
- [ ] Поиск свободных номеров
- [ ] Создание бронирования
- [ ] VIP скидки применяются
- [ ] Двойное бронирование блокируется
- [ ] Отмена бронирования работает

### Интеграционные проверки:
- [ ] VIP API отвечает
- [ ] pgAdmin подключается к БД
- [ ] Все тестовые данные загружены

