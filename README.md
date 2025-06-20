# Hotel Booking API

🏨 **REST API для системы бронирования номеров в отеле с поддержкой VIP клиентов**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com/)
[![API](https://img.shields.io/badge/API-REST-orange.svg)](http://localhost:3000/api-docs)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Описание

Hotel Booking API - это полнофункциональный REST API для управления бронированием номеров в отеле. Система поддерживает все основные операции бронирования, интеграцию с внешним VIP API для автоматического применения скидок, и включает защиту от двойного бронирования.

### ✨ Основные возможности

- 🏨 **Управление номерами**: Просмотр списка номеров и поиск свободных на определенные даты
- 📝 **Бронирование**: Создание, изменение и отмена бронирований
- ⭐ **VIP система**: Автоматическая проверка VIP статуса через внешний API с применением скидок
- 🛡️ **Защита от конфликтов**: Предотвращение двойного бронирования одного номера
- 📊 **Аналитика**: Статистика бронирований и выручки
- 📚 **Документация**: Полная OpenAPI/Swagger документация

## 🎯 Выполненные требования тестового задания

### Бизнес-требования ✅
- [x] Клиент может увидеть список номеров в отеле
- [x] Клиент может увидеть список свободных номеров на определенный период времени
- [x] Клиент может забронировать номер в отеле на определенный срок
- [x] Клиент может отменить бронь номера в отеле
- [x] VIP статус клиента проверяется через внешний API с фиксацией в бронь
- [x] Защита: 2 клиента не могут забронировать один номер на пересекающиеся периоды

### Технические требования ✅
- [x] **СУБД**: PostgreSQL с полной схемой и индексами
- [x] **API Backend**: Node.js + Express.js с валидацией и обработкой ошибок
- [x] **Развертывание**: Docker Compose для простого запуска

## 🚀 Быстрый старт

### Предварительные требования
- Docker 20.10+
- Docker Compose 2.0+
- Свободные порты: 3000, 3001, 5432, 5050

### Запуск системы

```bash
# 1. Клонирование репозитория
git clone https://github.com/YOUR_USERNAME/hotel-booking-api.git
cd hotel-booking-api

# 2. Запуск всех сервисов
docker-compose up -d --build

# 3. Проверка готовности
curl http://localhost:3000/health
```

### Первое бронирование

```bash
# VIP бронирование с автоматической скидкой 15%
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "VIP",
      "last_name": "Customer",
      "email": "vip1@example.com"
    },
    "room_id": 1,
    "check_in_date": "2025-08-01",
    "check_out_date": "2025-08-05",
    "guest_count": 1
  }'
```

## 🔗 Доступные интерфейсы

| Сервис | URL | Описание | Доступ |
|--------|-----|----------|--------|
| 🚀 **API** | http://localhost:3000 | Основной REST API | Публичный |
| 📚 **Swagger UI** | http://localhost:3000/api-docs | Интерактивная документация | Публичный |
| 🏥 **Health Check** | http://localhost:3000/health | Мониторинг состояния | Публичный |
| 🗄️ **pgAdmin** | http://localhost:5050 | Управление базой данных | admin@hotel.com / admin |
| ⭐ **Mock VIP API** | http://localhost:3001 | Имитация внешнего VIP сервиса | Внутренний |

## 📚 API Документация

### Основные endpoints

#### 🏨 Номера
```http
GET    /api/rooms?hotel_id=1                    # Список номеров отеля
GET    /api/rooms/available?hotel_id=1&...      # Свободные номера на даты
GET    /api/rooms/{id}                          # Детали номера
GET    /api/rooms/types                         # Типы номеров
```

#### 📝 Бронирования
```http
POST   /api/bookings                            # Создать бронирование
GET    /api/bookings                            # Список бронирований
GET    /api/bookings/{uuid}                     # Детали бронирования
PUT    /api/bookings/{uuid}                     # Изменить бронирование
DELETE /api/bookings/{uuid}/cancel              # Отменить бронирование
GET    /api/bookings/stats                      # Статистика
```

#### 👥 Клиенты
```http
POST   /api/clients                             # Создать клиента
GET    /api/clients                             # Список клиентов
GET    /api/clients/{id}                        # Детали клиента
GET    /api/clients/{id}/vip-status             # VIP статус клиента
GET    /api/clients/{id}/bookings               # Бронирования клиента
```

#### 🏥 Мониторинг
```http
GET    /health                                  # Базовая проверка
GET    /health/detailed                         # Детальная проверка
GET    /health/database                         # Состояние БД
```

### Примеры использования

<details>
<summary>🔍 Поиск свободных номеров</summary>

```bash
curl "http://localhost:3000/api/rooms/available?hotel_id=1&check_in_date=2025-08-01&check_out_date=2025-08-05&guest_count=2"
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "hotel_id": 1,
    "available_rooms": [
      {
        "id": 1,
        "room_number": "101",
        "roomType": {
          "name": "Standard Single",
          "base_price": 99.99
        },
        "pricing": {
          "original_price": 399.96,
          "total_price": 399.96,
          "nights": 4,
          "price_per_night": 99.99
        }
      }
    ]
  }
}
```
</details>

<details>
<summary>⭐ VIP бронирование</summary>

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "VIP",
      "last_name": "Customer",
      "email": "vip1@example.com"
    },
    "room_id": 1,
    "check_in_date": "2025-08-01",
    "check_out_date": "2025-08-05",
    "guest_count": 1
  }'
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "booking_uuid": "dd7a64f3-952b-4663-8258-15bf863dbc90",
      "total_price": 339.97,
      "original_price": 399.96,
      "vip_discount_applied": 15,
      "savings_amount": 59.99
    },
    "vip_applied": true
  }
}
```
</details>

<details>
<summary>🛡️ Защита от двойного бронирования</summary>

```bash
# Попытка забронировать уже занятый номер
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {"first_name": "Test", "last_name": "User", "email": "test@example.com"},
    "room_id": 1,
    "check_in_date": "2025-08-02",
    "check_out_date": "2025-08-04",
    "guest_count": 1
  }'
```

**Ответ:**
```json
{
  "success": false,
  "error": {
    "message": "Room is already booked for the selected dates"
  }
}
```
</details>

## 🗄️ База данных

### Схема БД
- **hotels** - Отели
- **room_types** - Типы номеров (Standard, Deluxe, Presidential, etc.)
- **rooms** - Номера с привязкой к отелям и типам
- **clients** - Клиенты с VIP статусом
- **bookings** - Бронирования с защитой от конфликтов

### Демо данные
- 🏨 **3 отеля**: Grand Plaza Hotel, Seaside Resort, Business Inn
- 🛏️ **33 номера**: от Economy ($79.99) до Presidential Suite ($599.99)
- 👥 **11 клиентов**: 4 VIP + 7 обычных
- 📝 **13 бронирований**: активные, завершенные, отмененные

### VIP тестовые аккаунты
Используйте эти email'ы для тестирования VIP скидок:
- `vip1@example.com` - Gold (15% скидка)
- `vip2@example.com` - Gold (15% скидка)
- `premium@hotel.com` - Platinum (20% скидка)
- `gold@customer.com` - Gold (15% скидка)

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Swagger UI    │    │    pgAdmin      │
│  (Your Frontend)│    │ (Documentation) │    │  (DB Manager)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Hotel Booking API      │
                    │      (Node.js)           │
                    └─────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────┴───────┐ ┌────────┴────────┐ ┌──────┴──────┐
    │  PostgreSQL DB  │ │  Mock VIP API   │ │   Redis     │
    │   (Main Data)   │ │ (External Svc)  │ │  (Future)   │
    └─────────────────┘ └─────────────────┘ └─────────────┘
```

### Технологический стек
- **Backend**: Node.js 18+, Express.js, Sequelize ORM
- **База данных**: PostgreSQL 15+ с JSONB поддержкой
- **Валидация**: Joi для входных данных
- **Документация**: Swagger/OpenAPI 3.0
- **Контейнеризация**: Docker + Docker Compose
- **Мониторинг**: Health checks + логирование

## 🧪 Тестирование

### Автоматическое тестирование
```bash
npm test                    # Запуск тестов
npm run test:watch         # Тесты в watch режиме
```

### Ручное тестирование
1. **Swagger UI**: http://localhost:3000/api-docs
2. **Postman Collection**: Импортируйте OpenAPI спецификацию
3. **curl команды**: См. [Пошаговую инструкцию](TESTING_GUIDE.md)

### Нагрузочное тестирование
```bash
# Тест производительности поиска номеров
ab -n 1000 -c 10 "http://localhost:3000/api/rooms/available?hotel_id=1&check_in_date=2025-08-01&check_out_date=2025-08-05"
```

## 📊 Мониторинг

### Health Checks
```bash
# Базовая проверка
curl http://localhost:3000/health

# Детальная проверка с зависимостями
curl http://localhost:3000/health/detailed

# Проверка базы данных
curl http://localhost:3000/health/database
```

### Метрики
- Время отклика API
- Статус подключения к БД
- Доступность VIP сервиса
- Статистика бронирований

### Логирование
```bash
# Просмотр логов
docker-compose logs -f api

# Фильтрация ошибок
docker-compose logs api | grep ERROR
```

## 🛠️ Разработка

### Локальная разработка
```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Линтинг кода
npm run lint
npm run lint:fix
```

### Структура проекта
```
hotel-booking-api/
├── src/
│   ├── config/           # Конфигурация БД
│   ├── models/           # Модели Sequelize
│   ├── services/         # Бизнес-логика
│   ├── middleware/       # Валидация и обработка ошибок
│   ├── routes/           # API маршруты
│   └── app.js           # Главный файл приложения
├── database/
│   ├── schema.sql       # Схема БД
│   ├── test_data.sql    # Тестовые данные
│   └── dumps/           # Дампы для восстановления
├── mock-vip/            # Mock VIP API
├── docker-compose.yml   # Docker конфигурация
└── docs/               # Документация
```

### API Design Guidelines
- RESTful endpoints
- Консистентные HTTP статус коды
- JSON формат данных
- Валидация всех входных данных
- Понятные сообщения об ошибках
- Pagination для списков

## 🔒 Безопасность

### Реализованные меры
- ✅ Валидация всех входных данных (Joi)
- ✅ Санитизация SQL запросов (Sequelize ORM)
- ✅ Rate limiting (100 req/15min)
- ✅ CORS настройки
- ✅ Helmet.js для HTTP заголовков
- ✅ Обработка ошибок без утечки информации

### Для продакшена
- 🔄 Аутентификация/Авторизация (JWT)
- 🔄 HTTPS шифрование
- 🔄 Аудит логи
- 🔄 Secrets management

## 📈 Производительность

### Оптимизации БД
- Индексы для частых запросов
- Уникальный индекс для предотвращения двойного бронирования
- Партиционирование для крупных таблиц (будущее)

### API оптимизации
- Connection pooling
- Кэширование (Redis ready)
- Pagination для больших наборов данных
- Async/await для неблокирующих операций

## 🚀 Развертывание

### Продакшен
```bash
# Сборка production образа
docker build -t hotel-booking-api:latest .

# Запуск с production конфигурацией
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD
```yaml
# Пример GitHub Actions
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose up -d --build
      - run: npm test
```

## 📝 Changelog

### v1.0.0 (2025-06-20)
- ✅ Полная реализация всех бизнес-требований
- ✅ VIP система с внешним API
- ✅ Защита от двойного бронирования
- ✅ Swagger документация
- ✅ Docker развертывание
- ✅ Comprehensive тестирование

## 🤝 Contributing

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. [LICENSE](LICENSE) файл.

## 👥 Автор

**Валерий Халиков**
- GitHub: [@your-username](https://github.com/your-username)
- Email: your.email@example.com

## 🙏 Благодарности

- PostgreSQL команде за отличную СУБД
- Node.js сообществу за экосистему
- Docker за простоту развертывания

---

<div align="center">

**[🚀 Начать использование](#-быстрый-старт) | [📚 API Docs](http://localhost:3000/api-docs) | [🐛 Report Bug](issues) | [💡 Request Feature](issues)**

Made with ❤️ for hotel management

</div>