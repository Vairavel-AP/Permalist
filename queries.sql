-- Permalist v2 - Upgraded Schema
-- Run this in your PostgreSQL database

-- Drop old table if upgrading
-- DROP TABLE IF EXISTS items;

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category VARCHAR(50) DEFAULT 'General',
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO items (title, priority, category, due_date) VALUES
  ('Buy milk', 'low', 'Shopping', NOW() + INTERVAL '1 day'),
  ('Finish homework', 'high', 'Study', NOW() + INTERVAL '2 days'),
  ('Call doctor', 'medium', 'Health', NOW() + INTERVAL '3 days'),
  ('Read a book', 'low', 'Personal', NULL);
