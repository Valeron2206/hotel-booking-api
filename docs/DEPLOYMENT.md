# Инструкция по развертыванию Hotel Booking API

## 🎯 Системные требования

- **Docker**: версия 20.10+
- **Docker Compose**: версия 2.0+
- **Свободные порты**: 3000, 3001, 5432, 5050
- **RAM**: минимум 2GB
- **Дисковое пространство**: минимум 1GB

## 🚀 Быстрое развертывание

### Вариант 1: Автоматическое развертывание

```bash
# 1. Клонирование репозитория
git clone https://github.com/YOUR_USERNAME/hotel-booking-api.git
cd hotel-booking-api

# 2. Запуск всех сервисов
docker-compose up -d --build

# 3. Проверка статуса
docker-compose ps
```

### Вариант 2: Пошаговое развертывание

```bash
# 1. Клонирование и подготовка
git clone https://github.com/YOUR_USERNAME/hotel-booking-api.git
cd hotel-booking-api

# 2. Настройка окружения (опционально)
cp .env.example .env
# Отредактируйте .env при необходимости

# 3. Сборка образов
docker-compose build

# 4. Запуск базы данных
docker-compose up -d db

# 5. Ожидание готовности БД (30-60 сек)
docker-compose logs -f db

# 6. Запуск остальных сервисов
docker-compose up -d

# 7. Проверка логов
docker-compose logs -f api
```

## 🗄️ Восстановление базы данных

### Автоматическое восстановление
База данных автоматически инициализируется при первом запуске.

### Ручное восстановление (если требуется)

```bash
# Вариант 1: Полный дамп (рекомендуется)
docker exec -i hotel_booking_db psql -U hotel_user -d hotel_booking < database_dumps/hotel_booking_full_dump.sql

# Вариант 2: Схема + данные
docker exec -i hotel_booking_db psql -U hotel_user -d hotel_booking < database_dumps/hotel_booking_init.sql
```

## ✅ Проверка развертывания

```bash
# 1. Проверка статуса контейнеров
docker-compose ps

# 2. Health check API
curl http://localhost:3000/health

# 3. Проверка базы данных
curl http://localhost:3000/health/database

# 4. Проверка VIP сервиса
curl http://localhost:3001/health
```

**Ожидаемые результаты:**
- Все контейнеры в статусе "Up"
- API отвечает `{"status":"ok"}`
- БД подключена
- VIP сервис доступен

## 🔗 Доступ к сервисам

| Сервис | URL | Описание |
|--------|-----|----------|
| **API** | http://localhost:3000 | Основной API |
| **Swagger UI** | http://localhost:3000/api-docs | Интерактивная документация |
| **Health Check** | http://localhost:3000/health | Статус системы |
| **pgAdmin** | http://localhost:5050 | Управление БД |
| **Mock VIP API** | http://localhost:3001 | Внешний VIP сервис |

### Доступ к pgAdmin
- **URL**: http://localhost:5050
- **Email**: admin@hotel.com
- **Password**: admin

**Настройка подключения к БД в pgAdmin:**
- **Host**: db
- **Port**: 5432
- **Database**: hotel_booking
- **Username**: hotel_user
- **Password**: hotel_password

## 🛠️ Управление сервисами

```bash
# Остановка всех сервисов
docker-compose down

# Перезапуск конкретного сервиса
docker-compose restart api

# Просмотр логов
docker-compose logs -f api

# Обновление образов
docker-compose pull
docker-compose up -d --build
```

## 🔧 Устранение неполадок

### Проблема: Порт занят
```bash
# Найти процесс, использующий порт
lsof -i :3000

# Изменить порт в docker-compose.yml
ports:
  - "3001:3000"  # Внешний порт 3001
```

### Проблема: База данных не запускается
```bash
# Очистка данных БД
docker-compose down --volumes

# Перезапуск
docker-compose up -d --build
```

### Проблема: API не отвечает
```bash
# Проверка логов
docker-compose logs api

# Перезапуск API
docker-compose restart api
```

## 📊 Мониторинг

### Основные метрики
```bash
# Использование ресурсов
docker stats

# Логи в реальном времени
docker-compose logs -f

# Статистика API
curl http://localhost:3000/api/bookings/stats
```

### Health Checks
```bash
# Базовая проверка
curl http://localhost:3000/health

# Детальная проверка
curl http://localhost:3000/health/detailed
```
