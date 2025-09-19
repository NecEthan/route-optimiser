-- Window Cleaner Route Optimizer Database Schema (Simplified - No Appointments)
-- Run this script in PostgreSQL to create the database structure

-- Create database (run this command separately)
-- CREATE DATABASE window_cleaner_routes;

-- Connect to the database and run the following:

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    service_type VARCHAR(100) DEFAULT 'window_cleaning',
    frequency VARCHAR(50) DEFAULT 'monthly', -- weekly, monthly, quarterly, one-time
    price DECIMAL(10, 2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_location TEXT,
    start_latitude DECIMAL(10, 8),
    start_longitude DECIMAL(11, 8),
    end_location TEXT,
    end_latitude DECIMAL(10, 8),
    end_longitude DECIMAL(11, 8),
    total_distance DECIMAL(10, 2),
    estimated_duration INTEGER, -- in minutes
    status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_customers_location ON customers(latitude, longitude);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_routes_date ON routes(date);
CREATE INDEX idx_routes_status ON routes(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for testing)
INSERT INTO customers (name, address, latitude, longitude, phone, email, price, frequency) VALUES
('John Smith', '123 Main St, London', 51.5074, -0.1278, '+44 20 1234 5678', 'john@email.com', 25.00, 'monthly'),
('Sarah Johnson', '456 Oak Ave, London', 51.5155, -0.1426, '+44 20 2345 6789', 'sarah@email.com', 35.00, 'monthly'),
('Mike Wilson', '789 Pine Rd, London', 51.5033, -0.1195, '+44 20 3456 7890', 'mike@email.com', 30.00, 'weekly'),
('Emma Davis', '321 Elm St, London', 51.5117, -0.1391, '+44 20 4567 8901', 'emma@email.com', 40.00, 'monthly');

-- Sample route
INSERT INTO routes (name, date, start_location, start_latitude, start_longitude) VALUES
('Monday Route - Central London', '2024-01-15', 'Office - 100 Business St, London', 51.5074, -0.1278);
