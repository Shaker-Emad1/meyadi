import { parseDaysOff } from './slots.js';

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});
export const bad = (msg, status = 400) => json({ ok: false, error: msg }, status);

export async function getShop(db, slug) {
  return db.prepare('SELECT * FROM shops WHERE slug = ?').bind(slug).first();
}
export async function checkKey(db, slug, key) {
  const s = await getShop(db, slug);
  if (!s || s.admin_key !== key) return null;
  return s;
}
export async function shopContext(db, shop) {
  const [services, staff] = await Promise.all([
    db.prepare('SELECT id,name,duration_min,price_egp FROM services WHERE shop_id=? AND active=1').bind(shop.id).all(),
    db.prepare('SELECT id,name FROM staff WHERE shop_id=? AND active=1').bind(shop.id).all(),
  ]);
  return { services: services.results, staff: staff.results, daysOff: parseDaysOff(shop.days_off) };
}
export async function busyMap(db, shopId, date) {
  const { results } = await db.prepare(
    "SELECT staff_id,start_min,end_min FROM bookings WHERE shop_id=? AND date=? AND status IN ('confirmed','pending_confirm')"
  ).bind(shopId, date).all();
  const m = {};
  for (const b of results) (m[b.staff_id] ||= []).push(b);
  return m;
}
export async function upsertCustomer(db, shopId, name, phone) {
  const clean = String(phone).replace(/[\s-]/g, '');
  await db.prepare(
    `INSERT INTO customers(shop_id,phone,name) VALUES(?,?,?)
     ON CONFLICT(shop_id,phone) DO UPDATE SET name=COALESCE(excluded.name, customers.name)`
  ).bind(shopId, clean, name || null).run();
  return db.prepare('SELECT * FROM customers WHERE shop_id=? AND phone=?').bind(shopId, clean).first();
}
// بعد الإلغاء: أول منتظر في قائمة الانتظار لنفس اليوم يتبعتله عرض
export async function offerWaitlist(db, shopId, date) {
  const next = await db.prepare(
    "SELECT w.*, c.phone, c.name FROM waitlist w JOIN customers c ON c.id=w.customer_id WHERE w.shop_id=? AND w.date=? AND w.status='waiting' ORDER BY w.id LIMIT 1"
  ).bind(shopId, date).first();
  if (!next) return null;
  await db.prepare("UPDATE waitlist SET status='offered' WHERE id=?").bind(next.id).run();
  return next;
}
