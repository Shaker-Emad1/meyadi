-- ميعادي · multi-shop appointment booking · D1 (SQLite) schema
CREATE TABLE IF NOT EXISTS shops(
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  phone TEXT,
  address TEXT,
  admin_key TEXT UNIQUE NOT NULL,
  slot_step_min INTEGER NOT NULL DEFAULT 30,
  open_min INTEGER NOT NULL DEFAULT 720,   -- 12:00
  close_min INTEGER NOT NULL DEFAULT 1320, -- 22:00
  days_off TEXT NOT NULL DEFAULT '5',      -- JS weekday numbers, 5=Friday
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS services(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  price_egp INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS staff(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  pin TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS customers(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  phone TEXT NOT NULL,
  name TEXT,
  no_shows INTEGER NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(shop_id, phone)
);
CREATE TABLE IF NOT EXISTS bookings(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  staff_id INTEGER REFERENCES staff(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  code TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,        -- YYYY-MM-DD (shop local)
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed|pending_confirm|done|no_show|canceled
  source TEXT,
  kind TEXT NOT NULL DEFAULT 'online',      -- online|walkin
  free_loyalty INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- منع الحجز المزدوج: موعد واحد نشط لكل موظف في نفس الوقت
CREATE UNIQUE INDEX IF NOT EXISTS one_active_slot
  ON bookings(shop_id, staff_id, date, start_min)
  WHERE status IN ('confirmed','pending_confirm');
CREATE TABLE IF NOT EXISTS waitlist(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  staff_id INTEGER,
  customer_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting|offered|taken|expired
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reviews(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL,
  booking_id INTEGER UNIQUE NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS coupons(
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  pct INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(shop_id, code)
);
