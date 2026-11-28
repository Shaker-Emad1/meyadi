-- 001: أعمدة الطابور
ALTER TABLE bookings ADD COLUMN arrived_at TEXT;
ALTER TABLE bookings ADD COLUMN called_at TEXT;
