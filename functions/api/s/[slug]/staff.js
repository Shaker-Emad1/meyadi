// جدول موظف واحد برقم سري (صلاحيات: كل موظف يشوف جدوله بس)
import { json, bad, getShop } from '../../_lib/db.js';
import { fmtMin, todayCairo } from '../../_lib/slots.js';

export async function onRequestGet({ env, params, request }) {
  const pin = new URL(request.url).searchParams.get('pin') || '';
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  const member = await env.DB.prepare('SELECT * FROM staff WHERE shop_id=? AND pin=? AND active=1').bind(shop.id, pin).first();
  if (!member) return bad('الرقم السري غلط', 403);
  const { results } = await env.DB.prepare(
    `SELECT b.date, b.start_min, b.status, s.name service, c.name customer FROM bookings b
     JOIN services s ON s.id=b.service_id JOIN customers c ON c.id=b.customer_id
     WHERE b.staff_id=? AND b.date >= ? AND b.status!='canceled' ORDER BY b.date, b.start_min LIMIT 50`
  ).bind(member.id, todayCairo()).all();
  return json({ ok: true, staff: member.name,
    bookings: results.map(b => ({ date: b.date, time: fmtMin(b.start_min), service: b.service, customer: b.customer, status: b.status })) });
}
