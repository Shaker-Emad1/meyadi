// الطابور اللايف: GET حالة الطابور، POST تأكيد وصول العميل
import { json, bad, getShop } from '../../../_lib/db.js';
import { buildQueue, maskName, ticketState } from '../../../_lib/queue.js';
import { fmtMin, todayCairo } from '../../../_lib/slots.js';

const publicRow = (b) => ({
  pos: b.pos, code: b.code, name: maskName(b.customer), service: b.service,
  staff: b.staff || '', start: fmtMin(b.start_min), eta: fmtMin(b.eta_min),
  wait_min: b.wait_min, arrived: b.status === 'arrived',
});

export async function onRequestGet({ env, params, request }) {
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || todayCairo();
  const q = await buildQueue(env.DB, shop, date);
  const code = url.searchParams.get('code') || '';
  const mine = code ? ticketState(q, code) : null;
  return json({
    ok: true, date, now_min: q.nowMin,
    now: q.now ? { code: q.now.code, name: maskName(q.now.customer), service: q.now.service, staff: q.now.staff || '', start: fmtMin(q.now.start_min), late_min: q.now.late_min } : null,
    waiting: q.waiting.map(publicRow),
    stats: q.stats,
    mine: mine ? { ...mine, eta: mine.eta_min ? fmtMin(mine.eta_min) : '' } : null,
  });
}

export async function onRequestPost({ env, params, request }) {
  let body; try { body = await request.json(); } catch { return bad('JSON مش صالح'); }
  const shop = await getShop(env.DB, params.slug);
  if (!shop) return bad('المحل مش موجود', 404);
  const code = String(body.code || '').trim().toUpperCase();
  const b = await env.DB.prepare('SELECT * FROM bookings WHERE code=? AND shop_id=?').bind(code, shop.id).first();
  if (!b) return bad('الحجز مش موجود', 404);

  if (body.action === 'arrive') {
    await env.DB.prepare("UPDATE bookings SET status='arrived' WHERE id=? AND status IN ('confirmed','pending_confirm')").bind(b.id).run();
    const q = await buildQueue(env.DB, shop, b.date);
    const st = ticketState(q, code);
    return json({ ok: true, state: st.state, pos: st.pos, wait_min: st.wait_min, eta: st.eta_min ? fmtMin(st.eta_min) : '' });
  }
  if (body.action === 'leave') {
    await env.DB.prepare("UPDATE bookings SET status='canceled' WHERE id=? AND status IN ('confirmed','pending_confirm','arrived')").bind(b.id).run();
    return json({ ok: true });
  }
  return bad('إجراء غير معروف');
}
