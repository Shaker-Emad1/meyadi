// إجراءات على حجز: cancel | confirm | move | review — التحقق برقم موبايل العميل
import { json, bad, offerWaitlist } from '../../../_lib/db.js';

async function load(env, code) {
  return env.DB.prepare('SELECT b.*, c.phone, c.id cid FROM bookings b JOIN customers c ON c.id=b.customer_id WHERE b.code=?').bind(code).first();
}

export async function onRequestPost({ env, params, request }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const b = await load(env, params.code);
  if (!b) return bad('الحجز مش موجود', 404);
  const phone = String(body.phone || '').replace(/[\s-]/g, '');
  if (phone !== b.phone) return bad('رقم الموبايل مش مطابق للحجز', 403);

  if (body.action === 'cancel') {
    if (b.status === 'canceled') return json({ ok: true, status: 'canceled' });
    await env.DB.prepare("UPDATE bookings SET status='canceled' WHERE id=?").bind(b.id).run();
    const offered = await offerWaitlist(env.DB, b.shop_id, b.date);
    return json({ ok: true, status: 'canceled', waitlist_offered: !!offered });
  }
  if (body.action === 'confirm') {
    if (b.status !== 'pending_confirm') return json({ ok: true, status: b.status });
    await env.DB.prepare("UPDATE bookings SET status='confirmed' WHERE id=?").bind(b.id).run();
    return json({ ok: true, status: 'confirmed' });
  }
  if (body.action === 'move') {
    const { date, start_min } = body;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return bad('التاريخ مش صحيح');
    const dur = b.end_min - b.start_min;
    try {
      // نقل آمن: التحديث نفسه محمي بالقيد الفريد
      await env.DB.prepare('UPDATE bookings SET date=?, start_min=?, end_min=? WHERE id=?')
        .bind(date, Number(start_min), Number(start_min) + dur, b.id).run();
    } catch (e) {
      if (String(e).includes('UNIQUE')) return bad('المعاد الجديد مش فاضي', 409);
      throw e;
    }
    return json({ ok: true, status: b.status, date, start_min: Number(start_min) });
  }
  if (body.action === 'review') {
    if (b.status !== 'done') return bad('التقييم بيتاح بعد الزيارة بس');
    const rating = Math.max(1, Math.min(5, Number(body.rating)));
    try {
      await env.DB.prepare('INSERT INTO reviews(shop_id,booking_id,rating,text) VALUES(?,?,?,?)')
        .bind(b.shop_id, b.id, rating, String(body.text || '').slice(0, 500)).run();
    } catch (e) {
      if (String(e).includes('UNIQUE')) return bad('قيمت الحجز ده قبل كده');
      throw e;
    }
    return json({ ok: true });
  }
  return bad('إجراء غير معروف');
}
