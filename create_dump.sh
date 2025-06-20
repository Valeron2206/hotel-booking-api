
#!/bin/bash
echo "🗄️ Создание дампов базы данных..."

# Создаем папку
mkdir -p database_dumps

# Создаем полный дамп
echo "📥 Создание полного дампа..."
docker exec hotel_booking_db pg_dump -U hotel_user -d hotel_booking --clean --if-exists > database_dumps/hotel_booking_full_dump.sql

# Копируем готовый файл инициализации
echo "📄 Копирование файла инициализации..."
cp database/init/init.sql database_dumps/hotel_booking_init.sql

echo "✅ Готово! Файлы созданы в папке database_dumps/"
