-- Database Schema for Hotel Booking System
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE booking_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE room_status AS ENUM ('available', 'maintenance', 'out_of_order');

-- Hotels table
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room types table
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price > 0),
    max_occupancy INTEGER NOT NULL CHECK (max_occupancy > 0),
    amenities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    room_number VARCHAR(20) NOT NULL,
    floor INTEGER,
    status room_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, room_number)
);

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    is_vip BOOLEAN DEFAULT FALSE,
    vip_tier VARCHAR(50),
    vip_discount DECIMAL(5,2) DEFAULT 0,
    vip_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    original_price DECIMAL(10,2) NOT NULL CHECK (original_price > 0),
    vip_discount_applied DECIMAL(5,2) DEFAULT 0,
    status booking_status DEFAULT 'active',
    special_requests TEXT,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Business constraints
    CHECK (check_out_date > check_in_date),
    CHECK (guest_count > 0)
);

-- Create indexes for performance
CREATE INDEX idx_rooms_hotel_status ON rooms(hotel_id, status);
CREATE INDEX idx_rooms_type ON rooms(room_type_id);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_vip ON clients(is_vip);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_uuid ON bookings(booking_uuid);

-- Unique index to prevent double booking
CREATE UNIQUE INDEX idx_bookings_no_overlap ON bookings(room_id, check_in_date, check_out_date)
WHERE status = 'active';

-- Partial index for active bookings performance
CREATE INDEX idx_bookings_active_dates ON bookings(room_id, check_in_date, check_out_date)
WHERE status = 'active';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
    p_room_id INTEGER,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM bookings
    WHERE room_id = p_room_id
        AND status = 'active'
        AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
        AND (
            (check_in_date < p_check_out AND check_out_date > p_check_in)
        );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate booking price with VIP discount
CREATE OR REPLACE FUNCTION calculate_booking_price(
    p_room_type_id INTEGER,
    p_check_in DATE,
    p_check_out DATE,
    p_vip_discount DECIMAL DEFAULT 0
)
RETURNS TABLE(original_price DECIMAL, final_price DECIMAL) AS $$
DECLARE
    base_price DECIMAL;
    nights INTEGER;
    orig_price DECIMAL;
    final_price DECIMAL;
BEGIN
    -- Get base price for room type
    SELECT rt.base_price INTO base_price
    FROM room_types rt
    WHERE rt.id = p_room_type_id;
    
    -- Calculate number of nights
    nights := p_check_out - p_check_in;
    
    -- Calculate prices
    orig_price := base_price * nights;
    final_price := orig_price * (100 - p_vip_discount) / 100;
    
    RETURN QUERY SELECT orig_price, final_price;
END;
$$ LANGUAGE plpgsql;
