-- Test data for Hotel Booking System

-- Insert test hotels
INSERT INTO hotels (name, address, phone, email, description) VALUES
('Grand Plaza Hotel', '123 Main Street, City Center', '+1-555-0100', 'info@grandplaza.com', 'Luxury hotel in the heart of the city'),
('Seaside Resort', '456 Ocean Drive, Beachfront', '+1-555-0200', 'reservations@seasideresort.com', 'Beautiful beachfront resort with ocean views'),
('Business Inn', '789 Corporate Blvd, Business District', '+1-555-0300', 'bookings@businessinn.com', 'Modern hotel for business travelers');

-- Insert room types
INSERT INTO room_types (name, description, base_price, max_occupancy, amenities) VALUES
('Standard Single', 'Comfortable single room with basic amenities', 99.99, 1, 
 '["Wi-Fi", "TV", "Air Conditioning", "Private Bathroom"]'),
('Standard Double', 'Spacious double room for two guests', 149.99, 2, 
 '["Wi-Fi", "TV", "Air Conditioning", "Private Bathroom", "Mini Fridge"]'),
('Deluxe Suite', 'Luxury suite with living area and premium amenities', 299.99, 4, 
 '["Wi-Fi", "Smart TV", "Air Conditioning", "Private Bathroom", "Mini Fridge", "Coffee Machine", "Balcony"]'),
('Presidential Suite', 'Top-tier suite with exclusive amenities', 599.99, 6, 
 '["Wi-Fi", "Smart TV", "Air Conditioning", "Private Bathroom", "Full Kitchen", "Coffee Machine", "Balcony", "Jacuzzi", "Butler Service"]'),
('Economy Room', 'Budget-friendly room with essential amenities', 79.99, 2, 
 '["Wi-Fi", "TV", "Air Conditioning", "Shared Bathroom"]');

-- Insert rooms for Grand Plaza Hotel (hotel_id = 1)
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status) VALUES
-- Floor 1 - Standard rooms
(1, 1, '101', 1, 'available'),
(1, 1, '102', 1, 'available'),
(1, 2, '103', 1, 'available'),
(1, 2, '104', 1, 'available'),
(1, 5, '105', 1, 'available'),

-- Floor 2 - Standard and Deluxe
(1, 2, '201', 2, 'available'),
(1, 2, '202', 2, 'available'),
(1, 3, '203', 2, 'available'),
(1, 3, '204', 2, 'maintenance'),
(1, 2, '205', 2, 'available'),

-- Floor 3 - Premium rooms
(1, 3, '301', 3, 'available'),
(1, 3, '302', 3, 'available'),
(1, 4, '303', 3, 'available'),
(1, 3, '304', 3, 'available'),
(1, 3, '305', 3, 'available');

-- Insert rooms for Seaside Resort (hotel_id = 2)
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status) VALUES
-- Ocean view rooms
(2, 2, 'OV101', 1, 'available'),
(2, 2, 'OV102', 1, 'available'),
(2, 3, 'OV201', 2, 'available'),
(2, 3, 'OV202', 2, 'available'),
(2, 4, 'OV301', 3, 'available'),

-- Garden view rooms
(2, 1, 'GV101', 1, 'available'),
(2, 2, 'GV102', 1, 'available'),
(2, 2, 'GV201', 2, 'available'),
(2, 3, 'GV301', 3, 'available'),
(2, 5, 'GV102B', 1, 'available');

-- Insert rooms for Business Inn (hotel_id = 3)
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status) VALUES
-- Business rooms
(3, 2, 'B101', 1, 'available'),
(3, 2, 'B102', 1, 'available'),
(3, 2, 'B201', 2, 'available'),
(3, 3, 'B202', 2, 'available'),
(3, 3, 'B301', 3, 'available'),
(3, 1, 'B103', 1, 'available'),
(3, 1, 'B104', 1, 'available'),
(3, 5, 'B105', 1, 'out_of_order');

-- Insert test clients
INSERT INTO clients (first_name, last_name, email, phone, is_vip, vip_tier, vip_discount) VALUES
-- VIP clients
('John', 'Doe', 'vip1@example.com', '+1-555-1001', true, 'gold', 15.00),
('Jane', 'Smith', 'vip2@example.com', '+1-555-1002', true, 'gold', 15.00),
('Robert', 'Johnson', 'premium@hotel.com', '+1-555-1003', true, 'platinum', 20.00),
('Emily', 'Davis', 'gold@customer.com', '+1-555-1004', true, 'gold', 15.00),

-- Regular clients
('Michael', 'Brown', 'michael.brown@email.com', '+1-555-2001', false, 'standard', 0.00),
('Sarah', 'Wilson', 'sarah.wilson@email.com', '+1-555-2002', false, 'standard', 0.00),
('David', 'Miller', 'david.miller@email.com', '+1-555-2003', false, 'standard', 0.00),
('Lisa', 'Garcia', 'lisa.garcia@email.com', '+1-555-2004', false, 'standard', 0.00),
('James', 'Martinez', 'james.martinez@email.com', '+1-555-2005', false, 'standard', 0.00),
('Anna', 'Rodriguez', 'anna.rodriguez@email.com', '+1-555-2006', false, 'standard', 0.00);

-- Insert test bookings
INSERT INTO bookings (client_id, room_id, check_in_date, check_out_date, guest_count, 
                     original_price, total_price, vip_discount_applied, status, special_requests) VALUES

-- Active bookings
(1, 1, '2025-07-01', '2025-07-05', 1, 399.96, 339.97, 15.00, 'active', 'Late check-in requested'),
(2, 3, '2025-07-10', '2025-07-15', 2, 749.95, 637.46, 15.00, 'active', 'Ocean view preferred'),
(5, 5, '2025-07-03', '2025-07-07', 2, 319.96, 319.96, 0.00, 'active', NULL),
(6, 8, '2025-07-20', '2025-07-25', 2, 749.95, 749.95, 0.00, 'active', 'High floor requested'),

-- Future bookings
(3, 10, '2025-08-01', '2025-08-10', 4, 2699.91, 2159.93, 20.00, 'active', 'Anniversary celebration'),
(7, 15, '2025-08-15', '2025-08-18', 2, 449.97, 449.97, 0.00, 'active', NULL),
(4, 20, '2025-09-01', '2025-09-05', 2, 599.96, 509.97, 15.00, 'active', 'Business trip'),

-- Past completed bookings
(1, 2, '2025-06-01', '2025-06-03', 1, 199.98, 169.98, 15.00, 'completed', NULL),
(5, 6, '2025-05-15', '2025-05-20', 2, 399.95, 399.95, 0.00, 'completed', 'Enjoyed the stay'),
(8, 12, '2025-04-10', '2025-04-15', 1, 499.95, 499.95, 0.00, 'completed', NULL),

-- Cancelled booking
(9, 7, '2025-07-08', '2025-07-12', 2, 599.96, 599.96, 0.00, 'cancelled', 'Change of plans');

-- Update VIP check timestamps
UPDATE clients 
SET vip_checked_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE is_vip = true;

-- Create some room availability gaps for testing
-- Room 4 is in maintenance, Room 18 is out of order (already set in rooms insert)

-- Add some additional test scenarios
-- Double booking attempt prevention test data will be created via API calls during testing
