-- Fix Teacher Passwords Migration
-- Run this in Supabase SQL Editor to set teacher passwords

-- Update existing teachers or insert new ones with correct passwords
-- Using simple password hash for "123456"

INSERT INTO teachers (id, name, password_hash, phone, is_active, created_at, updated_at) VALUES
('T001', 'أ. محمد أحمد', 'hash_123456', '+20 100 123 4567', true, NOW(), NOW()),
('T002', 'أ. فاطمة علي', 'hash_123456', '+20 100 234 5678', true, NOW(), NOW()),
('T003', 'أ. حسن محمد', 'hash_123456', '+20 100 345 6789', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the teachers were created/updated
SELECT id, name, phone, is_active, created_at, updated_at
FROM teachers
WHERE id IN ('T001', 'T002', 'T003')
ORDER BY id;