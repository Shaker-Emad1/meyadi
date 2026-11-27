// الانضمام لقائمة الانتظار ليوم زحمة
import { json, bad, getShop, upsertCustomer } from '../../_lib/db.js';
import { isValidEgyptPhone } from '../../_lib/slots.js';

export async function onRequestPost({ env, params, request }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  if (!isValidEgyptPhone(body.phone)) return bad('رقم موبايل غير صحيح');
  const cust = await upsertCustomer(env.DB, shop.id, String(body.name || '').trim(), body.phone);
  await env.DB.prepare('INSERT INTO waitlist(shop_id,service_id,staff_id,customer_id,date) VALUES(?,?,?,?,?)')
    .bind(shop.id, Number(body.service_id), body.staff_id ? Number(body.staff_id) : null, cust.id, String(body.date)).run();
  return json({ ok: true, message: 'اتسجلت في قائمة الانتظار. لو حد لغى هيوصلك عرض بالمعاد.' });
}
