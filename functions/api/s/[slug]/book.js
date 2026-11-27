// تنفيذ الحجز — منع التضارب بقيد فريد في قاعدة البيانات (الإدراج الفاشل = 409)
import { json, bad, getShop, busyMap, upsertCustomer } from '../../_lib/db.js';
import { pickFreeStaff, isValidEgyptPhone, fmtMin, bookingCode } from '../../_lib/slots.js';

export async function onRequestPost({ env, params, request }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  const { service_id, date, start_min } = body;
  if (!isValidEgyptPhone(body.phone)) return bad('رقم الموبايل لازم يكون مصري صحيح (01xxxxxxxxx)');
  const svc = await env.DB.prepare('SELECT * FROM services WHERE id=? AND shop_id=? AND active=1').bind(Number(service_id), shop.id).first();
  if (!svc) return bad('الخدمة مش موجودة', 404);
  const start = Number(start_min), end = start + svc.duration_min;
  const busy = await busyMap(env.DB, shop.id, date);

  let staffId;
  if (body.staff_id && body.staff_id !== 'any') {
    staffId = Number(body.staff_id);
    const clash = (busy[staffId] || []).some(b => start < b.end_min && end > b.start_min);
    if (clash) return bad('المعاد ده اتاحجز للتو، اختار معاد تاني', 409);
  } else {
    const { results } = await env.DB.prepare('SELECT id FROM staff WHERE shop_id=? AND active=1').bind(shop.id).all();
    staffId = pickFreeStaff({ staffIds: results.map(r => r.id), busyByStaff: busy, start_min: start, end_min: end });
    if (!staffId) return bad('مفيش موظف فاضي في المعاد ده', 409);
  }

  const cust = await upsertCustomer(env.DB, shop.id, String(body.name || '').trim(), body.phone);
  // الولاء: كل حجز عاشر مجاني
  const freeLoyalty = (cust.visits + 1) % 10 === 0 ? 1 : 0;
  // منع الغياب: العميل المتكرر الغياب محتاج تأكيد
  const status = cust.no_shows >= 2 ? 'pending_confirm' : 'confirmed';
  const code = bookingCode();
  try {
    await env.DB.prepare(
      `INSERT INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,status,source,kind,free_loyalty)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(shop.id, svc.id, staffId, cust.id, code, date, start, end, status,
      String(body.source || ''), 'online', freeLoyalty).run();
  } catch (e) {
    if (String(e).includes('UNIQUE')) return bad('المعاد ده اتاحجز للتو، اختار معاد تاني', 409);
    throw e;
  }
  const staff = await env.DB.prepare('SELECT name FROM staff WHERE id=?').bind(staffId).first();
  return json({
    ok: true, code, status,
    free: !!freeLoyalty,
    needs_confirm: status === 'pending_confirm',
    booking: { date, time: fmtMin(start), service: svc.name, staff: staff ? staff.name : '', price: freeLoyalty ? 0 : svc.price_egp },
  });
}
