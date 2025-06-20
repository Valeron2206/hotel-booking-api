# Пошаговая инструкция для проверки Hotel Booking API

## 📚 Содержание

- [🎯 Цель проверки](#-цель-проверки)
- [🚀 Предварительная подготовка](#-предварительная-подготовка)
- [📋 ТЕСТ 1: Список номеров в отеле](#-тест-1-список-номеров-в-отеле)
- [🔍 ТЕСТ 2: Поиск свободных номеров на период](#-тест-2-поиск-свободных-номеров-на-период)
- [📝 ТЕСТ 3: Бронирование номера (обычный клиент)](#-тест-3-бронирование-номера-обычный-клиент)
- [⭐ ТЕСТ 4: VIP бронирование с внешним API](#-тест-4-vip-бронирование-с-внешним-api)
- [🛡️ ТЕСТ 5: Защита от двойного бронирования](#️-тест-5-защита-от-двойного-бронирования)
- [❌ ТЕСТ 6: Отмена бронирования](#-тест-6-отмена-бронирования)
- [📊 ТЕСТ 7: Дополнительные функции](#-тест-7-дополнительные-функции)
- [🌐 ТЕСТ 8: Интерактивное тестирование](#-тест-8-интерактивное-тестирование)

---

## 🎯 Цель проверки

Данная инструкция проверяет все бизнес-требования тестового задания:
- Список номеров в отеле ✅
- Поиск свободных номеров на период ✅
- Бронирование номера ✅
- Отмена бронирования ✅
- VIP статус с внешним API ✅
- Защита от двойного бронирования ✅

---

## 🚀 Предварительная подготовка

### 1. Запуск системы
```bash
docker-compose up -d --build
```

### 2. Проверка готовности
```bash
# Проверка статуса контейнеров
docker-compose ps

# Health check (должен вернуть {"status":"ok"})
curl http://localhost:3000/health
```

### 3. Открытие интерфейсов
- **Swagger UI**: http://localhost:3000/api-docs (для интерактивного тестирования)
- **pgAdmin**: http://localhost:5050 (для проверки данных)

---

## 📋 ТЕСТ 1: Список номеров в отеле

### Цель: Проверить получение списка всех номеров отеля

```bash
# Получить все номера отеля ID=1 (Grand Plaza Hotel)
curl "http://localhost:3000/api/rooms?hotel_id=1&limit=20"
```

**Ожидаемый результат:**
- HTTP 200 OK
- Список номеров с типами: Standard Single, Standard Double, Deluxe Suite, Presidential Suite
- Номера: 101, 102, 103, 104, 105, 201, 202, 203, 204, 205, 301, 302, 303, 304, 305
- Номер 204 в статусе "maintenance"

**Критерии успеха:**
- ✅ Возвращается корректный JSON
- ✅ Показаны все номера отеля
- ✅ Включена информация о типах номеров и ценах

---

## 🔍 ТЕСТ 2: Поиск свободных номеров на период

### Цель: Найти доступные номера на определенные даты

```bash
# Поиск свободных номеров на август 2025
curl "http://localhost:3000/api/rooms/available?hotel_id=1&check_in_date=2025-08-20&check_out_date=2025-08-25&guest_count=2"
```

**Ожидаемый результат:**
- HTTP 200 OK
- Список доступных номеров с ценами за период
- Исключены уже забронированные номера
- Показаны только номера с вместимостью >= 2 гостей

**Дополнительная проверка:**
```bash
# Поиск с фильтром по типу номера
curl "http://localhost:3000/api/rooms/available?hotel_id=1&check_in_date=2025-09-10&check_out_date=2025-09-15&guest_count=1&room_type_id=3"
```

**Критерии успеха:**
- ✅ Корректная фильтрация по датам
- ✅ Исключение занятых номеров
- ✅ Правильный расчет стоимости за период
- ✅ Фильтрация по количеству гостей

---

## 📝 ТЕСТ 3: Бронирование номера (обычный клиент)

### Цель: Создать бронирование для обычного клиента

```bash
# Бронирование номера обычным клиентом
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "Test",
      "last_name": "Customer",
      "email": "test.customer@example.com",
      "phone": "+1-555-1234"
    },
    "room_id": 4,
    "check_in_date": "2025-10-01",
    "check_out_date": "2025-10-05",
    "guest_count": 2,
    "special_requests": "Non-smoking room please"
  }'
```

**Ожидаемый результат:**
- HTTP 201 Created
- Создано новое бронирование с UUID
- **Нет VIP скидки** (total_price = original_price)
- Клиент автоматически создан в системе

**Сохраните UUID бронирования для следующих тестов!**

**Критерии успеха:**
- ✅ Бронирование создано успешно
- ✅ Получен уникальный UUID
- ✅ Цена без скидки
- ✅ Клиент сохранен в базе

---

## ⭐ ТЕСТ 4: VIP бронирование с внешним API

### Цель: Проверить VIP функциональность и интеграцию с внешним API

```bash
# Бронирование VIP клиентом (автоматическая скидка 15%)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "VIP",
      "last_name": "Customer",
      "email": "vip1@example.com",
      "phone": "+1-555-9999"
    },
    "room_id": 5,
    "check_in_date": "2025-10-10",
    "check_out_date": "2025-10-15",
    "guest_count": 1,
    "special_requests": "VIP service requested"
  }'
```

**Ожидаемый результат:**
- HTTP 201 Created
- **VIP скидка 15%** применена автоматически
- `vip_discount_applied: 15`
- `total_price` < `original_price`
- Экономия ~15% от original_price

**Проверка других VIP клиентов:**
```bash
# VIP Platinum клиент (скидка 20%)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "Premium",
      "last_name": "Client", 
      "email": "premium@hotel.com"
    },
    "room_id": 6,
    "check_in_date": "2025-11-01",
    "check_out_date": "2025-11-05",
    "guest_count": 2
  }'
```

**Критерии успеха:**
- ✅ VIP статус определен через внешний API
- ✅ Скидка применена автоматически (15% или 20%)
- ✅ Информация о VIP статусе сохранена в бронь
- ✅ Экономия рассчитана корректно

---

## 🛡️ ТЕСТ 5: Защита от двойного бронирования

### Цель: Убедиться, что система предотвращает конфликты бронирования

```bash
# Попытка забронировать уже занятый номер и период
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "Another",
      "last_name": "User",
      "email": "another@example.com"
    },
    "room_id": 4,
    "check_in_date": "2025-10-02",
    "check_out_date": "2025-10-04",
    "guest_count": 1
  }'
```

**Ожидаемый результат:**
- **HTTP 409 Conflict**
- Сообщение: "Room is already booked for the selected dates"
- Бронирование НЕ создано

**Дополнительная проверка - пересекающиеся даты:**
```bash
# Попытка с частично пересекающимися датами
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_info": {
      "first_name": "Test",
      "last_name": "Overlap",
      "email": "overlap@example.com"
    },
    "room_id": 4,
    "check_in_date": "2025-10-04",
    "check_out_date": "2025-10-06",
    "guest_count": 1
  }'
```

**Критерии успеха:**
- ✅ Конфликт обнаружен и предотвращен
- ✅ Возвращена ошибка 409
- ✅ Система защищена от двойного бронирования
- ✅ Проверка работает для пересекающихся периодов

---

## ❌ ТЕСТ 6: Отмена бронирования

### Цель: Проверить функцию отмены бронирования

```bash
# Получение деталей бронирования (используйте UUID из ТЕСТА 3)
curl "http://localhost:3000/api/bookings/YOUR_BOOKING_UUID"

# Отмена бронирования
curl -X DELETE "http://localhost:3000/api/bookings/YOUR_BOOKING_UUID/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Plans changed - testing cancellation"
  }'
```

**Ожидаемый результат:**
- HTTP 200 OK
- Статус изменен на "cancelled"
- Указана дата отмены `cancelled_at`
- Причина отмены сохранена

**Проверка ограничений отмены:**
```bash
# Попытка отменить уже отмененное бронирование
curl -X DELETE "http://localhost:3000/api/bookings/YOUR_BOOKING_UUID/cancel"
```

**Ожидаемый результат:**
- HTTP 400 Bad Request
- Сообщение: "Only active bookings can be cancelled"

**Критерии успеха:**
- ✅ Активное бронирование отменено успешно
- ✅ Невозможно отменить уже отмененное бронирование
- ✅ Сохранена причина отмены
- ✅ Установлена метка времени отмены

---

## 📊 ТЕСТ 7: Дополнительные функции

### 7.1 Статистика бронирований
```bash
curl "http://localhost:3000/api/bookings/stats"
```

**Ожидаемый результат:**
- Общее количество бронирований
- Количество активных/отмененных/завершенных
- Количество VIP бронирований
- Общая выручка
- Процент отмен и VIP клиентов

### 7.2 Получение всех бронирований
```bash
curl "http://localhost:3000/api/bookings?limit=20"
```

### 7.3 Управление клиентами
```bash
# Список клиентов
curl "http://localhost:3000/api/clients?limit=10"

# VIP клиенты
curl "http://localhost:3000/api/clients?vip_only=true"
```

---

## 🌐 ТЕСТ 8: Интерактивное тестирование

### Swagger UI
1. Откройте http://localhost:3000/api-docs
2. Протестируйте любой endpoint интерактивно
3. Изучите полную документацию API

### pgAdmin (проверка данных)
1. Откройте http://localhost:5050
2. Войдите: admin@hotel.com / admin
3. Подключитесь к БД: host=db, user=hotel_user, password=hotel_password
4. Выполните SQL запросы:

```sql
-- Проверка созданных бронирований
SELECT b.*, c.first_name, c.last_name, c.is_vip, r.room_number 
FROM bookings b 
JOIN clients c ON b.client_id = c.id 
JOIN rooms r ON b.room_id = r.id 
ORDER BY b.created_at DESC;

-- VIP статистика
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN c.is_vip THEN 1 END) as vip_bookings,
  SUM(b.total_price) as total_revenue
FROM bookings b 
JOIN clients c ON b.client_id = c.id 
WHERE b.status = 'active';
```