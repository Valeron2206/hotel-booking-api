# Hotel Booking API

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com/)
[![API](https://img.shields.io/badge/API-REST-orange.svg)](http://localhost:3000/api-docs)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Описание

Hotel Booking API — это полнофункциональный REST API для управления бронированием номеров в отеле. Система поддерживает все основные операции бронирования, интеграцию с внешним VIP API для автоматического применения скидок и включает защиту от двойного бронирования.

### Основные возможности

* **Управление номерами**: Просмотр списка номеров и поиск свободных на определённые даты.
* **Бронирование**: Создание, изменение и отмена бронирований.
* **VIP система**: Автоматическая проверка VIP статуса через внешний API.
* **Защита от конфликтов**: Предотвращение двойного бронирования одного номера.
* **Аналитика**: Получение статистики по бронированиям.
* **Документация**: Полная OpenAPI/Swagger документация.

## Быстрый старт

**Предварительные требования:** Docker и Docker Compose

```bash
# 1. Клонирование репозитория
git clone https://github.com/YOUR_USERNAME/hotel-booking-api.git
cd hotel-booking-api

# 2. Запуск всех сервисов
docker-compose up -d --build

# 3. Проверка готовности системы
curl http://localhost:3000/health/detailed
```

## Документация и тестирование

Все подробные инструкции по развертыванию, тестированию и примеры использования API вынесены в отдельные документы:

| Документ                      | Ссылка                              | Описание                                       |
|-------------------------------|-------------------------------------|------------------------------------------------|
| Инструкция по развертыванию   | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Детальное руководство по установке и настройке. |
| Инструкция по проверке        | [docs/TESTING.md](docs/TESTING.md)        | Пошаговые сценарии для проверки всего функционала. |
| Swagger UI                    | [http://localhost:3000/api-docs](http://localhost:3000/api-docs) | Интерактивная API документация.                |

## Доступные интерфейсы

| Сервис   | URL                        | Доступ                      |
|----------|----------------------------|-----------------------------|
| API      | http://localhost:3000      | Публичный                   |
| pgAdmin  | http://localhost:5050      | admin@hotel.com / admin     |

**Настройка pgAdmin**:  
При первом входе добавьте новый сервер:  
Host: `db`, Port: `5432`, User: `hotel_user`, Password: `hotel_password`

## Архитектура и стек

Проект реализован на Node.js и PostgreSQL, полностью контейнеризирован с помощью Docker.

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Swagger UI    │    │    pgAdmin      │
│ (UI, Postman)   │    │ (Документация)  │    │ (DB Manager)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────┬───────┴───────┬──────────────┘
                         │               │
                 ┌───────▼───────────────▼───────┐
                 │      Hotel Booking API        │
                 │           (Node.js)           │
                 └──────────────┬────────────────┘
                                │
               ┌────────────────┼
               │                │             
     ┌─────────▼──────┐ ┌───────▼──────┐
     │ PostgreSQL DB  │ │ Mock VIP API │
     │  (Main Data)   │ │(External Svc)│
     └────────────────┘ └──────────────┘
```