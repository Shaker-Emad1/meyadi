// لوحة صاحب المحل (محمية بمفتاح) + عمليات: walkin / status / import / call / next / arrive
import { json, bad, checkKey, upsertCustomer } from '../../../_lib/db.js';
import { fmtMin, todayCairo, isValidEgyptPhone, bookingCode } from '../../../_lib/slots.js';
import { buildQueue } from '../../../_lib/queue.js';

export async function onRequestGet({ env, params, request }) {
  const key = new URL(request.url).searchParams.get('key') || '';
  const shop = await checkKey(env.DB, params.slug, key);
  if (!shop) return bad('مفتاح غلط', 403);
  const today = todayCairo();
  const { results: rows } = await env.DB.prepare(
    `SELECT b.*, s.name service, s.price_egp, st.name staff_name, c.name cust_name, c.phone, c.no_shows
     FROM bookings b JOIN services s ON s.id=b.service_id LEFT JOIN staff st ON st.id=b.staff_id
     JOIN customers c ON c.id=b.customer_id
     WHERE b.shop_id=? AND b.date=? AND b.status!='canceled' ORDER BY b.start_min`
  ).bind(shop.id, today).all();
  const tomorrow = todayCairo(new Date(Date.now() + 864e5));
  const { results: tmr } = await env.DB.prepare(
    `SELECT b.code, b.start_min, c.name, c.phone, s.name service FROM bookings b
     JOIN services s ON s.id=b.service_id JOIN customers c ON c.id=b.customer_id
     WHERE b.shop_id=? AND b.date=? AND b.status IN ('confirmed','pending_confirm') ORDER BY b.start_min`
  ).bind(shop.id, tomorrow).all();
  const { results: wl } = await env.DB.prepare(
    "SELECT w.date, c.name, c.phone FROM waitlist w JOIN customers c ON c.id=w.customer_id WHERE w.shop_id=? AND w.status='waiting' ORDER BY w.id LIMIT 20"
  ).bind(shop.id).all();
  const origin = new URL(request.url).origin;
  const wa = (phone, code, time) => {
    const txt = encodeURIComponent(`تذكير بميعادك بكرة الساعة ${time} في ${shop.name}. لتأكيد أو تغيير الميعاد: ${origin}/b/${code}`);
    return `https://wa.me/2${phone}?text=${txt}`;
  };
  const { results: svcs } = await env.DB.prepare(
    'SELECT id, name, duration_min, price_egp FROM services WHERE shop_id=? AND active=1 ORDER BY id'
  ).bind(shop.id).all();
  const d0 = new Date(today + 'T00:00:00Z');
  const back = (d0.getUTCDay() + 1) % 7;
  d0.setUTCDate(d0.getUTCDate() - back);
  const fmt = d => d.toISOString().slice(0, 10);
  const weekStart = fmt(d0);
  const dEnd = new Date(d0); dEnd.setUTCDate(dEnd.getUTCDate() + 6);
  const { results: wk } = await env.DB.prepare(
    `SELECT b.date, b.start_min, b.status, s.name service, st.name staff_name, c.name cust_name
     FROM bookings b JOIN services s ON s.id=b.service_id LEFT JOIN staff st ON st.id=b.staff_id
     JOIN customers c ON c.id=b.customer_id
     WHERE b.shop_id=? AND b.date>=? AND b.date<=? AND b.status!='canceled' ORDER BY b.date, b.start_min`
  ).bind(shop.id, weekStart, fmt(dEnd)).all();
  const q = await buildQueue(env.DB, shop, today);
  return json({
    ok: true, shop: { name: shop.name, slug: shop.slug, open_min: shop.open_min, close_min: shop.close_min, slot_step_min: shop.slot_step_min }, date: today,
    services: svcs,
    week_start: weekStart,
    week: wk.map(b => ({ date: b.date, time: fmtMin(b.start_min), service: b.service, staff: b.staff_name, customer: b.cust_name, status: b.status })),
    bookings: rows.map(b => ({ id: b.id, code: b.code, time: fmtMin(b.start_min), service: b.service,
      staff: b.staff_name, customer: b.cust_name, status: b.status, kind: b.kind, arrived: b.status === 'arrived',
      repeat_no_show: b.no_shows >= 2 })),
    queue: {
      now: q.now ? { id: q.now.id, name: q.now.customer, service: q.now.service, staff: q.now.staff || '', late_min: q.now.late_min, code: q.now.code } : null,
      waiting: q.waiting.map(b => ({ id: b.id, pos: b.pos, name: b.customer, service: b.service, start: fmtMin(b.start_min), eta: fmtMin(b.eta_min), arrived: b.status === 'arrived' })),
      stats: q.stats,
    },
    expected_egp: rows.filter(b => b.status !== 'no_show').reduce((a, b) => a + (b.free_loyalty ? 0 : b.price_egp), 0),
    tomorrow_reminders: tmr.map(b => ({ name: b.name, time: fmtMin(b.start_min), wa: wa(b.phone, b.code, fmtMin(b.start_min)) })),
    waitlist: wl,
  });
}

async function finish(env, shopId, bookingId, status) {
  const { results } = await env.DB.prepare('UPDATE bookings SET status=? WHERE id=? AND shop_id=? RETURNING customer_id')
    .bind(status, Number(bookingId), shopId).all();
  if (!results.length) return false;
  if (status === 'done')
    await env.DB.prepare('UPDATE customers SET visits=visits+1 WHERE id=?').bind(results[0].customer_id).run();
  if (status === 'no_show')
    await env.DB.prepare('UPDATE customers SET no_shows=no_shows+1 WHERE id=?').bind(results[0].customer_id).run();
  return true;
}

export async function onRequestPost({ env, params, request }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const shop = await checkKey(env.DB, params.slug, String(body.key || ''));
  if (!shop) return bad('مفتاح غلط', 403);

  if (body.op === 'walkin') {
    const svc = await env.DB.prepare('SELECT * FROM services WHERE id=? AND shop_id=?').bind(Number(body.service_id), shop.id).first();
    if (!svc) return bad('الخدمة مش موجودة', 404);
    const date = String(body.date || todayCairo());
    const start = Number(body.start_min);
    const cust = await upsertCustomer(env.DB, shop.id, String(body.name || 'Walk-in'), body.phone || '01000000000');
    try {
      await env.DB.prepare(
        "INSERT INTO bookings(shop_id,service_id,staff_id,customer_id,code,date,start_min,end_min,kind) VALUES(?,?,?,?,?,?,?,?,'walkin')"
      ).bind(shop.id, svc.id, body.staff_id ? Number(body.staff_id) : null, cust.id, bookingCode(), date, start, start + svc.duration_min).run();
    } catch (e) {
      if (String(e).includes('UNIQUE')) return bad('المعاد مش فاضي', 409);
      throw e;
    }
    return json({ ok: true });
  }

  if (body.op === 'status') {
    const okDone = await finish(env, shop.id, body.booking_id, String(body.status));
    if (!okDone) return bad('الحجز مش موجود', 404);
    return json({ ok: true });
  }

  if (body.op === 'arrive') {
    const { results } = await env.DB.prepare("UPDATE bookings SET status='arrived' WHERE id=? AND shop_id=? AND status IN ('confirmed','pending_confirm') RETURNING status")
      .bind(Number(body.booking_id), shop.id).all();
    if (!results.length) return bad('الحجز مش موجود', 404);
    return json({ ok: true });
  }

  // نداء الدور: اللي جوه يتقفل، واللي بعده يبقى جوه
  if (body.op === 'call') {
    const today = todayCairo();
    const cur = await env.DB.prepare("SELECT id FROM bookings WHERE shop_id=? AND date=? AND status='in_service' LIMIT 1").bind(shop.id, today).first();
    if (cur && cur.id !== Number(body.booking_id)) await finish(env, shop.id, cur.id, 'done');
    const { results } = await env.DB.prepare("UPDATE bookings SET status='in_service' WHERE id=? AND shop_id=? RETURNING id")
      .bind(Number(body.booking_id), shop.id).all();
    if (!results.length) return bad('الحجز مش موجود', 404);
    return json({ ok: true });
  }

  if (body.op === 'next') {
    const today = todayCairo();
    const cur = await env.DB.prepare("SELECT id FROM bookings WHERE shop_id=? AND date=? AND status='in_service' LIMIT 1").bind(shop.id, today).first();
    if (cur) await finish(env, shop.id, cur.id, 'done');
    // الأولوية: اللي أكد وصوله، وبعده الأقرب في الميعاد
    const next = await env.DB.prepare(
      `SELECT id FROM bookings WHERE shop_id=? AND date=? AND status IN ('confirmed','pending_confirm')
       ORDER BY (status='arrived') DESC, start_min, id LIMIT 1`
    ).bind(shop.id, today).first();
    if (!next) return json({ ok: true, called: null });
    await env.DB.prepare("UPDATE bookings SET status='in_service' WHERE id=?").bind(next.id).run();
    return json({ ok: true, called: next.id });
  }

  if (body.op === 'import') {
    const lines = String(body.csv || '').split('\n').map(l => l.trim()).filter(Boolean);
    let n = 0;
    for (const line of lines) {
      const [name, phone] = line.split(/[,\t]/).map(x => (x || '').trim());
      if (isValidEgyptPhone(phone)) { await upsertCustomer(env.DB, shop.id, name, phone); n++; }
    }
    return json({ ok: true, imported: n, skipped: lines.length - n });
  }
  return bad('عملية غير معروفة');
}
