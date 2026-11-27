// تفاصيل حجز بكوده
import { json, bad } from '../../../_lib/db.js';
import { fmtMin } from '../../../_lib/slots.js';

export async function onRequestGet({ env, params }) {
  const b = await env.DB.prepare(
    `SELECT b.*, s.name service, s.price_egp, st.name staff_name, sh.name shop_name, sh.slug shop_slug, c.phone
     FROM bookings b JOIN services s ON s.id=b.service_id LEFT JOIN staff st ON st.id=b.staff_id
     JOIN shops sh ON sh.id=b.shop_id JOIN customers c ON c.id=b.customer_id WHERE b.code=?`
  ).bind(params.code).first();
  if (!b) return bad('الحجز مش موجود', 404);
  return json({ ok: true, booking: {
    code: b.code, shop: b.shop_name, shop_slug: b.shop_slug, service: b.service,
    staff: b.staff_name, date: b.date, time: fmtMin(b.start_min), start_min: b.start_min,
    price: b.free_loyalty ? 0 : b.price_egp, free: !!b.free_loyalty, status: b.status, kind: b.kind,
  }});
}
