// محرك الطابور: بيحسب مين جوه، مين مستني، والدور المتوقع لكل واحد.
// كود نقي على قد ما نقدر عشان يتست بسهولة.
import { fmtMin, todayCairo } from './slots.js';

export function nowCairoMin(d = new Date()) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const h = Number(p.find(x => x.type === 'hour').value) % 24;
  const m = Number(p.find(x => x.type === 'minute').value);
  return h * 60 + m;
}

export function maskName(name) {
  const parts = String(name || 'عميل').trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + parts[1].charAt(0) + '.';
}

// يبني حالة الطابور من صفوف الحجوزات
export function computeQueue(rows, nowMin) {
  const active = rows.filter(b => ['confirmed', 'pending_confirm', 'in_service'].includes(b.status));
  const inService = active.find(b => b.status === 'in_service') || null;
  const waiting = active.filter(b => b !== inService);
  let cursor = inService ? Math.max(nowMin, inService.end_min) : nowMin;
  const queue = waiting.map((b, i) => {
    const eta = cursor;
    cursor += b.duration_min || (b.end_min - b.start_min) || 30;
    return { ...b, pos: i + 1, eta_min: eta, wait_min: Math.max(0, eta - nowMin) };
  });
  const done = rows.filter(b => b.status === 'done').length;
  const noShow = rows.filter(b => b.status === 'no_show').length;
  const total = rows.filter(b => b.status !== 'canceled').length;
  const avgWait = queue.length ? Math.round(queue.reduce((a, b) => a + b.wait_min, 0) / queue.length) : 0;
  return {
    now: inService ? { ...inService, late_min: Math.max(0, nowMin - inService.start_min) } : null,
    waiting: queue,
    stats: {
      waiting: queue.length, total, done, no_show: noShow,
      avg_wait_min: avgWait,
      behind_min: inService ? Math.max(0, nowMin - inService.start_min) : 0,
    },
    nowMin,
  };
}

export async function buildQueue(db, shop, date = todayCairo()) {
  const { results } = await db.prepare(
    `SELECT b.id, b.code, b.start_min, b.end_min, b.status, b.arrived_at, b.kind, b.staff_id,
            s.name service, s.duration_min, s.price_egp,
            st.name staff, c.name customer
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     LEFT JOIN staff st ON st.id = b.staff_id
     JOIN customers c ON c.id = b.customer_id
     WHERE b.shop_id = ? AND b.date = ?
       AND b.status IN ('confirmed','pending_confirm','in_service','done','no_show')
     ORDER BY b.start_min, b.id`
  ).bind(shop.id, date).all();
  const nowMin = nowCairoMin();
  const q = computeQueue(results, nowMin);
  return {
    date, ...q,
    rows: results.map(b => ({
      code: b.code, pos: 0, name: maskName(b.customer), service: b.service,
      staff: b.staff || '', start: fmtMin(b.start_min), status: b.status, arrived: !!b.arrived_at,
    })),
  };
}

// الدور بتاع كود معين: رقمه في الطابور، أو "جوه" لو بيتم خدمته
export function ticketState(queue, code) {
  if (queue.now && queue.now.code === code) return { state: 'serving', pos: 0, eta_min: queue.nowMin, wait_min: 0 };
  const w = queue.waiting.find(b => b.code === code);
  if (w) return { state: 'waiting', pos: w.pos, eta_min: w.eta_min, wait_min: w.wait_min };
  return { state: 'other', pos: 0, eta_min: 0, wait_min: 0 };
}
