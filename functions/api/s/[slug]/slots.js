// المواعيد الفاضية ليوم وخدمة: GET ?date=YYYY-MM-DD&service=1&staff=any
import { json, bad, getShop, busyMap } from '../../_lib/db.js';
import { availableSlots, slotsForStaff, fmtMin, parseDaysOff, weekdayCairo, todayCairo } from '../../_lib/slots.js';

export async function onRequestGet({ env, params, request }) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || todayCairo();
  const serviceId = Number(url.searchParams.get('service'));
  const staffParam = url.searchParams.get('staff') || 'any';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('صيغة التاريخ YYYY-MM-DD');
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  if (parseDaysOff(shop.days_off).has(weekdayCairo(date))) return json({ ok: true, date, closed: true, slots: [] });
  const svc = await env.DB.prepare('SELECT * FROM services WHERE id=? AND shop_id=? AND active=1').bind(serviceId, shop.id).first();
  if (!svc) return bad('الخدمة مش موجودة', 404);
  const { results: staffRows } = await env.DB.prepare('SELECT id FROM staff WHERE shop_id=? AND active=1').bind(shop.id).all();
  const busy = await busyMap(env.DB, shop.id, date);
  let slots;
  if (staffParam === 'any') {
    slots = availableSlots({ openMin: shop.open_min, closeMin: shop.close_min, stepMin: shop.slot_step_min,
      durationMin: svc.duration_min, staffIds: staffRows.map(r => r.id), busyByStaff: busy });
  } else {
    const id = Number(staffParam);
    slots = slotsForStaff({ openMin: shop.open_min, closeMin: shop.close_min, stepMin: shop.slot_step_min,
      durationMin: svc.duration_min, busy: busy[id] || [] }).map(s => ({ ...s, staff_id: id }));
  }
  return json({ ok: true, date, closed: false, slots: slots.map(s => ({ ...s, label: fmtMin(s.start_min) })) });
}
