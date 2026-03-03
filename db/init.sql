-- Mini-Shop Database Initialization Script
-- This script runs automatically when the Postgres container first starts

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items junction table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Seed data: Insert sample products
INSERT INTO items (name, description, price, stock) VALUES
    ('Wireless Mouse', 'Ergonomic wireless mouse with silent clicks and long battery life', 29.99, 50),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX switches', 89.99, 30),
    ('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 49.99, 75),
    ('Laptop Stand', 'Adjustable aluminum laptop stand for better ergonomics', 39.99, 40),
    ('Webcam HD', '1080p HD webcam with built-in microphone and privacy cover', 59.99, 25),
    ('Monitor Light Bar', 'LED monitor light bar to reduce eye strain', 34.99, 60),
    ('Desk Mat', 'Extended desk mat with stitched edges (900x400mm)', 24.99, 100),
    ('Cable Management Kit', 'Complete cable management kit with clips and sleeves', 19.99, 80),
    ('Bluetooth Speaker', 'Portable Bluetooth speaker with 12-hour battery', 44.99, 35),
    ('Phone Stand', 'Adjustable phone/tablet stand with weighted base', 14.99, 120)
ON CONFLICT DO NOTHING;

-- Insert a sample completed order for demonstration
INSERT INTO orders (status, total) VALUES ('completed', 119.98);

INSERT INTO order_items (order_id, item_id, quantity, price)
SELECT 1, id, 1, price FROM items WHERE name = 'Wireless Mouse'
UNION ALL
SELECT 1, id, 1, price FROM items WHERE name = 'Mechanical Keyboard';

-- Grant permissions (if needed for the app user)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO minishop;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO minishop;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
    RAISE NOTICE 'Inserted % items', (SELECT COUNT(*) FROM items);
END $$;
